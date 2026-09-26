import { act, renderHook, waitFor } from "@testing-library/react";
import { makeFullResumeData } from "@/test-utils/fixtures";
import type { ResumeData } from "@/lib/types";
import { PDF_RENDER_DEBOUNCE_MS, useResumePdf } from "./useResumePdf";

/** Each render call gets a promise the test settles by hand, to control the
 * order renders finish in. */
const mockPending: { data: ResumeData; resolve: (blob: Blob) => void; reject: (e: Error) => void }[] = [];

jest.mock("../pdf/renderResumePdf", () => ({
  renderResumePdf: jest.fn(
    (data: ResumeData) =>
      new Promise<Blob>((resolve, reject) => {
        mockPending.push({ data, resolve, reject });
      }),
  ),
}));

const blobFor = (label: string) => new Blob([label], { type: "application/pdf" });

beforeEach(() => {
  mockPending.length = 0;
});

describe("useResumePdf", () => {
  it("does nothing while disabled", async () => {
    renderHook(() => useResumePdf(makeFullResumeData(), false));
    await act(async () => {
      await new Promise((r) => setTimeout(r, PDF_RENDER_DEBOUNCE_MS + 20));
    });
    expect(mockPending).toHaveLength(0);
  });

  it("renders straight away when enabled, then publishes the blob", async () => {
    const { result } = renderHook(() => useResumePdf(makeFullResumeData(), true));
    await waitFor(() => expect(mockPending).toHaveLength(1));
    expect(result.current.status).toBe("rendering");
    const blob = blobFor("first");
    await act(async () => mockPending[0].resolve(blob));
    expect(result.current.status).toBe("ready");
    expect(result.current.blob).toBe(blob);
  });

  it("never lets a slower, older render overwrite a newer one", async () => {
    const first = makeFullResumeData();
    const second = makeFullResumeData({ templateId: "oxford" });
    const { result, rerender } = renderHook(({ data }) => useResumePdf(data, true), { initialProps: { data: first } });
    await waitFor(() => expect(mockPending).toHaveLength(1));

    rerender({ data: second });
    await waitFor(() => expect(mockPending).toHaveLength(2), { timeout: PDF_RENDER_DEBOUNCE_MS + 500 });

    const newer = blobFor("newer");
    await act(async () => mockPending[1].resolve(newer));
    await act(async () => mockPending[0].resolve(blobFor("stale")));

    expect(result.current.blob).toBe(newer);
    expect(result.current.status).toBe("ready");
  });

  it("latestBlob() renders the current data if the background render hasn't caught up", async () => {
    const first = makeFullResumeData();
    const edited = makeFullResumeData({ templateId: "oxford" });
    const { result, rerender } = renderHook(({ data }) => useResumePdf(data, true), { initialProps: { data: first } });
    await waitFor(() => expect(mockPending).toHaveLength(1));
    await act(async () => mockPending[0].resolve(blobFor("old")));

    // Edit, then download before the debounce fires.
    rerender({ data: edited });
    let promise!: Promise<Blob>;
    act(() => {
      promise = result.current.latestBlob();
    });
    await waitFor(() => expect(mockPending).toHaveLength(2));
    expect(mockPending[1].data).toBe(edited);
    const fresh = blobFor("fresh");
    await act(async () => mockPending[1].resolve(fresh));
    await expect(promise).resolves.toBe(fresh);
  });

  it("latestBlob() reuses the render already made for the current data", async () => {
    const data = makeFullResumeData();
    const { result } = renderHook(() => useResumePdf(data, true));
    await waitFor(() => expect(mockPending).toHaveLength(1));
    const blob = blobFor("current");
    await act(async () => mockPending[0].resolve(blob));
    await expect(result.current.latestBlob()).resolves.toBe(blob);
    expect(mockPending).toHaveLength(1);
  });

  it("reports a failed render and keeps the last good blob", async () => {
    const first = makeFullResumeData();
    const { result, rerender } = renderHook(({ data }) => useResumePdf(data, true), { initialProps: { data: first } });
    await waitFor(() => expect(mockPending).toHaveLength(1));
    const good = blobFor("good");
    await act(async () => mockPending[0].resolve(good));

    rerender({ data: makeFullResumeData({ templateId: "oxford" }) });
    await waitFor(() => expect(mockPending).toHaveLength(2), { timeout: PDF_RENDER_DEBOUNCE_MS + 500 });
    await act(async () => mockPending[1].reject(new Error("font failed")));

    expect(result.current.status).toBe("error");
    expect(result.current.error?.message).toBe("font failed");
    expect(result.current.blob).toBe(good);
  });

  it("waits the caller's quiet period before re-rendering an edit", async () => {
    const first = makeFullResumeData();
    const { rerender } = renderHook(({ data }) => useResumePdf(data, true, 50), { initialProps: { data: first } });
    await waitFor(() => expect(mockPending).toHaveLength(1));
    rerender({ data: makeFullResumeData({ templateId: "oxford" }) });
    expect(mockPending).toHaveLength(1);
    await waitFor(() => expect(mockPending).toHaveLength(2), { timeout: 500 });
  });

  it("tags each rendered PDF with the template it was made from", async () => {
    const { result } = renderHook(() => useResumePdf(makeFullResumeData({ templateId: "ember" }), true));
    await waitFor(() => expect(mockPending).toHaveLength(1));
    await act(async () => mockPending[0].resolve(blobFor("ember")));
    expect(result.current.templateId).toBe("ember");
  });

  it("renders a template switch straight away, skipping the typing pause", async () => {
    const first = makeFullResumeData({ templateId: "atlas" });
    const { rerender } = renderHook(({ data }) => useResumePdf(data, true, 5_000), { initialProps: { data: first } });
    await waitFor(() => expect(mockPending).toHaveLength(1));
    rerender({ data: makeFullResumeData({ templateId: "ember" }) });
    await waitFor(() => expect(mockPending).toHaveLength(2), { timeout: 500 });
    expect(mockPending[1].data.templateId).toBe("ember");
  });
});

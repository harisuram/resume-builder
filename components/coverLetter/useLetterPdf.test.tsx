import { act, renderHook, waitFor } from "@testing-library/react";
import type { LetterContent } from "@/lib/coverLetter";
import { useCoverLetterStore } from "@/lib/coverLetterStore";
import { useBuilderStore } from "@/lib/store";
import type { ResumeData } from "@/lib/types";
import { setLetterTemplate, useLetterPdf, useLetterTemplate } from "./useLetterPdf";

const mockRender = jest.fn<Promise<Blob>, [ResumeData, string | undefined, LetterContent | undefined]>(
  async () => new Blob(["%PDF"], { type: "application/pdf" }),
);
jest.mock("../pdf/renderResumePdf", () => ({
  renderResumePdf: (data: ResumeData, fontBaseUrl?: string, letter?: LetterContent) => mockRender(data, fontBaseUrl, letter),
}));

beforeEach(() => {
  localStorage.clear();
  mockRender.mockClear();
  act(() => {
    useBuilderStore.getState().resetStore();
    useBuilderStore.getState().setTemplateId("atlas");
    useCoverLetterStore.getState().resetStore();
  });
});

describe("letter template", () => {
  it("follows the resume's template until the letter picks its own", () => {
    const { result } = renderHook(() => useLetterTemplate());
    expect(result.current).toEqual({ templateId: "atlas", resumeTemplateId: "atlas", matchesResume: true });

    act(() => useBuilderStore.getState().setTemplateId("ledger"));
    expect(result.current.templateId).toBe("ledger");

    act(() => setLetterTemplate("fern"));
    expect(result.current).toEqual({ templateId: "fern", resumeTemplateId: "ledger", matchesResume: false });
    act(() => useBuilderStore.getState().setTemplateId("atlas"));
    expect(result.current.templateId).toBe("fern");
  });

  it("picking the resume's own template goes back to following it, and is saved", () => {
    act(() => setLetterTemplate("fern"));
    expect(JSON.parse(localStorage.getItem("coverLetterData")!).templateId).toBe("fern");
    act(() => setLetterTemplate("atlas"));
    expect(useCoverLetterStore.getState().letter.templateId).toBeNull();
    expect(JSON.parse(localStorage.getItem("coverLetterData")!).templateId).toBeNull();
  });
});

describe("useLetterPdf", () => {
  it("renders the letter with the resume's details in the letter's template", async () => {
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Ada Lovelace" });
      useCoverLetterStore.getState().update({ position: "Designer" });
      useCoverLetterStore.getState().updateParagraph("opening", "Hello.");
      setLetterTemplate("fern");
    });
    const { result } = renderHook(() => useLetterPdf(true, 0));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const [data, , letter] = mockRender.mock.calls.at(-1)!;
    expect(data).toMatchObject({ templateId: "fern", basicInfo: { name: "Ada Lovelace" } });
    expect(letter).toMatchObject({ subject: "Re: Designer", paragraphs: ["Hello."] });
    expect(result.current.templateId).toBe("fern");
  });

  it("re-renders when the letter changes, and not before it's enabled", async () => {
    const { result, rerender } = renderHook(({ on }) => useLetterPdf(on, 0), { initialProps: { on: false } });
    await act(async () => {});
    expect(mockRender).not.toHaveBeenCalled();

    rerender({ on: true });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const calls = mockRender.mock.calls.length;
    act(() => useCoverLetterStore.getState().updateParagraph("opening", "Changed."));
    await waitFor(() => expect(mockRender.mock.calls.length).toBe(calls + 1));
    expect(mockRender.mock.calls.at(-1)![2]?.paragraphs).toEqual(["Changed."]);
  });

  it("latestBlob reuses the render already made for the current letter", async () => {
    const { result } = renderHook(() => useLetterPdf(true, 0));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const calls = mockRender.mock.calls.length;
    await act(async () => {
      await result.current.latestBlob();
    });
    expect(mockRender.mock.calls.length).toBe(calls);
  });
});

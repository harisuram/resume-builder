import { render, screen, waitFor } from "@testing-library/react";
import { dismissBuilderTour } from "@/lib/builderTour";
import { DETECTED_COUNTRY_KEY } from "@/lib/geo";
import { saveResumeData } from "@/lib/storage";
import { useBuilderStore } from "@/lib/store";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { BuilderShell } from "./BuilderShell";

jest.mock("../pdf/renderResumePdf", () => ({
  renderResumePdf: async () => new Blob(["%PDF-shell"], { type: "application/pdf" }),
}));

const fetchMock = jest.fn();

beforeEach(() => {
  localStorage.clear();
  dismissBuilderTour();
  useBuilderStore.getState().resetStore();
  fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ country: "GB" }) });
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("BuilderShell country detection", () => {
  it("looks the country up once, saves it, and pre-fills the phone dial code", async () => {
    render(<BuilderShell />);
    await waitFor(() => expect(useBuilderStore.getState().basicInfo.phoneCountryCode).toBe("+44"));
    expect(fetchMock).toHaveBeenCalledWith("/api/geo", expect.anything());
    expect(localStorage.getItem(DETECTED_COUNTRY_KEY)).toBe("GB");
  });

  it("uses the saved country without asking again", async () => {
    localStorage.setItem(DETECTED_COUNTRY_KEY, "AE");
    render(<BuilderShell />);
    await waitFor(() => expect(useBuilderStore.getState().basicInfo.phoneCountryCode).toBe("+971"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never re-labels a phone number the user already typed", async () => {
    const saved = makeFullResumeData();
    saved.basicInfo.phoneCountryCode = undefined;
    saveResumeData(saved);
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    await waitFor(() => expect(localStorage.getItem(DETECTED_COUNTRY_KEY)).toBe("GB"));
    expect(useBuilderStore.getState().basicInfo.phoneCountryCode).toBeUndefined();
  });

  it("keeps working when the lookup fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<BuilderShell />);
    expect(await screen.findByRole("heading", { name: "Basic info" })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(useBuilderStore.getState().basicInfo.phoneCountryCode).toBeUndefined();
  });
});

import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { emptyCoverLetter, loadCoverLetter, saveCoverLetter, type LetterContent } from "@/lib/coverLetter";
import { useCoverLetterStore } from "@/lib/coverLetterStore";
import { loadResumeData, saveResumeData } from "@/lib/storage";
import { useBuilderStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";
import type { CoverLetterData, ResumeData } from "@/lib/types";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { CoverLetterShell } from "./CoverLetterShell";

const mockRender = jest.fn<Promise<Blob>, [ResumeData, string | undefined, LetterContent | undefined]>(
  async () => new Blob(["%PDF-letter"], { type: "application/pdf" }),
);
jest.mock("../pdf/renderResumePdf", () => ({
  renderResumePdf: (data: ResumeData, fontBaseUrl?: string, letter?: LetterContent) => mockRender(data, fontBaseUrl, letter),
}));
jest.mock("../builder/PdfEnginePreview", () => ({
  PdfEnginePreview: ({ pdf }: { pdf: { status: string } }) => <div data-testid="pdf-engine-preview">{pdf.status}</div>,
}));

let saved: { download: string }[] = [];

beforeEach(() => {
  localStorage.clear();
  mockRender.mockClear();
  saved = [];
  Object.assign(URL, { createObjectURL: jest.fn(() => "blob:letter"), revokeObjectURL: jest.fn() });
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    saved.push({ download: this.download });
  });
  act(() => {
    useBuilderStore.getState().resetStore();
    useCoverLetterStore.getState().resetStore();
    useToastStore.getState().clear();
  });
});

afterEach(() => jest.restoreAllMocks());

function nav() {
  return within(screen.getByRole("navigation", { name: "Cover letter sections" }));
}

function toasts() {
  return useToastStore.getState().toasts.map((t) => t.message);
}

function savedLetter(patch: Partial<CoverLetterData> = {}) {
  saveCoverLetter({ ...emptyCoverLetter(), ...patch });
}

async function renderWithResume() {
  saveResumeData(makeFullResumeData());
  render(<CoverLetterShell />);
  await screen.findByRole("heading", { name: "Recipient" });
}

describe("CoverLetterShell", () => {
  it("opens on Your details when there's no resume yet, and lists every letter step", async () => {
    render(<CoverLetterShell />);
    expect(await screen.findByText(/These come from your resume/)).toBeInTheDocument();
    for (const label of ["Your details", "Recipient", "Greeting", "Opening", "Why you're interested", "Skills & experience", "Achievements", "Why you're a good fit", "Closing", "Download"]) {
      expect(nav().getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(nav().getByText("Required")).toBeInTheDocument();
  });

  it("loads the saved resume's details and starts on Recipient", async () => {
    await renderWithResume();
    expect(useBuilderStore.getState().basicInfo.name).toBe("Alexandra Montgomery-Whitfield");
    expect(nav().getByText("Complete")).toBeInTheDocument();
  });

  it("restores a saved letter", async () => {
    savedLetter({ company: "Northwind" });
    await renderWithResume();
    expect(screen.getByLabelText("Company", { selector: "input" })).toHaveValue("Northwind");
  });

  it("toasts when the saved letter can't be read", async () => {
    localStorage.setItem("coverLetterData", "{broken");
    render(<CoverLetterShell />);
    await waitFor(() => expect(toasts()).toContain("Couldn't restore the saved cover letter — the copy on this device looks damaged."));
  });

  it("holds Save & Next on Recipient until company and position are filled, then saves and moves on", async () => {
    await renderWithResume();
    const next = screen.getByRole("button", { name: /Save & Next/ });
    expect(next).toBeDisabled();
    expect(screen.getByText("Add the company and the position you're applying for to continue.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Company", { selector: "input" }), "Northwind");
    await userEvent.type(screen.getByLabelText("Position you're applying for"), "Designer");
    // Re-queried: the button remounts with its "ready" animation once valid.
    await userEvent.click(screen.getByRole("button", { name: /Save & Next/ }));

    expect(await screen.findByRole("heading", { name: "Greeting" })).toBeInTheDocument();
    expect(loadCoverLetter()).toMatchObject({ company: "Northwind", position: "Designer" });
  });

  it("Skip switches the paragraph off, saves, and moves to the next one", async () => {
    savedLetter({ company: "N", position: "D" });
    await renderWithResume();
    await userEvent.click(nav().getByRole("button", { name: "Opening" }));
    await userEvent.click(screen.getByRole("button", { name: /^Skip$/ }));

    expect(await screen.findByRole("heading", { name: "Why you're interested" })).toBeInTheDocument();
    expect(useCoverLetterStore.getState().letter.paragraphs[0]).toMatchObject({ id: "opening", skipped: true });
    expect(loadCoverLetter()?.paragraphs[0].skipped).toBe(true);
    // Back steps over the skipped paragraph.
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("heading", { name: "Greeting" })).toBeInTheDocument();
  });

  it("shows an Include button on a switched-off paragraph", async () => {
    savedLetter({ paragraphs: emptyCoverLetter().paragraphs.map((p) => (p.id === "fit" ? { ...p, skipped: true } : p)) });
    await renderWithResume();
    await userEvent.click(nav().getByRole("button", { name: "Why you're a good fit" }));
    await userEvent.click(screen.getByRole("button", { name: "Include Why you're a good fit" }));
    expect(useCoverLetterStore.getState().letter.paragraphs.at(-1)?.skipped).toBe(false);
    expect(screen.getByLabelText("Paragraph")).toBeInTheDocument();
  });

  it("adds a custom paragraph from the sidebar, opens it, and removes it again", async () => {
    await renderWithResume();
    await userEvent.click(nav().getByRole("button", { name: /Add paragraph/ }));
    expect(await screen.findByRole("heading", { name: "Custom paragraph" })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Paragraph name"), "Referral");
    expect(nav().getByRole("button", { name: "Referral" })).toBeInTheDocument();
    expect(loadCoverLetter()?.paragraphs).toHaveLength(6);

    await userEvent.click(screen.getByRole("button", { name: "Remove this paragraph" }));
    expect(await screen.findByRole("heading", { name: "Closing" })).toBeInTheDocument();
    expect(nav().queryByRole("button", { name: "Referral" })).not.toBeInTheDocument();
  });

  it("Clear empties just the current step after confirming", async () => {
    savedLetter({ company: "Northwind", position: "Designer", greeting: "Hi team," });
    await renderWithResume();
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Clear section" }));
    expect(useCoverLetterStore.getState().letter).toMatchObject({ company: "", position: "", greeting: "Hi team," });
  });

  it("Start new letter clears only the letter — the resume stays", async () => {
    savedLetter({ company: "Northwind" });
    await renderWithResume();
    await userEvent.click(screen.getByRole("button", { name: "Start new cover letter" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear and start over" }));
    expect(localStorage.getItem("coverLetterData")).toBeNull();
    expect(useCoverLetterStore.getState().letter.company).toBe("");
    expect(loadResumeData()?.basicInfo.name).toBe("Alexandra Montgomery-Whitfield");
  });

  it("saves the resume too when Your details is completed here", async () => {
    render(<CoverLetterShell />);
    await screen.findByText(/These come from your resume/);
    await userEvent.type(screen.getByLabelText(/Full name/), "Ada Lovelace");
    await userEvent.type(screen.getByLabelText(/Email/), "ada@example.com");
    await userEvent.type(screen.getByLabelText(/Location/), "London");
    await userEvent.click(screen.getByRole("button", { name: /Save & Next/ }));
    expect(await screen.findByRole("heading", { name: "Recipient" })).toBeInTheDocument();
    expect(loadResumeData()?.basicInfo).toMatchObject({ name: "Ada Lovelace", email: "ada@example.com", location: "London" });
  });

  describe("download step", () => {
    async function openDownload(letter: Partial<CoverLetterData> = {}) {
      savedLetter(letter);
      await renderWithResume();
      await userEvent.click(nav().getByRole("button", { name: "Download" }));
      await screen.findByRole("heading", { name: "Preview & download" });
    }

    it("won't download a letter with no paragraphs", async () => {
      await openDownload();
      await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));
      expect(toasts()).toContain("Write at least one paragraph before downloading.");
      expect(saved).toEqual([]);
    });

    it("downloads the letter, in the resume's template, named after the sender", async () => {
      await openDownload({
        company: "Northwind",
        position: "Designer",
        paragraphs: [{ id: "opening", text: "Hello there." }, { id: "interest", text: "Not this.", skipped: true }],
      });
      expect(screen.getByLabelText("File name")).toHaveValue("alexandra_montgomery_whitfield_cover_letter");
      await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

      await waitFor(() => expect(saved).toEqual([{ download: "alexandra_montgomery_whitfield_cover_letter.pdf" }]));
      const [data, , letter] = mockRender.mock.calls.at(-1)!;
      expect(data.templateId).toBe(makeFullResumeData().templateId);
      expect(letter).toMatchObject({ subject: "Re: Designer", paragraphs: ["Hello there."] });
      expect(loadCoverLetter()?.company).toBe("Northwind");
    });

    it("lets the letter take its own template without touching the resume's, then match again", async () => {
      await openDownload({ paragraphs: [{ id: "opening", text: "Hi." }] });
      const resumeTemplate = useBuilderStore.getState().templateId;
      expect(screen.getAllByText(/Matches your resume/)[0]).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Use Ledger template" }));

      expect(useCoverLetterStore.getState().letter.templateId).toBe("ledger");
      expect(useBuilderStore.getState().templateId).toBe(resumeTemplate);
      expect(loadCoverLetter()?.templateId).toBe("ledger");
      await waitFor(() => expect(mockRender.mock.calls.at(-1)![0].templateId).toBe("ledger"));

      await userEvent.click(screen.getAllByRole("button", { name: /Match my resume/ })[0]);
      expect(useCoverLetterStore.getState().letter.templateId).toBeNull();
    });

    it("links back to the resume, saving the letter on the way", async () => {
      await openDownload({ company: "Northwind" });
      act(() => useCoverLetterStore.getState().update({ position: "Designer" }));
      const link = screen.getByRole("link", { name: /Back to your resume/ });
      expect(link).toHaveAttribute("href", "/builder");
      link.addEventListener("click", (event) => event.preventDefault());
      await userEvent.click(link);
      expect(loadCoverLetter()).toMatchObject({ company: "Northwind", position: "Designer" });
    });

    it("has no other way out to the resume in the letter builder's header", async () => {
      await openDownload();
      expect(within(screen.getByRole("banner")).queryByRole("link", { name: /resume$/i })).not.toBeInTheDocument();
    });

    it("tells the rail it restyles the letter, not the resume", async () => {
      await openDownload();
      expect(screen.getByText("Tap any design to restyle your letter. Your resume keeps its own.")).toBeInTheDocument();
    });
  });

  it("opens the phone menu with the letter's own steps", async () => {
    await renderWithResume();
    await userEvent.click(screen.getByRole("button", { name: "Open sections menu" }));
    const menu = await screen.findByRole("dialog", { name: "Sections" });
    expect(within(menu).getByRole("navigation", { name: "Cover letter sections" })).toBeInTheDocument();
    expect(within(menu).queryByRole("navigation", { name: "Resume sections" })).not.toBeInTheDocument();
  });

  it("opens the preview sheet on the letter's preview", async () => {
    await renderWithResume();
    await userEvent.click(screen.getByRole("button", { name: "Preview resume" }));
    expect(screen.getByRole("dialog", { name: "Cover letter preview" })).toBeInTheDocument();
  });
});

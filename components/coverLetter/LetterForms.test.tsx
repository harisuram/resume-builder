import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiLimitError, enhanceCoverLetterParagraph } from "@/lib/ai";
import { useCoverLetterStore } from "@/lib/coverLetterStore";
import { useBuilderStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";
import { makeFullResumeData } from "@/test-utils/fixtures";
import type { LetterParagraph } from "@/lib/types";
import { ClosingForm, GreetingForm, ParagraphForm, RecipientForm } from "./LetterForms";

jest.mock("../../lib/ai", () => ({
  AiLimitError: class AiLimitError extends Error {},
  AI_LIMITED_UNTIL_KEY: "ai-optimize-limited-until",
  AI_BACKOFF_MS: 4 * 60 * 60 * 1000,
  AI_MESSAGES: { unavailable: "AI unavailable" },
  enhanceCoverLetterParagraph: jest.fn(),
}));
const mockEnhance = enhanceCoverLetterParagraph as jest.Mock;

beforeEach(() => {
  localStorage.clear();
  mockEnhance.mockReset();
  act(() => {
    useBuilderStore.getState().resetStore();
    useCoverLetterStore.getState().resetStore();
    useToastStore.getState().clear();
  });
});

const letter = () => useCoverLetterStore.getState().letter;
const paragraph = (id: string) => letter().paragraphs.find((p) => p.id === id)!;

/** Renders the form for one paragraph, following the store as it changes. */
function ParagraphStep({ id }: { id: LetterParagraph["id"] }) {
  const p = useCoverLetterStore((s) => s.letter.paragraphs.find((x) => x.id === id));
  return p ? <ParagraphForm paragraph={p} onRemoved={() => {}} /> : <p>removed</p>;
}

describe("RecipientForm", () => {
  it("writes each field to the letter", async () => {
    render(<RecipientForm />);
    await userEvent.type(screen.getByLabelText("Company", { selector: "input" }), "Northwind");
    await userEvent.type(screen.getByLabelText("Position you're applying for"), "Designer");
    await userEvent.type(screen.getByLabelText("Hiring manager's name"), "Dana");
    await userEvent.type(screen.getByLabelText("Their title"), "Head of Design");
    await userEvent.type(screen.getByLabelText("Company address"), "1 Market St{enter}SF");
    expect(letter()).toMatchObject({
      company: "Northwind",
      position: "Designer",
      recipientName: "Dana",
      recipientTitle: "Head of Design",
      companyAddress: "1 Market St\nSF",
    });
  });

  it("offers Use today only once the date has been changed", async () => {
    render(<RecipientForm />);
    expect(screen.queryByRole("button", { name: "Use today" })).not.toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Date"));
    await userEvent.type(screen.getByLabelText("Date"), "1 Jan 2027");
    await userEvent.click(screen.getByRole("button", { name: "Use today" }));
    expect(screen.getByLabelText("Date")).not.toHaveValue("1 Jan 2027");
  });

  it("adds up to four extra details and removes them", async () => {
    render(<RecipientForm />);
    const add = () => screen.getByRole("button", { name: "+ Add detail" });
    for (let i = 0; i < 4; i++) await userEvent.click(add());
    expect(screen.queryByRole("button", { name: "+ Add detail" })).not.toBeInTheDocument();
    await userEvent.type(screen.getAllByLabelText("Label")[0], "Job reference");
    await userEvent.type(screen.getAllByLabelText("Value")[0], "ENG-1");
    expect(letter().fields[0]).toEqual({ label: "Job reference", value: "ENG-1" });
    await userEvent.click(screen.getByRole("button", { name: "Remove Job reference" }));
    expect(letter().fields).toHaveLength(3);
    expect(add()).toBeInTheDocument();
  });
});

describe("GreetingForm", () => {
  it("suggests the recipient's name and the company team, and picks one", async () => {
    act(() => useCoverLetterStore.getState().update({ recipientName: "Dana Rivera", company: "Northwind" }));
    render(<GreetingForm />);
    expect(screen.getByRole("button", { name: "Dear Hiring Manager," })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Dear Dana Rivera," }));
    expect(letter().greeting).toBe("Dear Dana Rivera,");
    expect(screen.getByRole("button", { name: "Dear Northwind team," })).toBeInTheDocument();
  });
});

describe("ParagraphForm", () => {
  it("shows the guided paragraph's help and writes its text", async () => {
    render(<ParagraphStep id="opening" />);
    expect(screen.getByRole("heading", { name: "Opening" })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Paragraph"), "Hello.");
    expect(paragraph("opening").text).toBe("Hello.");
    expect(screen.getByText("6 / 1200 characters")).toBeInTheDocument();
  });

  it("enhances the paragraph with AI, sending its purpose and the role", async () => {
    mockEnhance.mockResolvedValue("A sharper opening.");
    act(() => {
      useCoverLetterStore.getState().update({ position: "Designer", company: "Northwind" });
      useCoverLetterStore.getState().updateParagraph("opening", "rough opening");
    });
    render(<ParagraphStep id="opening" />);
    await userEvent.click(screen.getByRole("button", { name: /Enhance with AI/ }));
    await waitFor(() => expect(paragraph("opening").text).toBe("A sharper opening."));
    expect(mockEnhance).toHaveBeenCalledWith({ section: "Opening", text: "rough opening", position: "Designer", company: "Northwind" });
  });

  it("keeps the AI button disabled with nothing to rewrite", () => {
    render(<ParagraphStep id="opening" />);
    expect(screen.getByRole("button", { name: /Enhance with AI/ })).toBeDisabled();
  });

  it("hides AI for a while once the free quota is used up, and leaves the text alone", async () => {
    mockEnhance.mockRejectedValue(new AiLimitError("Quota used up"));
    act(() => useCoverLetterStore.getState().updateParagraph("opening", "mine"));
    render(<ParagraphStep id="opening" />);
    await userEvent.click(screen.getByRole("button", { name: /Enhance with AI/ }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /Enhance with AI/ })).not.toBeInTheDocument());
    expect(paragraph("opening").text).toBe("mine");
    expect(Number(localStorage.getItem("ai-optimize-limited-until"))).toBeGreaterThan(Date.now());
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain("Quota used up");
  });

  it("toasts a failed rewrite and keeps the button", async () => {
    mockEnhance.mockRejectedValue(new Error("Busy right now"));
    act(() => useCoverLetterStore.getState().updateParagraph("opening", "mine"));
    render(<ParagraphStep id="opening" />);
    await userEvent.click(screen.getByRole("button", { name: /Enhance with AI/ }));
    await waitFor(() => expect(useToastStore.getState().toasts.map((t) => t.message)).toContain("Busy right now"));
    expect(screen.getByRole("button", { name: /Enhance with AI/ })).toBeEnabled();
  });

  it("suggests resume lines on Achievements — once each — and appends the one tapped", async () => {
    const resume = makeFullResumeData();
    const repeated = "Cut costs by 30%.";
    act(() =>
      useBuilderStore.getState().loadFromData({
        ...resume,
        sections: {
          ...resume.sections,
          keyAchievements: [repeated, repeated],
          experience: [{ company: "A", role: "B", startDate: "2020-01", bullets: [repeated] }],
        },
      }),
    );
    act(() => useCoverLetterStore.getState().updateParagraph("achievements", "I deliver."));
    render(<ParagraphStep id="achievements" />);
    expect(screen.getAllByRole("button", { name: repeated })).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: repeated }));
    expect(paragraph("achievements").text).toBe(`I deliver. ${repeated}`);
  });

  it("suggests roles and skills on Skills & experience", () => {
    const resume = makeFullResumeData();
    act(() =>
      useBuilderStore.getState().loadFromData({
        ...resume,
        sections: { ...resume.sections, skills: ["Figma", "SQL"], experience: [{ company: "Northwind", role: "Designer", startDate: "2020-01", bullets: [] }] },
      }),
    );
    render(<ParagraphStep id="skills" />);
    expect(screen.getByRole("button", { name: "As Designer at Northwind," })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "My core skills include Figma, SQL." })).toBeInTheDocument();
  });

  it("lets a custom paragraph be named and removed; guided ones can't be removed", async () => {
    let id = "" as LetterParagraph["id"];
    act(() => {
      id = useCoverLetterStore.getState().addParagraph();
    });
    const onRemoved = jest.fn();
    function Custom() {
      const p = useCoverLetterStore((s) => s.letter.paragraphs.find((x) => x.id === id));
      return p ? <ParagraphForm paragraph={p} onRemoved={onRemoved} /> : null;
    }
    render(<Custom />);
    expect(screen.getByRole("heading", { name: "Custom paragraph" })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Paragraph name"), "Referral");
    expect(screen.getByRole("heading", { name: "Referral" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove this paragraph" }));
    expect(letter().paragraphs.some((p) => p.id === id)).toBe(false);
    expect(onRemoved).toHaveBeenCalled();
  });

  it("guided paragraphs have no name field or remove button", () => {
    render(<ParagraphStep id="fit" />);
    expect(screen.queryByLabelText("Paragraph name")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove this paragraph" })).not.toBeInTheDocument();
  });
});

describe("ClosingForm", () => {
  it("writes the closing, picks a sign-off, and shows who signs", async () => {
    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Ada Lovelace" }));
    render(<ClosingForm />);
    await userEvent.type(screen.getByLabelText(/Closing statement/), "Thanks.");
    await userEvent.click(screen.getByRole("button", { name: "Kind regards," }));
    expect(letter()).toMatchObject({ closing: "Thanks.", signOff: "Kind regards," });
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("enhances the closing statement with AI", async () => {
    mockEnhance.mockResolvedValue("Thank you for considering me.");
    act(() => useCoverLetterStore.getState().update({ closing: "thx" }));
    render(<ClosingForm />);
    await userEvent.click(screen.getByRole("button", { name: /Enhance with AI/ }));
    await waitFor(() => expect(letter().closing).toBe("Thank you for considering me."));
    expect(mockEnhance.mock.calls[0][0]).toMatchObject({ section: "Closing statement", text: "thx" });
  });
});

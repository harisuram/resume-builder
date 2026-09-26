import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportResumeButton, ResumeImportProvider } from "./ResumeImport";
import { importResumeFromFile } from "../../lib/resumeImport/fromFile";
import type { ImportTarget } from "../../lib/resumeImport/synonyms";
import { useBuilderStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";

jest.mock("../../lib/resumeImport/fromFile", () => ({
  importResumeFromFile: jest.fn(),
  ResumeFileError: class ResumeFileError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ResumeFileError";
    }
  },
}));

const mockImport = importResumeFromFile as jest.MockedFunction<typeof importResumeFromFile>;

beforeEach(() => {
  localStorage.clear();
  useBuilderStore.getState().resetStore();
  useToastStore.getState().clear();
  mockImport.mockReset();
});

function fileInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

function renderImport(onReviewSection?: (key: ImportTarget) => void) {
  return render(<ResumeImportProvider onReviewSection={onReviewSection} />);
}

describe("Import resume button", () => {
  it("opens the file picker for PDF, Word and text resumes", async () => {
    render(
      <ResumeImportProvider>
        <ImportResumeButton />
      </ResumeImportProvider>,
    );
    const click = jest.spyOn(fileInput(), "click");
    await userEvent.click(screen.getByRole("button", { name: "Import resume" }));
    expect(click).toHaveBeenCalled();
    expect(fileInput().accept).toMatch(/\.pdf/);
    expect(fileInput().accept).toMatch(/\.docx/);
  });

  it("imports the chosen file into the builder", async () => {
    mockImport.mockResolvedValue({
      basicInfo: { name: "Jamie", email: "jamie@example.com", phone: "", location: "Austin, TX", links: {} },
      sections: { skills: ["TypeScript"] },
      filled: ["basicInfo", "skills"],
    });
    render(
      <ResumeImportProvider>
        <ImportResumeButton />
      </ResumeImportProvider>,
    );
    await userEvent.upload(fileInput(), new File(["x"], "jamie.pdf", { type: "application/pdf" }));
    await waitFor(() => expect(useBuilderStore.getState().basicInfo.name).toBe("Jamie"));
    expect(useBuilderStore.getState().sections.skills).toEqual(["TypeScript"]);
  });

  it("stands out in the header with the accent fill", () => {
    render(
      <ResumeImportProvider>
        <ImportResumeButton />
      </ResumeImportProvider>,
    );
    expect(screen.getByRole("button", { name: "Import resume" }).className).toContain("bg-[var(--color-accent)]");
  });

  it("renders nothing outside the import provider", () => {
    render(<ImportResumeButton />);
    expect(screen.queryByRole("button", { name: "Import resume" })).not.toBeInTheDocument();
  });
});

describe("resume import", () => {
  it("imports a dropped file into the store", async () => {
    mockImport.mockResolvedValue({
      basicInfo: { name: "Jamie", email: "jamie@example.com", phone: "", location: "Austin, TX", links: {} },
      sections: { skills: ["TypeScript"] },
      filled: ["basicInfo", "skills"],
    });
    renderImport();

    expect(screen.queryByRole("button", { name: "Choose file" })).not.toBeInTheDocument();

    const file = new File(["Jamie\nSkills\nTypeScript"], "jamie.txt", { type: "text/plain" });
    await userEvent.upload(fileInput(), file);

    await waitFor(() => expect(useBuilderStore.getState().basicInfo.name).toBe("Jamie"));
    expect(JSON.parse(localStorage.getItem("resumeData")!).basicInfo.name).toBe("Jamie");
    expect(useBuilderStore.getState().hasSavedCopy).toBe(true);
    expect(useBuilderStore.getState().sections.skills).toEqual(["TypeScript"]);
    expect(useBuilderStore.getState().sectionStatus.experience).toBe("not_started");
    expect(await screen.findByText(/Filled 2 sections/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Basic info" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skills" })).toBeInTheDocument();
  });

  it("opens a filled section from the recap", async () => {
    const onReviewSection = jest.fn();
    mockImport.mockResolvedValue({
      basicInfo: { name: "Jamie", email: "jamie@example.com", phone: "", location: "Austin, TX", links: {} },
      sections: { skills: ["TypeScript"] },
      filled: ["basicInfo", "skills"],
    });
    renderImport(onReviewSection);

    const file = new File(["Jamie\nSkills\nTypeScript"], "jamie.txt", { type: "text/plain" });
    await userEvent.upload(fileInput(), file);
    await userEvent.click(await screen.findByRole("button", { name: "Skills" }));
    expect(onReviewSection).toHaveBeenCalledWith("skills");
  });

  it("closes the summary by itself after ten seconds, pausing while hovered", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockImport.mockResolvedValue({
      basicInfo: { name: "Jamie", email: "jamie@example.com", phone: "", location: "Austin, TX", links: {} },
      sections: { skills: ["TypeScript"] },
      filled: ["basicInfo", "skills"],
    });
    renderImport();
    await user.upload(fileInput(), new File(["x"], "jamie.txt", { type: "text/plain" }));
    const card = await screen.findByRole("status", { name: "Resume imported" });
    expect(card).toHaveTextContent("Closes in 10s");

    act(() => jest.advanceTimersByTime(4000));
    expect(card).toHaveTextContent("Closes in 6s");

    // Hovering pauses the countdown…
    await user.hover(card);
    expect(card).toHaveTextContent("Paused");
    act(() => jest.advanceTimersByTime(20_000));
    expect(screen.getByRole("status", { name: "Resume imported" })).toBeInTheDocument();

    // …and leaving resumes it from where it stopped.
    await user.unhover(card);
    act(() => jest.advanceTimersByTime(5500));
    expect(screen.getByRole("status", { name: "Resume imported" })).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.queryByRole("status", { name: "Resume imported" })).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("closes the summary from its close button", async () => {
    mockImport.mockResolvedValue({
      basicInfo: { name: "Jamie", email: "jamie@example.com", phone: "", location: "Austin, TX", links: {} },
      sections: {},
      filled: ["basicInfo"],
    });
    renderImport();
    await userEvent.upload(fileInput(), new File(["x"], "jamie.txt", { type: "text/plain" }));
    await userEvent.click(await screen.findByRole("button", { name: "Close import summary" }));
    expect(screen.queryByRole("status", { name: "Resume imported" })).not.toBeInTheDocument();
  });

  it("imports a file handed over from the home page as soon as the builder opens", async () => {
    mockImport.mockResolvedValue({
      basicInfo: { name: "Jamie", email: "jamie@example.com", phone: "", location: "Austin, TX", links: {} },
      sections: { skills: ["Go"] },
      filled: ["basicInfo", "skills"],
    });
    const file = new File(["x"], "jamie.pdf", { type: "application/pdf" });
    const { rerender } = render(<ResumeImportProvider initialFile={file} />);
    await waitFor(() => expect(useBuilderStore.getState().basicInfo.name).toBe("Jamie"));
    expect(mockImport).toHaveBeenCalledWith(file, expect.any(Function));
    // The same file isn't imported twice on a re-render.
    rerender(<ResumeImportProvider initialFile={file} />);
    expect(mockImport).toHaveBeenCalledTimes(1);
  });

  it("asks before replacing an existing draft", async () => {
    useBuilderStore.getState().updateBasicInfo({ name: "Existing" });
    mockImport.mockResolvedValue({
      basicInfo: { name: "Jamie", email: "jamie@example.com", phone: "", location: "Austin, TX", links: {} },
      sections: {},
      filled: ["basicInfo"],
    });
    renderImport();

    const file = new File(["Jamie"], "jamie.txt", { type: "text/plain" });
    await userEvent.upload(fileInput(), file);

    expect(await screen.findByRole("dialog", { name: "Replace the current draft with this file?" })).toBeInTheDocument();
    expect(mockImport).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Replace and import" }));
    await waitFor(() => expect(mockImport).toHaveBeenCalled());
    await waitFor(() => expect(useBuilderStore.getState().basicInfo.name).toBe("Jamie"));
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResumeImportProvider } from "./ResumeImport";
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

describe("resume import", () => {
  it("imports a dropped file into the store", async () => {
    mockImport.mockResolvedValue({
      basicInfo: { name: "Jamie", email: "jamie@example.com", phone: "", location: "Austin, TX", links: {} },
      sections: { skills: ["TypeScript"] },
      filled: ["basicInfo", "skills"],
    });
    renderImport();

    expect(screen.queryByRole("button", { name: "Import resume" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Choose file" })).not.toBeInTheDocument();

    const file = new File(["Jamie\nSkills\nTypeScript"], "jamie.txt", { type: "text/plain" });
    await userEvent.upload(fileInput(), file);

    await waitFor(() => expect(useBuilderStore.getState().basicInfo.name).toBe("Jamie"));
    expect(JSON.parse(localStorage.getItem("resumeData")!).basicInfo.name).toBe("Jamie");
    expect(useBuilderStore.getState().hasSavedCopy).toBe(true);
    expect(useBuilderStore.getState().sections.skills).toEqual(["TypeScript"]);
    expect(useBuilderStore.getState().sectionStatus.experience).toBe("skipped");
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

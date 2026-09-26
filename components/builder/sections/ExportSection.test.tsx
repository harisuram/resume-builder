import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";
import { ToastHost } from "@/components/ui/Toast";
import type { ResumeData } from "@/lib/types";
import { ExportSection } from "./ExportSection";

const renderedPdf = async (): Promise<Blob> => new Blob(["%PDF-engine"], { type: "application/pdf" });
const mockRenderResumePdf = jest.fn<Promise<Blob>, [ResumeData]>(renderedPdf);
jest.mock("../../pdf/renderResumePdf", () => ({
  renderResumePdf: (data: ResumeData) => mockRenderResumePdf(data),
}));
// The canvas preview has its own tests; here it only needs to show that the
// export step renders it and what state the PDF is in.
jest.mock("../PdfEnginePreview", () => ({
  PdfEnginePreview: ({ pdf }: { pdf: { status: string } }) => <div data-testid="pdf-engine-preview">{pdf.status}</div>,
}));

const createObjectURL = jest.fn(() => "blob:resume");
const revokeObjectURL = jest.fn();
/** Every download the export step starts, as the temporary link it clicked. */
let saved: { href: string; download: string }[] = [];

beforeEach(() => {
  mockRenderResumePdf.mockReset().mockImplementation(renderedPdf);
  saved = [];
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    saved.push({ href: this.href, download: this.download });
  });
  localStorage.clear();
  (window.print as jest.Mock).mockClear();
  act(() => {
    useBuilderStore.getState().resetStore();
    useToastStore.getState().clear();
  });
});

afterEach(() => jest.restoreAllMocks());

const COMPLETE_BASIC = {
  name: "Jamie Rivera",
  email: "jamie@example.com",
  location: "Austin, TX",
};

function fillCompleteBasicInfo() {
  act(() => {
    useBuilderStore.getState().updateBasicInfo(COMPLETE_BASIC);
  });
}

function renderExport() {
  return render(
    <>
      <ExportSection />
      <ToastHost />
    </>,
  );
}

async function clickDownload() {
  await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));
}

describe("ExportSection", () => {
  it("hides download until at least one field is filled", () => {
    renderExport();
    expect(screen.queryByRole("button", { name: "Download PDF" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("File name")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("enables download once a basic-info field is filled", () => {
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
    });
    renderExport();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();
    expect(screen.getByLabelText("File name")).toBeInTheDocument();
  });

  it("enables download once any content-section field is filled", () => {
    act(() => {
      useBuilderStore.getState().setSkills(["TypeScript"]);
    });
    renderExport();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();
  });

  it("hides download again if every field is cleared", () => {
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
      useBuilderStore.getState().setSkills(["TypeScript"]);
    });
    renderExport();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();

    act(() => {
      useBuilderStore.getState().clearBasicInfo();
      useBuilderStore.getState().setSkills([]);
    });

    expect(screen.queryByRole("button", { name: "Download PDF" })).not.toBeInTheDocument();
  });

  it("never shows a save prompt on the export step", () => {
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
      useBuilderStore.getState().setSkills(["TypeScript"]);
    });
    renderExport();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("toasts and does not download when required basic info is missing", async () => {
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
    });
    renderExport();
    await clickDownload();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Fill in your name, email, and location in Basic info before downloading.",
    );
    expect(saved).toHaveLength(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("toasts when basic info is filled but invalid", async () => {
    act(() => {
      useBuilderStore.getState().updateBasicInfo({
        name: "Jamie Rivera",
        email: "not-an-email",
        location: "Austin, TX",
      });
    });
    renderExport();
    await clickDownload();

    expect(screen.getByRole("alert")).toHaveTextContent("Fix the highlighted fields in Basic info before downloading.");
    expect(saved).toHaveLength(0);
  });

  it("downloads the PDF directly — no print dialog — for every template family", async () => {
    fillCompleteBasicInfo();
    renderExport();
    for (const id of ["atlas", "ember", "twin", "dossier"]) {
      act(() => useBuilderStore.getState().setTemplateId(id));
      await clickDownload();
      await waitFor(() => expect(saved.at(-1)?.download).toBe("jamie_rivera.pdf"));
      expect(mockRenderResumePdf).toHaveBeenLastCalledWith(expect.objectContaining({ templateId: id }));
    }
    expect(saved).toHaveLength(4);
    expect(window.print).not.toHaveBeenCalled();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("saves the PDF the preview shows, rather than rendering a second one", async () => {
    fillCompleteBasicInfo();
    renderExport();
    await waitFor(() => expect(screen.getByTestId("pdf-engine-preview")).toHaveTextContent("ready"));
    expect(screen.getByText(/page breaks match the download exactly/)).toBeInTheDocument();

    await clickDownload();
    await waitFor(() => expect(saved).toHaveLength(1));
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockRenderResumePdf).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith("blob:resume"));
  });

  it("saves a copy of the resume on download without asking", async () => {
    fillCompleteBasicInfo();
    renderExport();
    await clickDownload();

    await waitFor(() => expect(saved).toHaveLength(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("resumeData")!).basicInfo.name).toBe("Jamie Rivera");
    expect(useBuilderStore.getState().hasSavedCopy).toBe(true);
  });

  it("keeps the existing saved copy up to date when downloading", async () => {
    localStorage.setItem("resumeData", JSON.stringify({ basicInfo: { name: "Stale" } }));
    act(() => {
      useBuilderStore.getState().updateBasicInfo(COMPLETE_BASIC);
      useBuilderStore.getState().setSkills(["TypeScript"]);
      useBuilderStore.getState().setHasSavedCopy(true);
    });
    renderExport();
    await clickDownload();

    await waitFor(() => expect(saved).toHaveLength(1));
    expect(JSON.parse(localStorage.getItem("resumeData")!).basicInfo.name).toBe("Jamie Rivera");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("toasts when saving the resume to this device fails, then still downloads", async () => {
    fillCompleteBasicInfo();
    renderExport();
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    await clickDownload();
    expect(screen.getByRole("alert")).toHaveTextContent(/Storage may be full/);
    await waitFor(() => expect(saved).toHaveLength(1));
    spy.mockRestore();
  });

  it("toasts instead of saving when the PDF can't be built", async () => {
    mockRenderResumePdf.mockRejectedValue(new Error("font failed"));
    fillCompleteBasicInfo();
    renderExport();
    await clickDownload();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Couldn't build the PDF. Try again."));
    expect(saved).toHaveLength(0);
  });

  it("does not offer a Word download", () => {
    renderExport();
    expect(screen.queryByRole("button", { name: /Word/i })).not.toBeInTheDocument();
    expect(screen.queryByText(".docx")).not.toBeInTheDocument();
  });

  describe("editable file name", () => {
    beforeEach(() => {
      fillCompleteBasicInfo();
    });

    it("defaults to a slug of the resume's name", () => {
      renderExport();
      expect(screen.getByLabelText("File name")).toHaveValue("jamie_rivera");
    });

    it("lets the user type freely (no slugifying mid-keystroke) and slugifies on blur", async () => {
      renderExport();
      const input = screen.getByLabelText("File name");
      await userEvent.clear(input);
      await userEvent.type(input, "Senior Engineer Resume 2026");
      expect(input).toHaveValue("Senior Engineer Resume 2026");

      await userEvent.tab();
      expect(input).toHaveValue("senior_engineer_resume_2026");
    });

    it("saves the file under the edited name", async () => {
      renderExport();
      const input = screen.getByLabelText("File name");
      await userEvent.clear(input);
      await userEvent.type(input, "my resume");
      await clickDownload();
      await waitFor(() => expect(saved.at(-1)?.download).toBe("my_resume.pdf"));
    });

    it("keeps the edited name even if the resume's own name field changes afterward", async () => {
      renderExport();
      const input = screen.getByLabelText("File name");
      await userEvent.clear(input);
      await userEvent.type(input, "sticky name");
      await userEvent.tab();

      act(() => {
        useBuilderStore.getState().updateBasicInfo({ name: "A Totally Different Name" });
      });

      expect(screen.getByLabelText("File name")).toHaveValue("sticky_name");
    });

    it("falls back to 'resume' if cleared entirely", async () => {
      renderExport();
      const input = screen.getByLabelText("File name");
      await userEvent.clear(input);
      await userEvent.tab();
      expect(input).toHaveValue("resume");
    });
  });
});

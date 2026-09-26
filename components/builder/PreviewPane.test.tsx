import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { PreviewPane } from "./PreviewPane";
import type { ResumeData } from "@/lib/types";

const mockRenderResumePdf = jest.fn<Promise<Blob>, [ResumeData]>(async () => new Blob(["%PDF-live"]));
jest.mock("../pdf/renderResumePdf", () => ({
  renderResumePdf: (data: ResumeData) => mockRenderResumePdf(data),
}));
jest.mock("./PdfEnginePreview", () => ({
  PdfEnginePreview: ({ pdf }: { pdf: { status: string } }) => <div data-testid="pdf-engine-preview">{pdf.status}</div>,
}));

beforeEach(() => {
  mockRenderResumePdf.mockClear();
  useBuilderStore.getState().resetStore();
});

describe("PreviewPane empty template preview", () => {
  it("shows sample text of the selected template with non-skipped section titles", () => {
    render(<PreviewPane />);
    expect(screen.getByRole("region", { name: "Atlas template preview" })).toBeInTheDocument();
    expect(document.querySelector("[data-sample-resume='atlas']")).not.toBeNull();
    expect(document.querySelector("[data-template-skeleton]")).toBeNull();
    expect(screen.getAllByText("Alexandra Montgomery-Whitfield")[0]).toBeInTheDocument();
    expect(document.querySelector("[data-section-key='experience']")).not.toBeNull();
    expect(document.querySelector("[data-section-key='patents']")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Choose a template" })).toHaveTextContent("Change template");
    expect(screen.getByText(/this is a sample of/i)).toBeInTheDocument();
  });

  it("omits skipped sections from the sample preview", () => {
    useBuilderStore.getState().toggleSkipSection("patents");
    useBuilderStore.getState().toggleSkipSection("summary");
    render(<PreviewPane />);
    expect(document.querySelector("[data-section-key='patents']")).toBeNull();
    expect(document.querySelector("[data-section-key='summary']")).toBeNull();
    expect(document.querySelector("[data-section-key='experience']")).not.toBeNull();
  });

  it("opens the template picker from the placeholder callout", async () => {
    render(<PreviewPane />);
    await userEvent.click(screen.getByRole("button", { name: "Change template" }));
    expect(screen.getByRole("listbox", { name: "Templates" })).toBeInTheDocument();
  });

  it("replaces the sample with the live resume once a section has content", async () => {
    useBuilderStore.getState().setSkills(["TypeScript"]);
    render(<PreviewPane />);
    expect(screen.queryByRole("region", { name: /template preview/i })).not.toBeInTheDocument();
    expect(document.querySelector("[data-sample-resume]")).toBeNull();
    expect(screen.getByRole("button", { name: "Choose a template" })).toHaveTextContent(/^Template/);
    await waitFor(() => expect(screen.getByTestId("pdf-engine-preview")).toHaveTextContent("ready"));
  });

  it("replaces the sample as soon as a name is typed", async () => {
    useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
    render(<PreviewPane />);
    expect(screen.queryByRole("region", { name: /template preview/i })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(mockRenderResumePdf).toHaveBeenCalledWith(
        expect.objectContaining({ basicInfo: expect.objectContaining({ name: "Jamie Rivera" }) }),
      ),
    );
  });

  it("replaces the sample as soon as a photo is added", async () => {
    useBuilderStore.getState().setPhoto("data:image/jpeg;base64,abc");
    render(<PreviewPane />);
    expect(screen.queryByRole("region", { name: /template preview/i })).not.toBeInTheDocument();
    expect(document.querySelector("[data-sample-resume]")).toBeNull();
    await waitFor(() =>
      expect(mockRenderResumePdf).toHaveBeenCalledWith(expect.objectContaining({ photo: "data:image/jpeg;base64,abc" })),
    );
  });

  it("shows only the sample on the export step while the resume is empty", () => {
    const { container } = render(<PreviewPane printable />);
    expect(container.querySelector("[data-sample-resume]")).not.toBeNull();
    expect(screen.queryByTestId("pdf-engine-preview")).not.toBeInTheDocument();
    expect(mockRenderResumePdf).not.toHaveBeenCalled();
  });
});

describe("PreviewPane with content", () => {
  it("previews the user's resume as a PDF, not the sample", async () => {
    useBuilderStore.getState().loadFromData(makeFullResumeData({ templateId: "atlas" }));
    render(<PreviewPane />);
    expect(document.querySelector("[data-sample-resume]")).toBeNull();
    expect(document.querySelector("[data-template-skeleton]")).toBeNull();
    await waitFor(() => expect(screen.getByTestId("pdf-engine-preview")).toHaveTextContent("ready"));
    expect(mockRenderResumePdf).toHaveBeenCalledWith(
      expect.objectContaining({ basicInfo: expect.objectContaining({ name: "Alexandra Montgomery-Whitfield" }) }),
    );
    expect(document.querySelector('[data-tour="page-separator"]')).not.toBeNull();
  });

  it("draws a PDF the caller already renders (the export step) instead of its own", () => {
    useBuilderStore.getState().loadFromData(makeFullResumeData({ templateId: "atlas" }));
    const blob = new Blob(["%PDF-shared"]);
    render(<PreviewPane printable pdf={{ status: "ready", blob, templateId: "atlas", error: null }} />);
    expect(screen.getByTestId("pdf-engine-preview")).toHaveTextContent("ready");
    expect(mockRenderResumePdf).not.toHaveBeenCalled();
  });
});

describe("PreviewPane exact PDF preview", () => {
  function loadResume(templateId: string) {
    const data = makeFullResumeData({ templateId });
    act(() => {
      useBuilderStore.getState().updateBasicInfo(data.basicInfo);
      useBuilderStore.getState().setSkills(data.sections.skills!);
      useBuilderStore.getState().setTemplateId(templateId);
    });
  }

  it("previews the PDF itself for multi-column templates", async () => {
    loadResume("ember");
    render(<PreviewPane />);
    expect(document.querySelector("[data-page-sheet]")).toBeNull();
    await waitFor(() => expect(screen.getByTestId("pdf-engine-preview")).toHaveTextContent("ready"));
    expect(mockRenderResumePdf).toHaveBeenCalledWith(expect.objectContaining({ templateId: "ember" }));
  });

  it("does the same for two-column templates", async () => {
    loadResume("twin");
    render(<PreviewPane />);
    await waitFor(() => expect(screen.getByTestId("pdf-engine-preview")).toHaveTextContent("ready"));
  });

  it("does the same for single-column and labeled templates — every template previews its PDF", async () => {
    for (const id of ["atlas", "dossier"]) {
      loadResume(id);
      const { unmount } = render(<PreviewPane />);
      await waitFor(() => expect(screen.getByTestId("pdf-engine-preview")).toBeInTheDocument());
      expect(document.querySelector("[data-page-sheet]")).toBeNull();
      unmount();
    }
    expect(mockRenderResumePdf).toHaveBeenCalledWith(expect.objectContaining({ templateId: "dossier" }));
  });

  it("keeps the sample placeholder, and renders no PDF, until the resume has content", () => {
    act(() => useBuilderStore.getState().setTemplateId("ember"));
    render(<PreviewPane />);
    expect(screen.getByText(/this is a sample of/i)).toBeInTheDocument();
    expect(screen.queryByTestId("pdf-engine-preview")).not.toBeInTheDocument();
    expect(mockRenderResumePdf).not.toHaveBeenCalled();
  });

  it("re-renders the PDF when another template is picked", async () => {
    loadResume("ember");
    render(<PreviewPane />);
    await waitFor(() => expect(mockRenderResumePdf).toHaveBeenCalledTimes(1));
    act(() => useBuilderStore.getState().setTemplateId("oxford"));
    await waitFor(() => expect(mockRenderResumePdf).toHaveBeenLastCalledWith(expect.objectContaining({ templateId: "oxford" })), {
      timeout: 2000,
    });
  });
});

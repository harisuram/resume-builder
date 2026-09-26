import { act, render, screen, waitFor } from "@testing-library/react";
import { PdfEnginePreview } from "./PdfEnginePreview";
import type { ResumePdfState } from "./useResumePdf";

const mockGetDocument = jest.fn();
jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
}));

/** A fake pdf.js document with `pages` A4 pages. */
function fakeDoc(pages: number) {
  const render = jest.fn(() => ({ promise: Promise.resolve() }));
  return {
    render,
    task: {
      promise: Promise.resolve({
        numPages: pages,
        getPage: async () => ({
          getViewport: ({ scale }: { scale: number }) => ({ width: 595.28 * scale, height: 841.89 * scale }),
          render,
        }),
      }),
      destroy: jest.fn(),
    },
  };
}

// jsdom's Blob has no arrayBuffer(); every browser the builder runs in does.
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function arrayBuffer(this: Blob) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

let resize: ((entries: { contentRect: { width: number } }[]) => void) | null = null;
const originalResizeObserver = window.ResizeObserver;
const originalGetContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  mockGetDocument.mockReset();
  window.ResizeObserver = class {
    constructor(cb: (entries: { contentRect: { width: number } }[]) => void) {
      resize = cb;
    }
    observe() {
      resize?.([{ contentRect: { width: 600 } }]);
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({})) as unknown as typeof originalGetContext;
});

afterEach(() => {
  window.ResizeObserver = originalResizeObserver;
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

const blob = new Blob(["%PDF-1.7"], { type: "application/pdf" });
const ready = (b: Blob = blob, templateId = "atlas"): ResumePdfState => ({ status: "ready", blob: b, templateId, error: null });

describe("PdfEnginePreview", () => {
  it("says it's building before there is a PDF", () => {
    render(<PdfEnginePreview pdf={{ status: "rendering", blob: null, templateId: null, error: null }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Building PDF…");
    expect(document.querySelectorAll("[data-pdf-page]")).toHaveLength(0);
  });

  it("draws one canvas per PDF page and only then reports the count", async () => {
    const doc = fakeDoc(3);
    mockGetDocument.mockReturnValue(doc.task);
    render(<PdfEnginePreview pdf={ready()} />);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("3 pages"));
    const pages = document.querySelectorAll<HTMLCanvasElement>("[data-pdf-page]");
    expect(pages).toHaveLength(3);
    expect(pages[0]).toHaveAttribute("aria-label", "Page 1 of 3");
    expect(doc.render).toHaveBeenCalledTimes(3);
  });

  it("sizes pages to the pane width at the screen's pixel ratio", async () => {
    const doc = fakeDoc(1);
    mockGetDocument.mockReturnValue(doc.task);
    Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });
    render(<PdfEnginePreview pdf={ready()} />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 page"));
    const canvas = document.querySelector<HTMLCanvasElement>("[data-pdf-page]")!;
    expect(canvas.width).toBe(1200);
    expect(canvas.style.width).toBe("100%");
  });

  it("keeps the old pages up while a newer PDF is rendering", async () => {
    mockGetDocument.mockReturnValue(fakeDoc(2).task);
    const { rerender } = render(<PdfEnginePreview pdf={ready()} />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2 pages"));

    rerender(<PdfEnginePreview pdf={{ status: "rendering", blob, templateId: "atlas", error: null }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Updating…");
    expect(document.querySelectorAll("[data-pdf-page]")).toHaveLength(2);
  });

  it("reports a failed render", () => {
    render(<PdfEnginePreview pdf={{ status: "error", blob: null, templateId: null, error: new Error("boom") }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Couldn't build the PDF preview.");
  });

  it("reports a PDF it couldn't draw", async () => {
    mockGetDocument.mockReturnValue({ promise: Promise.reject(new Error("bad pdf")), destroy: jest.fn() });
    render(<PdfEnginePreview pdf={ready()} />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Couldn't build the PDF preview."));
  });

  it("releases the pdf.js document when the PDF changes", async () => {
    const first = fakeDoc(1);
    mockGetDocument.mockReturnValue(first.task);
    const { rerender } = render(<PdfEnginePreview pdf={ready()} />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 page"));

    mockGetDocument.mockReturnValue(fakeDoc(1).task);
    await act(async () => rerender(<PdfEnginePreview pdf={ready(new Blob(["%PDF-2"]))} />));
    expect(first.task.destroy).toHaveBeenCalled();
  });

  describe("skeleton while a template renders", () => {
    it("shows the picked template's skeleton before its first PDF arrives", () => {
      render(<PdfEnginePreview pdf={{ status: "rendering", blob: null, templateId: null, error: null }} templateId="ember" />);
      expect(screen.getByRole("status")).toHaveTextContent("Loading Ember…");
      expect(document.querySelector('[data-pdf-skeleton="ember"]')).not.toBeNull();
    });

    it("swaps the old template's pages for the new template's skeleton, then for its pages", async () => {
      mockGetDocument.mockReturnValue(fakeDoc(2).task);
      const { rerender } = render(<PdfEnginePreview pdf={ready(blob, "atlas")} templateId="atlas" />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2 pages"));
      expect(document.querySelector("[data-pdf-skeleton]")).toBeNull();

      // Picked Ember: the Atlas PDF is still the latest one rendered.
      rerender(<PdfEnginePreview pdf={{ status: "rendering", blob, templateId: "atlas", error: null }} templateId="ember" />);
      expect(screen.getByRole("status")).toHaveTextContent("Loading Ember…");
      expect(document.querySelector('[data-pdf-skeleton="ember"]')).not.toBeNull();
      // The Atlas pages are hidden, not shown under the Ember name.
      expect(document.querySelector("[data-pdf-page]")!.parentElement).not.toBeVisible();

      // Ember's PDF lands and is drawn: skeleton out, pages in.
      mockGetDocument.mockReturnValue(fakeDoc(3).task);
      const emberBlob = new Blob(["%PDF-ember"]);
      rerender(<PdfEnginePreview pdf={ready(emberBlob, "ember")} templateId="ember" />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("3 pages"));
      expect(document.querySelector("[data-pdf-skeleton]")).toBeNull();
      expect(document.querySelector("[data-pdf-page]")!.parentElement).toBeVisible();
    });

    it("keeps the skeleton until the new PDF is actually drawn, not just rendered", async () => {
      mockGetDocument.mockReturnValue({ promise: new Promise(() => {}), destroy: jest.fn() });
      render(<PdfEnginePreview pdf={ready(new Blob(["%PDF-ember"]), "ember")} templateId="ember" />);
      await Promise.resolve();
      expect(document.querySelector('[data-pdf-skeleton="ember"]')).not.toBeNull();
    });

    it("keeps the current pages (no skeleton) for edits within the same template", async () => {
      mockGetDocument.mockReturnValue(fakeDoc(2).task);
      const { rerender } = render(<PdfEnginePreview pdf={ready(blob, "atlas")} templateId="atlas" />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2 pages"));
      rerender(<PdfEnginePreview pdf={{ status: "rendering", blob, templateId: "atlas", error: null }} templateId="atlas" />);
      expect(screen.getByRole("status")).toHaveTextContent("Updating…");
      expect(document.querySelector("[data-pdf-skeleton]")).toBeNull();
    });

    it("reports a failure instead of loading forever", () => {
      render(<PdfEnginePreview pdf={{ status: "error", blob: null, templateId: null, error: new Error("x") }} templateId="ember" />);
      expect(screen.getByRole("status")).toHaveTextContent("Couldn't build the PDF preview.");
      expect(document.querySelector("[data-pdf-skeleton]")).toBeNull();
    });
  });
});

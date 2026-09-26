import { isValidElement, type ReactElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { pdfSafeImage, renderResumePdf } from "./renderResumePdf";
import type { ResumeData } from "@/lib/types";

jest.mock("@react-pdf/renderer", () => jest.requireActual<typeof import("../../test-utils/reactPdfMock")>("../../test-utils/reactPdfMock").reactPdfMock());

const JPEG = "data:image/jpeg;base64,/9j/4AAQ";
const PNG = "data:image/png;base64,iVBORw0KGgo=";

describe("pdfSafeImage", () => {
  it("passes JPEG and PNG data URLs straight through", async () => {
    await expect(pdfSafeImage(JPEG)).resolves.toBe(JPEG);
    await expect(pdfSafeImage(PNG)).resolves.toBe(PNG);
  });

  it("returns nothing for no photo", async () => {
    await expect(pdfSafeImage(undefined)).resolves.toBeUndefined();
  });

  it("drops a format react-pdf can't embed when it can't be re-encoded", async () => {
    // jsdom can't decode images, so the canvas re-encode fails — the photo
    // is dropped (initials or nothing) instead of breaking the whole PDF.
    await expect(pdfSafeImage("/samples/portraits/woman-1.webp")).resolves.toBeUndefined();
  });
});

describe("renderResumePdf", () => {
  it("renders the resume document to a PDF blob", async () => {
    const blob = await renderResumePdf(makeFullResumeData({ photo: JPEG }));
    expect(blob.type).toBe("application/pdf");
    const [element] = (pdf as jest.Mock).mock.calls.at(-1) as [ReactElement<{ data: ResumeData }>];
    expect(isValidElement(element)).toBe(true);
    expect(element.props.data.photo).toBe(JPEG);
  });

  it("renders without the photo rather than failing when it can't be embedded", async () => {
    await renderResumePdf(makeFullResumeData({ photo: "/samples/portraits/man-1.webp" }));
    const [element] = (pdf as jest.Mock).mock.calls.at(-1) as [ReactElement<{ data: ResumeData }>];
    expect(element.props.data.photo).toBeUndefined();
  });
});

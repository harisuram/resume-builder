import { pdf } from "@react-pdf/renderer";
import type { ResumeData } from "@/lib/types";
import { registerPdfFonts } from "./fonts";
import { ResumePdfDocument } from "./ResumePdfDocument";

/** Browser-side fonts path (files live in public/fonts/pdf). */
export const PDF_FONT_BASE_URL = "/fonts/pdf";

/** react-pdf embeds JPEG and PNG only. The builder's own crop saves JPEG,
 * but a WebP sample portrait or an older saved photo would otherwise make the
 * whole render throw — re-encode anything else to PNG through a canvas, and
 * drop the photo (initials take its place) if even that fails. */
export async function pdfSafeImage(src: string | undefined): Promise<string | undefined> {
  if (!src) return undefined;
  if (/^data:image\/(jpeg|jpg|png)[;,]/i.test(src)) return src;
  if (typeof document === "undefined") return undefined;
  try {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return undefined;
  }
}

/** Renders the resume to a PDF blob. The builder previews this exact blob
 * and downloads the same bytes, so what's on screen is what's saved. */
export async function renderResumePdf(data: ResumeData, fontBaseUrl = PDF_FONT_BASE_URL): Promise<Blob> {
  const photo = await pdfSafeImage(data.photo);
  return renderPreparedResumePdf({ ...data, photo }, fontBaseUrl);
}

/** The layout step alone, for data whose photo is already JPEG/PNG. Safe to
 * run in a Web Worker (no DOM) — see renderResumePdf.worker.tsx. */
export function renderPreparedResumePdf(data: ResumeData, fontBaseUrl = PDF_FONT_BASE_URL): Promise<Blob> {
  registerPdfFonts(fontBaseUrl);
  return pdf(<ResumePdfDocument data={data} />).toBlob();
}

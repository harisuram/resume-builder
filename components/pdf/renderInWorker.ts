import type { ResumeData } from "@/lib/types";
import { PDF_FONT_BASE_URL, pdfSafeImage, renderResumePdf } from "./renderResumePdf";

type Reply = { id: number; blob?: Blob; error?: string };

let worker: Worker | null = null;
let broken = false;
let nextId = 0;
const waiting = new Map<number, { resolve: (blob: Blob) => void; reject: (error: Error) => void }>();

function getWorker(): Worker | null {
  if (broken || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./renderResumePdf.worker.tsx", import.meta.url), { type: "module" });
  } catch {
    broken = true;
    return null;
  }
  worker.onmessage = (event: MessageEvent<Reply>) => {
    const job = waiting.get(event.data.id);
    if (!job) return;
    waiting.delete(event.data.id);
    if (event.data.blob) job.resolve(event.data.blob);
    else job.reject(new Error(event.data.error ?? "PDF render failed"));
  };
  // A worker that can't start (or dies) hands its jobs back to the main thread.
  worker.onerror = () => {
    broken = true;
    worker?.terminate();
    worker = null;
    for (const job of waiting.values()) job.reject(new Error("PDF worker unavailable"));
    waiting.clear();
  };
  return worker;
}

/** Renders the resume PDF in a Web Worker when one is available, so layout
 * never blocks typing; otherwise (or if the worker fails) on the main thread.
 * Same document either way, so the preview is still the downloaded bytes. */
export async function renderResumePdfOffThread(data: ResumeData): Promise<Blob> {
  const target = getWorker();
  if (!target) return renderResumePdf(data);
  // Re-encoding a photo needs a canvas, which only the page has.
  const prepared = { ...data, photo: await pdfSafeImage(data.photo) };
  const id = ++nextId;
  const fontBaseUrl = new URL(PDF_FONT_BASE_URL, window.location.origin).href;
  try {
    return await new Promise<Blob>((resolve, reject) => {
      waiting.set(id, { resolve, reject });
      target.postMessage({ id, data: prepared, fontBaseUrl });
    });
  } catch {
    return renderResumePdf(data);
  }
}

/// <reference lib="webworker" />
import type { ResumeData } from "@/lib/types";
import { renderPreparedResumePdf } from "./renderResumePdf";

/** Lays the resume out off the main thread: react-pdf's layout froze the
 * builder for ~0.5 s per render on a long resume, which read as typing lag. */
self.onmessage = async (event: MessageEvent<{ id: number; data: ResumeData; fontBaseUrl: string }>) => {
  const { id, data, fontBaseUrl } = event.data;
  try {
    const blob = await renderPreparedResumePdf(data, fontBaseUrl);
    self.postMessage({ id, blob });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};

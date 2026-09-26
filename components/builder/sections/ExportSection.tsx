"use client";

import { useState } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { Button } from "@/components/ui/Button";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { PreviewPane } from "@/components/builder/PreviewPane";
import { useResumePdf } from "@/components/builder/useResumePdf";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { persistCurrentResume } from "@/lib/persistResume";
import { hasAnyResumeValue, isBasicInfoComplete, useBuilderStore, useResumeData } from "@/lib/store";
import { showToast } from "@/lib/toast";
import type { BasicInfo } from "@/lib/types";

function slugifyName(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return slug || "resume";
}

/** Plain outline that inherits the primary button's (white) text color —
 * a colored PDF badge would clash on the solid fill. */
function PdfIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
    </svg>
  );
}

/** Saves `blob` as `fileName` through a temporary link. The URL is revoked
 * on the next tick, after the browser has started the download. */
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadBlockedReason(basicInfo: BasicInfo): string | undefined {
  if (isBasicInfoComplete(basicInfo)) return undefined;
  if (basicInfo.name.trim() && basicInfo.email.trim() && basicInfo.location.trim()) {
    return "Fix the highlighted fields in Basic info before downloading.";
  }
  return "Fill in your name, email, and location in Basic info before downloading.";
}

export function ExportSection() {
  const getResumeData = useBuilderStore((s) => s.getResumeData);
  const basicInfo = useBuilderStore((s) => s.basicInfo);
  const canDownload = useBuilderStore((s) =>
    hasAnyResumeValue({ basicInfo: s.basicInfo, photo: s.photo, sections: s.sections }),
  );
  // Seeded once from the resume's name; editable from there and then reused
  // as-is for every download in this session — it doesn't keep resetting
  // itself to match the name field if that changes later.
  const [fileBaseName, setFileBaseName] = useState(() => slugifyName(getResumeData().basicInfo.name));
  const data = useResumeData();
  // Every template renders through the PDF engine: the preview below draws
  // this render, and the download saves the same bytes — so page breaks can't
  // differ between what's shown and what's saved.
  const pdf = useResumePdf(data, true);

  async function downloadPdf() {
    persistCurrentResume();
    try {
      saveBlob(await pdf.latestBlob(), `${slugifyName(fileBaseName)}.pdf`);
    } catch {
      showToast("Couldn't build the PDF. Try again.");
    }
  }

  function handleDownloadPdf() {
    const blocked = downloadBlockedReason(basicInfo);
    if (blocked) {
      showToast(blocked);
      return;
    }
    void downloadPdf();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print">
        <h2 className="font-display text-[20px] font-semibold tracking-tight text-[var(--color-ink)]">Preview &amp; download</h2>
        <p className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
          Pick a look, review it below, then download when it&rsquo;s ready.
        </p>
      </div>

      {canDownload && (
        <div className="no-print rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
          <FieldGroup label="File name">
            <div className="flex min-w-0 items-center gap-1.5">
              <TextInput
                value={fileBaseName}
                onChange={(e) => setFileBaseName(e.target.value)}
                onBlur={() => setFileBaseName((current) => slugifyName(current))}
                placeholder="resume"
                className="w-full min-w-0 sm:max-w-[220px]"
                aria-label="File name"
              />
              <span className="text-[12px] text-[var(--color-ink-faint)]">.pdf</span>
            </div>
          </FieldGroup>

          <p className="mt-3 text-[11.5px] text-[var(--color-ink-faint)]">
            The preview below is the PDF file itself — page breaks match the download exactly.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={handleDownloadPdf}>
              <PdfIcon />
              Download PDF
            </Button>
          </div>
        </div>
      )}

      <AdSlot
        slot={ADSENSE_SLOTS.builderExport}
        name="Export page"
        className="flex flex-col items-center gap-1"
      />

      <PreviewPane printable pickerMobileOnly pdf={pdf} />
    </div>
  );
}

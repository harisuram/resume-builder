"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { Button } from "@/components/ui/Button";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { AnimatedDownloadIcon, CheckIcon, SpinnerIcon } from "@/components/builder/AnimatedIcons";
import { DOWNLOADED_HOLD_MS, saveBlob, slugifyName } from "@/components/builder/sections/ExportSection";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { persistCurrentLetter, useCoverLetterStore } from "@/lib/coverLetterStore";
import { persistCurrentResume } from "@/lib/persistResume";
import { useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import { CoverLetterPreviewPane } from "./CoverLetterPreviewPane";
import { letterDownloadBlockedReason } from "./steps";
import { useLetterPdf } from "./useLetterPdf";

function defaultFileName(name: string): string {
  const person = slugifyName(name, "");
  return person ? `${person}_cover_letter` : "cover_letter";
}

export function CoverLetterExport() {
  const basicInfo = useBuilderStore((s) => s.basicInfo);
  const letter = useCoverLetterStore((s) => s.letter);
  const [fileBaseName, setFileBaseName] = useState(() => defaultFileName(useBuilderStore.getState().basicInfo.name));
  // The preview below draws this render and the download saves the same
  // bytes, exactly as on the resume's download step.
  const pdf = useLetterPdf(true);
  const [phase, setPhase] = useState<"idle" | "building" | "done">("idle");
  const resetTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  async function downloadPdf() {
    persistCurrentLetter();
    persistCurrentResume();
    window.clearTimeout(resetTimer.current);
    setPhase("building");
    try {
      saveBlob(await pdf.latestBlob(), `${slugifyName(fileBaseName, "cover_letter")}.pdf`);
      setPhase("done");
      resetTimer.current = window.setTimeout(() => setPhase("idle"), DOWNLOADED_HOLD_MS);
    } catch {
      setPhase("idle");
      showToast("Couldn't build the PDF. Try again.");
    }
  }

  function handleDownloadPdf() {
    if (phase === "building") return;
    const blocked = letterDownloadBlockedReason(letter, basicInfo);
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

      <div className="no-print rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
        <FieldGroup label="File name">
          <div className="flex min-w-0 items-center gap-1.5">
            <TextInput
              value={fileBaseName}
              onChange={(e) => setFileBaseName(e.target.value)}
              onBlur={() => setFileBaseName((current) => slugifyName(current, "cover_letter"))}
              placeholder="cover_letter"
              className="w-full min-w-0 sm:max-w-[260px]"
              aria-label="File name"
            />
            <span className="text-[12px] text-[var(--color-ink-faint)]">.pdf</span>
          </div>
        </FieldGroup>

        <p className="mt-3 text-[11.5px] text-[var(--color-ink-faint)]">
          The preview below is the PDF file itself — page breaks match the download exactly.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={handleDownloadPdf}
            aria-label="Download PDF"
            aria-busy={phase === "building" || undefined}
          >
            {phase === "building" ? (
              <SpinnerIcon className="h-4 w-4" />
            ) : phase === "done" ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <AnimatedDownloadIcon className="h-4 w-4" />
            )}
            {phase === "building" ? "Preparing PDF…" : phase === "done" ? "Downloaded" : "Download PDF"}
          </Button>
        </div>

        <p className="mt-4 border-t border-[var(--color-border)] pt-3 text-[12.5px] text-[var(--color-ink-soft)]">
          Need to change something on your resume?{" "}
          <Link
            href="/builder"
            onClick={() => persistCurrentLetter()}
            className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            Back to your resume &rarr;
          </Link>
        </p>
      </div>

      <CoverLetterPreviewPane printable pickerMobileOnly pdf={pdf} />

      {/* After the full letter preview, never beside the Download button, so
          nobody reaches it by mis-tapping download. */}
      <AdSlot slot={ADSENSE_SLOTS.coverExport} name="Cover letter download" className="mt-6 flex flex-col items-center gap-1" />
    </div>
  );
}

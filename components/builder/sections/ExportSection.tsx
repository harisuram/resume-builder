"use client";

import { useEffect, useRef, useState } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { Button } from "@/components/ui/Button";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { PreviewPane } from "@/components/builder/PreviewPane";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { hasAddedSection } from "@/lib/resume";
import { clearResumeData, hasSavedResumeData, saveResumeData } from "@/lib/storage";
import { useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";

type Consent = "yes" | "no" | null;

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

export function ExportSection() {
  const getResumeData = useBuilderStore((s) => s.getResumeData);
  const setHasSavedCopy = useBuilderStore((s) => s.setHasSavedCopy);
  const addedSection = useBuilderStore((s) => hasAddedSection(s.getResumeData()));
  const [consent, setConsent] = useState<Consent>(null);
  // null until the mount effect below has read localStorage, so the save
  // question stays out of the first paint instead of flashing in and then
  // disappearing for someone who already has a saved copy.
  const [hadSavedCopy, setHadSavedCopy] = useState<boolean | null>(null);
  // Offer to persist — and to download — only once there's actually a
  // section worth picking up later. An empty builder (or basic info / photo
  // alone) hides both the question and the download button.
  const showSavePrompt = hadSavedCopy === false && addedSection;
  const downloadBlocked = addedSection && hadSavedCopy !== true && !consent;
  // Seeded once from the resume's name; editable from there and then reused
  // as-is for every download in this session — it doesn't keep resetting
  // itself to match the name field if that changes later.
  const [fileBaseName, setFileBaseName] = useState(() => slugifyName(getResumeData().basicInfo.name));
  const originalTitle = useRef<string | null>(null);

  useEffect(() => {
    // localStorage doesn't exist on the server, so this can only run here.
    // An existing saved copy already answers the question, so it's taken as
    // the answer and the question isn't asked again — "Start new resume" in
    // the navbar is the way back out of it.
    const saved = hasSavedResumeData();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHadSavedCopy(saved);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(saved ? "yes" : null);
  }, []);

  function commitConsent() {
    if (!addedSection) return false;
    if (!consent) return false;
    try {
      if (consent === "yes") {
        saveResumeData(getResumeData());
      } else {
        clearResumeData();
      }
      setHasSavedCopy(consent === "yes");
    } catch {
      showToast("Couldn't save this resume on this device. Storage may be full.");
    }
    return true;
  }

  function handleDownloadPdf() {
    if (!commitConsent()) return;
    // Chrome (and most Chromium browsers) suggest document.title as the
    // filename in the print-to-PDF save dialog — this is the only lever a
    // page has over that filename, since the dialog itself is native chrome.
    originalTitle.current = document.title;
    document.title = slugifyName(fileBaseName);
    try {
      window.print();
    } catch {
      showToast("Couldn't open the print dialog. Try again.");
    } finally {
      document.title = originalTitle.current;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print">
        <h2 className="font-display text-[20px] font-semibold tracking-tight text-[var(--color-ink)]">Template &amp; export</h2>
        <p className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
          Pick a look, review it below, then download when it&rsquo;s ready.
        </p>
      </div>

      {addedSection && (
        <div className="no-print rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
          {showSavePrompt && (
            <>
              <p className="text-[13.5px] font-medium text-[var(--color-ink)]">
                Save this resume on this device so you can pick it up again later?
              </p>
              <p className="mt-1 text-[12px] text-[var(--color-ink-soft)]">
                Stored only in this browser. Nothing is uploaded anywhere.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant={consent === "yes" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setConsent("yes")}
                >
                  Yes, save it
                </Button>
                <Button variant={consent === "no" ? "primary" : "secondary"} size="sm" onClick={() => setConsent("no")}>
                  No, don&rsquo;t save
                </Button>
              </div>
            </>
          )}

          <div className={showSavePrompt ? "mt-4 border-t border-[var(--color-border)] pt-4" : ""}>
            <FieldGroup label="File name">
              <div className="flex items-center gap-1.5">
                <TextInput
                  value={fileBaseName}
                  onChange={(e) => setFileBaseName(e.target.value)}
                  onBlur={() => setFileBaseName((current) => slugifyName(current))}
                  placeholder="resume"
                  className="max-w-[220px]"
                  aria-label="File name"
                />
                <span className="text-[12px] text-[var(--color-ink-faint)]">.pdf</span>
              </div>
            </FieldGroup>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={handleDownloadPdf} disabled={downloadBlocked}>
                <PdfIcon />
                Download PDF
              </Button>
              {downloadBlocked && (
                <span className="text-[11.5px] text-[var(--color-ink-faint)]">Choose an option above first.</span>
              )}
            </div>
          </div>
        </div>
      )}

      <AdSlot
        slot={ADSENSE_SLOTS.builderExport}
        name="Export page"
        className="flex flex-col items-center gap-1"
      />

      <PreviewPane printable />
    </div>
  );
}

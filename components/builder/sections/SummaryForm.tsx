"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldGroup, TextArea } from "@/components/ui/Field";
import { AI_BACKOFF_MS, AI_LIMITED_UNTIL_KEY, AiLimitError, optimizeSummary } from "@/lib/ai";
import { SUMMARY_COPY } from "@/lib/persona";
import { useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import { useTouchedFields } from "@/lib/useTouchedFields";
import { MAX_SUMMARY_LENGTH, validateSummary } from "@/lib/validation";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

export function SummaryForm() {
  const summary = useBuilderStore((s) => s.sections.summary) ?? "";
  const status = useBuilderStore((s) => s.sectionStatus.summary) ?? "not_started";
  const setSummary = useBuilderStore((s) => s.setSummary);
  const skipped = status === "skipped";
  const { touch, errorFor } = useTouchedFields();
  const error = errorFor("summary", validateSummary(summary).message);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    const until = Number(localStorage.getItem(AI_LIMITED_UNTIL_KEY) ?? 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAiAvailable(Date.now() >= until);
  }, []);

  async function handleOptimize() {
    const text = summary.trim();
    if (!text) return;
    setOptimizing(true);
    try {
      setSummary(await optimizeSummary(text));
    } catch (err) {
      if (err instanceof AiLimitError) {
        localStorage.setItem(AI_LIMITED_UNTIL_KEY, String(Date.now() + AI_BACKOFF_MS));
        setAiAvailable(false);
      }
      showToast(err instanceof Error ? err.message : "AI optimization failed. Try again later.");
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title={SUMMARY_COPY.label} help={SUMMARY_COPY.help} />
      {skipped ? (
        <SkippedNotice label={SUMMARY_COPY.label} sectionKey="summary" />
      ) : (
        <>
        <FieldGroup
          label="Professional summary"
          htmlFor="summary"
          hint={`${summary.length} / ${MAX_SUMMARY_LENGTH} characters`}
          error={error}
        >
          <TextArea
            id="summary"
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            onBlur={touch("summary")}
            placeholder={SUMMARY_COPY.placeholder}
            maxLength={MAX_SUMMARY_LENGTH}
            invalid={Boolean(error)}
          />
        </FieldGroup>
        {aiAvailable && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start"
            disabled={optimizing || !summary.trim()}
            onClick={handleOptimize}
          >
            {optimizing ? "Optimizing…" : "✨ Make ATS-friendly"}
          </Button>
        )}
        </>
      )}
    </div>
  );
}

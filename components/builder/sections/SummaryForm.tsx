"use client";

import { FieldGroup, TextArea } from "@/components/ui/Field";
import { SUMMARY_COPY } from "@/lib/persona";
import { useBuilderStore } from "@/lib/store";
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

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title={SUMMARY_COPY.label} help={SUMMARY_COPY.help} />
      {skipped ? (
        <SkippedNotice label={SUMMARY_COPY.label} />
      ) : (
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
      )}
    </div>
  );
}

"use client";

import { TextArea } from "@/components/ui/Field";
import { SUMMARY_COPY } from "@/lib/persona";
import { useBuilderStore } from "@/lib/store";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

export function SummaryForm() {
  const summary = useBuilderStore((s) => s.sections.summary) ?? "";
  const status = useBuilderStore((s) => s.sectionStatus.summary) ?? "not_started";
  const setSummary = useBuilderStore((s) => s.setSummary);
  const skipped = status === "skipped";

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title={SUMMARY_COPY.label} help={SUMMARY_COPY.help} />
      {skipped ? (
        <SkippedNotice label={SUMMARY_COPY.label} />
      ) : (
        <TextArea
          rows={5}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={SUMMARY_COPY.placeholder}
        />
      )}
    </div>
  );
}

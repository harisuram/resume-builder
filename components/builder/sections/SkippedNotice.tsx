"use client";

import { Button } from "@/components/ui/Button";
import { useBuilderStore } from "@/lib/store";
import type { SectionKey } from "@/lib/types";

export function SkippedNotice({
  label,
  sectionKey,
}: {
  label: string;
  sectionKey: SectionKey | "photo";
}) {
  const toggleSkipSection = useBuilderStore((s) => s.toggleSkipSection);

  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-[13.5px] text-[var(--color-ink-soft)]">
      <p>
        {label} is skipped and won&rsquo;t appear on your resume.{" "}
        <span className="hidden md:inline">Use its switch in the section list to include it again.</span>
        <span className="md:hidden">Include it again to add it to the resume.</span>
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3 min-h-11 md:hidden"
        onClick={() => toggleSkipSection(sectionKey)}
      >
        Include {label}
      </Button>
    </div>
  );
}

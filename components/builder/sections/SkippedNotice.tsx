export function SkippedNotice({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-[13.5px] text-[var(--color-ink-soft)]">
      {label} is skipped and won&rsquo;t appear on your resume. Use its switch in the section list to include it again.
    </div>
  );
}

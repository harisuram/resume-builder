const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Formats a "YYYY-MM" (from a month input) into "Mon YYYY". Falls back to
 * the raw string for anything else so hand-typed dates don't disappear. */
export function formatMonth(value?: string): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month] = match;
  const index = Number(month) - 1;
  if (index < 0 || index > 11) return value;
  return `${MONTHS[index]} ${year}`;
}

export function formatDateRange(start?: string, end?: string): string {
  const startLabel = formatMonth(start);
  const endLabel = end ? formatMonth(end) : "Present";
  if (!startLabel) return endLabel === "Present" ? "" : endLabel;
  return `${startLabel} – ${endLabel}`;
}

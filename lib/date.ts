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

/** Shown on the resume when a role is ongoing. Preview and PDF share this. */
export const PRESENT_LABEL = "Present";

/** Ongoing role: explicit checkbox, or a legacy entry with no end date. */
export function isCurrentExperience(exp: { endDate?: string; current?: boolean }): boolean {
  if (exp.current === true) return true;
  if (exp.current === false) return false;
  return !exp.endDate;
}

export function formatDateRange(start?: string, end?: string, present?: boolean): string {
  const showPresent = present ?? !end;
  const startLabel = formatMonth(start);
  const endLabel = showPresent ? PRESENT_LABEL : formatMonth(end);
  if (!startLabel) return endLabel === PRESENT_LABEL ? "" : endLabel;
  if (!endLabel) return startLabel;
  return `${startLabel} – ${endLabel}`;
}

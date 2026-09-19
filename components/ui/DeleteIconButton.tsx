import type { ButtonHTMLAttributes } from "react";

/** Lucide-style trash can — bullets, chips, photo, and other line items. */
export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

/** Circle with X — remove a whole entry card (project, job, school, …). */
export function RemoveEntryIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

type DeleteIcon = "trash" | "entry";

/** Icon-only remove control. Keep `aria-label` specific ("Remove bullet", etc.). */
export function DeleteIconButton({
  className = "",
  iconClassName = "h-4 w-4",
  icon = "trash",
  "aria-label": ariaLabel = "Remove",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  iconClassName?: string;
  /** `entry` = card corner (circle-X); `trash` = line-item discard. */
  icon?: DeleteIcon;
}) {
  const Icon = icon === "entry" ? RemoveEntryIcon : TrashIcon;
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`inline-flex shrink-0 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-600/10 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600/40 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    >
      <Icon className={iconClassName} />
    </button>
  );
}

import { useId } from "react";

/** Idle-animated icons for the Preview and Download calls to action. The
 * motion lives in globals.css (`.anim-download`, `.anim-eye`) and plays once
 * every few seconds, never on a tight loop; reduced-motion turns it off. */

export function AnimatedDownloadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`anim-download shrink-0 overflow-visible ${className}`}
      aria-hidden="true"
    >
      <g className="anim-download-arrow">
        <path d="M12 4v10" />
        <path d="m7.5 9.5 4.5 4.5 4.5-4.5" />
      </g>
      <path className="anim-download-tray" d="M4.5 15.5v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.5" />
    </svg>
  );
}

/** The sidebar's Download item: a white tile with a gradient-filled arrow
 * that drops into its tray on the same idle beat as AnimatedDownloadIcon. */
export function FilledDownloadIcon() {
  // useId's punctuation isn't safe inside url(#…), so keep only id-safe chars.
  const gradient = `dl-${useId().replace(/[^\w-]/g, "")}`;
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white shadow-[0_2px_6px_-2px_rgb(0_0_0_/_0.3)]">
      <svg viewBox="0 0 24 24" className="anim-download h-4 w-4 overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <g className="anim-download-arrow">
          <path d="M10.6 3.5h2.8v7.3h3.1L12 15.6l-4.5-4.8h3.1Z" fill={`url(#${gradient})`} />
        </g>
        <path
          className="anim-download-tray"
          d="M4.5 15v3.2a1.8 1.8 0 0 0 1.8 1.8h11.4a1.8 1.8 0 0 0 1.8-1.8V15"
          fill="none"
          stroke={`url(#${gradient})`}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function AnimatedEyeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`anim-eye shrink-0 ${className}`}
      aria-hidden="true"
    >
      <g className="anim-eye-lid">
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="2.75" />
      </g>
    </svg>
  );
}

export function SpinnerIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin shrink-0 ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeOpacity={0.25} strokeWidth={2.2} />
      <path d="M20.5 12A8.5 8.5 0 0 0 12 3.5" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path className="toast-check" d="m5.5 12.5 4 4 9-9.5" />
    </svg>
  );
}

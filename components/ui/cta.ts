/** Marketing CTAs — pill-shaped, with the accent glow. Builder chrome uses
 * `<Button>` instead so the editor stays denser. */
export const ctaPrimary = {
  sm: "inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--color-accent-ink)] shadow-cta transition duration-200 ease-out hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:brightness-95",
  md: "inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-6 py-3 text-[14px] font-semibold text-[var(--color-accent-ink)] shadow-cta transition duration-200 ease-out hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:brightness-95",
} as const;

export const ctaGhost =
  "inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-[14px] font-semibold text-[var(--color-ink)] shadow-card transition duration-200 ease-out hover:-translate-y-px hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)] active:translate-y-0";

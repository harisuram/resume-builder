import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-cta hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:brightness-95 disabled:opacity-40 disabled:hover:translate-y-0",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-card hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] active:scale-[0.98] disabled:opacity-40",
  ghost:
    "text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-tint)] hover:text-[var(--color-ink)] disabled:opacity-40",
  danger:
    "bg-red-600 text-white shadow-cta hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:brightness-95 disabled:opacity-40 disabled:hover:translate-y-0",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-2.5 py-1 text-[12.5px]",
  md: "px-4 py-2 text-sm",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}

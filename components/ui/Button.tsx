import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-accent-ink)] hover:brightness-110 active:brightness-95 disabled:opacity-40",
  secondary:
    "border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-[0.98] disabled:opacity-40",
  ghost:
    "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-border)]/40 disabled:opacity-40",
  danger:
    "border border-transparent text-red-700 hover:bg-red-50 active:bg-red-100 disabled:opacity-40",
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
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}

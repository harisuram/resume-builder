"use client";

import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";
import { TextArea } from "@/components/ui/Field";

const MIN_ROWS = 2;

type BulletTextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "rows" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  /** Focus this field after mount / when flipped on (new bullet). */
  autoFocus?: boolean;
};

/** Wrapping bullet field that grows with its content — no inner scrollbar. */
export function BulletTextArea({
  value,
  onChange,
  className = "",
  invalid,
  autoFocus = false,
  onKeyDown,
  ...props
}: BulletTextAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useLayoutEffect(() => {
    if (!autoFocus) return;
    ref.current?.focus();
  }, [autoFocus]);

  return (
    <TextArea
      ref={ref}
      value={value}
      invalid={invalid}
      rows={MIN_ROWS}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
        onKeyDown?.(e);
      }}
      className={`min-w-0 flex-1 resize-none overflow-hidden break-words leading-snug ${className}`}
      {...props}
    />
  );
}

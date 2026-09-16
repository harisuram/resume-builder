"use client";

import { useState } from "react";

export function ChipInput({
  values,
  onChange,
  placeholder,
  maxLength,
  itemLabel = "item",
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxLength?: number;
  itemLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | undefined>();

  function commit() {
    const value = draft.trim();
    if (!value) {
      setDraft("");
      setError(undefined);
      return;
    }
    if (maxLength && value.length > maxLength) {
      setError(`Keep it under ${maxLength} characters.`);
      return;
    }
    if (values.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
      setError(`That ${itemLabel} is already on the list.`);
      return;
    }
    onChange([...values, value]);
    setDraft("");
    setError(undefined);
  }

  return (
    <div>
      <div
        data-field-control=""
        className={`rounded-md border bg-[var(--color-surface)] p-2 transition duration-150 ease-out focus-within:ring-2 ${
          error
            ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
            : "border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-[var(--color-accent)]/15"
        }`}
      >
        <div className="flex flex-wrap gap-1.5">
          {values.map((value, i) => (
            <span
              key={i}
              className="group flex items-center gap-1 rounded-full bg-[var(--color-accent-tint)] px-2 py-0.5 text-[12px] text-[var(--color-ink)] transition-colors"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${value}`}
                className="text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-accent)]"
              >
                ×
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                commit();
              } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
                onChange(values.slice(0, -1));
                setError(undefined);
              }
            }}
            onBlur={commit}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-invalid={Boolean(error) || undefined}
            maxLength={maxLength}
            className="min-w-[8ch] flex-1 bg-transparent px-1 py-0.5 text-[13.5px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-[11.5px] text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

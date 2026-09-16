"use client";

import { useState } from "react";

export function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim();
    if (value && !values.includes(value)) onChange([...values, value]);
    setDraft("");
  }

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2 transition duration-150 ease-out focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]/15">
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
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-[8ch] flex-1 bg-transparent px-1 py-0.5 text-[13.5px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
        />
      </div>
    </div>
  );
}

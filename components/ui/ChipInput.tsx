"use client";

import { useId, useMemo, useState } from "react";
import { filterCatalog } from "@/lib/catalogs";
import { SuggestionList } from "./SuggestionList";

export function ChipInput({
  values,
  onChange,
  placeholder,
  maxLength,
  itemLabel = "item",
  suggestions,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxLength?: number;
  itemLabel?: string;
  /** Optional catalog. Already-selected values are hidden; the user can still
   * type anything and press Enter. */
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const listboxId = useId();

  const matches = useMemo(
    () => (suggestions ? filterCatalog(suggestions, draft, values) : []),
    [suggestions, draft, values],
  );
  const showList = Boolean(suggestions) && open && matches.length > 0;

  function add(value: string) {
    const next = value.trim();
    if (!next) {
      setDraft("");
      setError(undefined);
      return;
    }
    if (maxLength && next.length > maxLength) {
      setError(`Keep it under ${maxLength} characters.`);
      return;
    }
    if (values.some((existing) => existing.toLowerCase() === next.toLowerCase())) {
      setError(`That ${itemLabel} is already on the list.`);
      return;
    }
    onChange([...values, next]);
    setDraft("");
    setError(undefined);
    setHighlight(null);
  }

  function commitDraft() {
    add(draft);
  }

  function commitFromKeys() {
    if (highlight !== null && matches[highlight]) {
      add(matches[highlight]);
      return;
    }
    commitDraft();
  }

  return (
    <div>
      <div className="relative">
        <div
          data-field-control=""
          className={`rounded-lg border bg-[var(--color-surface)] p-2 transition duration-150 ease-out focus-within:ring-2 ${
            error
              ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
              : "border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-[var(--color-accent)]/15"
          }`}
        >
          <div className="flex flex-wrap gap-1.5">
            {values.map((value, i) => (
              <span
                key={i}
                className="group flex items-center gap-1 rounded-full bg-[var(--color-accent-tint)] px-2 py-0.5 text-[12px] text-[var(--color-accent)] transition-colors"
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
                setHighlight(null);
                setOpen(true);
                if (error) setError(undefined);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && matches.length > 0) {
                  e.preventDefault();
                  setOpen(true);
                  setHighlight((current) => {
                    if (current === null) return 0;
                    return Math.min(matches.length - 1, current + 1);
                  });
                } else if (e.key === "ArrowUp" && matches.length > 0) {
                  e.preventDefault();
                  setHighlight((current) => {
                    if (current === null) return matches.length - 1;
                    return Math.max(0, current - 1);
                  });
                } else if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  commitFromKeys();
                } else if (e.key === "Escape") {
                  setOpen(false);
                  setHighlight(null);
                } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
                  onChange(values.slice(0, -1));
                  setError(undefined);
                }
              }}
              onBlur={() => {
                setOpen(false);
                setHighlight(null);
                commitDraft();
              }}
              placeholder={placeholder}
              aria-label={placeholder}
              aria-invalid={Boolean(error) || undefined}
              aria-expanded={showList || undefined}
              aria-controls={showList ? listboxId : undefined}
              aria-autocomplete={suggestions ? "list" : undefined}
              role={suggestions ? "combobox" : undefined}
              maxLength={maxLength}
              className="min-w-0 flex-1 bg-transparent px-1 py-0.5 text-[13.5px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] sm:min-w-[8ch]"
            />
          </div>
        </div>
        {showList && (
          <SuggestionList
            id={listboxId}
            items={matches}
            highlight={highlight}
            onHighlight={setHighlight}
            onSelect={add}
            label={`Suggested ${itemLabel}s`}
          />
        )}
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-[11.5px] text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

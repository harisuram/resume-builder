"use client";

import { useId, useMemo, useState, type InputHTMLAttributes } from "react";
import { filterCatalog } from "@/lib/catalogs";
import { SuggestionList } from "./SuggestionList";

const CONTROL_BASE =
  "w-full rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-[13.5px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] transition duration-150 ease-out outline-none focus:ring-2";

const VALID_BORDER =
  "border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/15";

const INVALID_BORDER = "border-red-500 focus:border-red-500 focus:ring-red-500/20";

/** Text field that offers a catalog while still accepting any typed value. */
export function SuggestInput({
  value,
  onChange,
  onBlur,
  suggestions,
  suggestionLabel,
  invalid,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  suggestionLabel: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const listboxId = useId();
  const matches = useMemo(() => filterCatalog(suggestions, value), [suggestions, value]);
  const showList = open && matches.length > 0;

  function select(next: string) {
    onChange(next);
    setOpen(false);
    setHighlight(null);
  }

  return (
    <div className="relative">
      <input
        {...props}
        value={value}
        aria-invalid={invalid || undefined}
        aria-expanded={showList || undefined}
        aria-controls={showList ? listboxId : undefined}
        aria-autocomplete="list"
        role="combobox"
        className={`${CONTROL_BASE} ${invalid ? INVALID_BORDER : VALID_BORDER} ${className}`}
        onChange={(e) => {
          onChange(e.target.value);
          setHighlight(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          setOpen(false);
          setHighlight(null);
          onBlur?.(e);
        }}
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
          } else if (e.key === "Enter" && highlight !== null && matches[highlight]) {
            e.preventDefault();
            select(matches[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
            setHighlight(null);
          }
        }}
      />
      {showList && (
        <SuggestionList
          id={listboxId}
          items={matches}
          highlight={highlight}
          onHighlight={setHighlight}
          onSelect={select}
          label={suggestionLabel}
        />
      )}
    </div>
  );
}

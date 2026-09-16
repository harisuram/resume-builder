"use client";

import { useEffect, useId, useRef, useState } from "react";
import { TEMPLATE_LIST } from "@/components/templates/registry";
import { getTheme } from "@/components/templates/shared/theme";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 text-[var(--color-ink-faint)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path
        d="M2.2 4.2 6 8l3.8-3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TemplatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const theme = getTheme(value);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-[12.5rem] shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Choose a template"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-sm border border-[var(--color-border)] bg-[var(--color-paper)] py-1.5 pl-3 pr-2.5 text-left transition duration-150 ease-out hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        style={{ borderBottomWidth: 2, borderBottomColor: theme.accent }}
      >
        <span className="min-w-0">
          <span className="block text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            Template
          </span>
          <span className="block truncate font-display text-[13.5px] font-semibold leading-tight text-[var(--color-ink)]">
            {theme.name}
          </span>
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Templates"
          className="absolute inset-x-0 z-20 mt-1.5 max-h-64 overflow-y-auto rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[0_8px_24px_rgba(27,24,18,0.12)]"
        >
          {TEMPLATE_LIST.map((option) => {
            const selected = option.id === value;
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(option.id)}
                  className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition duration-100 ease-out hover:bg-[var(--color-accent-tint)] ${
                    selected ? "bg-[var(--color-accent-tint)]" : ""
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: option.accent }}
                    aria-hidden="true"
                  />
                  <span
                    className={`min-w-0 truncate text-[12.5px] leading-tight ${
                      selected ? "font-semibold text-[var(--color-ink)]" : "font-medium text-[var(--color-ink)]"
                    }`}
                  >
                    {option.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
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
  emphasized = false,
  open: openProp,
  onOpenChange,
}: {
  value: string;
  onChange: (id: string) => void;
  /** Call out that the template can be changed — used on the empty preview. */
  emphasized?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  function setOpen(next: boolean | ((current: boolean) => boolean)) {
    const resolved = typeof next === "function" ? next(open) : next;
    if (openProp === undefined) setInternalOpen(resolved);
    onOpenChange?.(resolved);
  }
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const theme = getTheme(value);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
    if (!selected) return;
    // Scroll the list itself — scrollIntoView would also move the builder
    // pane when the picker sits near the bottom of the screen.
    const item = selected.closest("li") ?? selected;
    list.scrollTop = Math.max(0, item.offsetTop - (list.clientHeight - item.offsetHeight) / 2);
    selected.focus({ preventScroll: true });
  }, [open, value]);

  function choose(id: string) {
    onChange(id);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={rootRef} className={`relative w-full min-w-0 ${emphasized ? "template-picker-callout rounded-lg" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Choose a template"
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border bg-[var(--color-surface)] py-1.5 pl-3 pr-2.5 text-left shadow-card transition duration-150 ease-out hover:border-[var(--color-accent)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] md:min-h-0 ${
          emphasized
            ? "border-[var(--color-accent)]/55 ring-2 ring-[var(--color-accent)]/25"
            : "border-[var(--color-border)]"
        }`}
        style={{ borderBottomWidth: 2, borderBottomColor: theme.accent }}
      >
        <span className="min-w-0">
          <span
            className={`block text-[9px] font-medium uppercase ${
              emphasized
                ? "tracking-[0.12em] text-[var(--color-accent)]"
                : "tracking-[0.18em] text-[var(--color-ink-faint)]"
            }`}
          >
            {emphasized ? "Change template" : "Template"}
          </span>
          <span className="block truncate font-display text-[13.5px] font-semibold leading-tight text-[var(--color-ink)]">
            {theme.name}
          </span>
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Templates"
          className="absolute inset-x-0 z-30 mt-1.5 max-h-64 list-none overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-card"
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
                  className={`flex min-h-11 w-full items-center px-3 py-1.5 text-left transition duration-100 ease-out hover:bg-[var(--color-accent-tint)] md:min-h-0 ${
                    selected ? "bg-[var(--color-accent-tint)]" : ""
                  }`}
                >
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

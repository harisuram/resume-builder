"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { TEMPLATE_LIST } from "@/components/templates/registry";
import { getTheme, layoutLabel } from "@/components/templates/shared/theme";

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

/** How long the closing animation runs before the panel unmounts. Matches
 * `template-picker-out` in globals.css. */
const CLOSE_MS = 120;

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-faint)]" aria-hidden="true">
      <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.5 10.5 3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Matches a template by name, description or layout ("sidebar", "serif"…),
 * ignoring case and extra spaces; every word of the query must match. */
export function matchesTemplateQuery(template: (typeof TEMPLATE_LIST)[number], query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = `${template.name} ${template.description} ${layoutLabel(template.layout)} ${template.fontDisplay}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
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
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const searchId = useId();
  const theme = getTheme(value);
  const [query, setQuery] = useState("");
  // The panel stays mounted for CLOSE_MS after `open` turns false so it can
  // animate out; while closing it's hidden from assistive tech and inert.
  const [rendered, setRendered] = useState(open);
  if (open && !rendered) setRendered(true);
  const closing = rendered && !open;

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => {
      setRendered(false);
      setQuery("");
    }, CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  const results = TEMPLATE_LIST.filter((option) => matchesTemplateQuery(option, query));

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // First Escape clears a search; the next one closes the list.
      if (query && document.activeElement === searchRef.current) {
        setQuery("");
        return;
      }
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, query]);

  useLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const selected = list?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
    if (list && selected) {
      // Scroll the list itself — scrollIntoView would also move the builder
      // pane when the picker sits near the bottom of the screen.
      const item = selected.closest("li") ?? selected;
      list.scrollTop = Math.max(0, item.offsetTop - (list.clientHeight - item.offsetHeight) / 2);
    }
    // Typing starts a search straight away.
    searchRef.current?.focus({ preventScroll: true });
  }, [open, value]);

  function choose(id: string) {
    onChange(id);
    setOpen(false);
    triggerRef.current?.focus();
  }

  const options = () => Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);

  function onSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const all = options();
      (all.find((el) => el.getAttribute("aria-selected") === "true") ?? all[0])?.focus();
    } else if (event.key === "Enter" && results.length === 1) {
      event.preventDefault();
      choose(results[0].id);
    }
  }

  function onListKey(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const all = options();
    const at = all.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowUp" && at <= 0) {
      searchRef.current?.focus();
      return;
    }
    all[Math.min(all.length - 1, Math.max(0, at + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
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

      {rendered && (
        <div
          data-template-picker-panel
          data-state={closing ? "closed" : "open"}
          aria-hidden={closing || undefined}
          inert={closing || undefined}
          className="template-picker-panel absolute inset-x-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card"
        >
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
            <SearchIcon />
            <input
              ref={searchRef}
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Search templates"
              aria-label="Search templates"
              aria-controls={listId}
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                className="shrink-0 rounded px-1 text-[11px] font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
              >
                Clear
              </button>
            )}
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {query ? `${results.length} ${results.length === 1 ? "template" : "templates"} found` : ""}
          </p>
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-[12px] text-[var(--color-ink-soft)]">
              No templates match “{query.trim()}”. Try a style like “sidebar” or “serif”.
            </p>
          ) : (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="Templates"
              onKeyDown={onListKey}
              className="max-h-64 list-none overflow-y-auto py-1"
            >
              {results.map((option) => {
                const selected = option.id === value;
                return (
                  <li key={option.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => choose(option.id)}
                      className={`flex min-h-11 w-full items-center px-3 py-1.5 text-left transition duration-100 ease-out hover:bg-[var(--color-accent-tint)] focus-visible:bg-[var(--color-accent-tint)] focus-visible:outline-none md:min-h-0 ${
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
      )}
    </div>
  );
}

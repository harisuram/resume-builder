"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  TEMPLATES,
  layoutLabel,
  type LayoutKind,
  type TemplateTheme,
} from "@/components/templates/shared/theme";
import { ScaledTemplatePreview } from "./ScaledTemplatePreview";
import { TemplatePreviewModal } from "./TemplatePreviewModal";

type LayoutFilter = "all" | LayoutKind;

const FILTERS: { id: LayoutFilter; label: string; short: string }[] = [
  { id: "all", label: "All", short: "All" },
  { id: "single", label: "Single column", short: "Single" },
  { id: "sidebar", label: "Sidebar", short: "Sidebar" },
  { id: "asymmetric", label: "Two column", short: "Two-col" },
  { id: "labeled", label: "Labeled", short: "Labeled" },
];

function builderHref(id: string) {
  return `/builder?template=${encodeURIComponent(id)}`;
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3.5 6.5V3.5h3M12.5 6.5V3.5h-3M3.5 9.5v3h3M12.5 9.5v3h-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3.5 8h9M9 4.5 12.5 8 9 11.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TemplatesGallery() {
  const [filter, setFilter] = useState<LayoutFilter>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? TEMPLATES : TEMPLATES.filter((template) => template.layout === filter)),
    [filter],
  );
  const preview = TEMPLATES.find((template) => template.id === previewId) ?? null;

  function openPreview(template: TemplateTheme, button?: HTMLButtonElement) {
    if (button) openerRef.current = button;
    setPreviewId(template.id);
  }

  const closePreview = useCallback(() => {
    setPreviewId(null);
    openerRef.current?.focus();
  }, []);

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          {visible.length} {visible.length === 1 ? "template" : "templates"}
        </p>
        <div
          role="group"
          aria-label="Filter by layout"
          className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map((option) => {
            const active = filter === option.id;
            const count =
              option.id === "all" ? TEMPLATES.length : TEMPLATES.filter((template) => template.layout === option.id).length;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                aria-label={`${option.label}, ${count} templates`}
                onClick={() => setFilter(option.id)}
                className={`shrink-0 rounded-full px-3 py-2 text-[12.5px] font-medium transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                  active
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-cta"
                    : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]/35 hover:text-[var(--color-ink)]"
                }`}
              >
                <span className="sm:hidden">{option.short}</span>
                <span className="hidden sm:inline">{option.label}</span>
                <span className={`ml-1.5 tabular-nums ${active ? "text-[var(--color-accent-ink)]/80" : "text-[var(--color-ink-faint)]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <ul role="list" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {visible.map((template, index) => (
          <li
            key={template.id}
            className="template-card-in min-w-0"
            style={{ "--template-card-delay": `${Math.min(index, 11) * 45}ms` } as CSSProperties}
          >
            <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card transition duration-300 ease-out hover:border-[var(--color-accent)]/35 hover:shadow-[0_22px_44px_-28px_color-mix(in_srgb,var(--color-ink)_45%,transparent)]">
              <div className="relative aspect-[210/297] w-full overflow-hidden bg-white">
                <div
                  className="absolute inset-0 origin-top transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                  aria-hidden="true"
                >
                  <ScaledTemplatePreview theme={template} compact fullPage framed={false} fillParent />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
                {/* An overlay rather than a button wrapped around the sheet:
                    Nocturne draws its own light/dark toggle, and a button inside a
                    button is invalid HTML that breaks hydration. Opening the
                    preview is all this does — only the link below navigates, so
                    a mis-aimed tap while scanning the grid can't drop someone
                    into the builder. */}
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`Preview ${template.name} layout`}
                  onClick={(event) => openPreview(template, event.currentTarget)}
                  className="absolute inset-0 z-[2] flex cursor-zoom-in items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  {/* Fixed gray, not theme tokens: the sheet is always white
                      paper, so a white/surface pill vanished into it (and on a
                      dark theme --color-ink printed white on white). */}
                  <span className="flex items-center gap-1 rounded-full bg-zinc-800/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-card ring-1 ring-white/10 opacity-0 transition duration-300 group-hover:opacity-100 [button:focus-visible>&]:opacity-100">
                    <ExpandIcon />
                    Preview
                  </span>
                </button>
                {/* The builder link lives on the sheet instead of as a full-width
                    button under every card — a grid of identical solid CTAs
                    drowned out the templates themselves. Pointer devices reveal
                    it on hover/focus; touch devices (no hover) always show it. */}
                <Link
                  href={builderHref(template.id)}
                  aria-label={`Use ${template.name} template`}
                  className="absolute inset-x-2 bottom-2 z-[3] inline-flex min-h-8 items-center justify-center gap-1 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--color-accent-ink)] shadow-cta transition-[opacity,filter] duration-300 ease-out hover:brightness-110 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] group-hover:opacity-100 sm:inset-x-3 sm:bottom-3 sm:text-[12.5px] [@media(hover:hover)]:opacity-0"
                >
                  Use template
                  <ArrowIcon />
                </Link>
              </div>
              <div className="flex min-w-0 flex-1 flex-col border-t border-[var(--color-border)] px-2.5 py-2.5 sm:px-3 sm:py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="min-w-0 truncate font-display text-[13.5px] font-semibold tracking-tight text-[var(--color-ink)] sm:text-[15px]">
                    {template.name}
                  </h2>
                  <span className="hidden shrink-0 rounded-full bg-[var(--color-accent-tint)] px-2 py-0.5 text-[10px] font-medium tracking-wide text-[var(--color-accent)] sm:inline">
                    {layoutLabel(template.layout)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--color-ink-soft)] sm:text-[12.5px]">
                  {template.description}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-[13px] text-[var(--color-ink-soft)] sm:mt-10">
        Tap a sheet for a closer look, or hit Use template to open it in the builder.
      </p>

      {preview && <TemplatePreviewModal theme={preview} onClose={closePreview} />}
    </>
  );
}

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
            <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card transition duration-300 ease-out hover:-translate-y-1 hover:border-[var(--color-accent)]/35 hover:shadow-[0_22px_44px_-28px_color-mix(in_srgb,var(--color-ink)_45%,transparent)]">
              <div className="relative aspect-[210/297] w-full overflow-hidden bg-white" aria-hidden="true">
                <div className="absolute inset-0 origin-top transition-transform duration-500 ease-out group-hover:scale-[1.035]">
                  <ScaledTemplatePreview theme={template} compact fullPage framed={false} fillParent />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-2.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink)] shadow-card opacity-0 transition duration-300 group-hover:opacity-100">
                  Use template
                </span>
              </div>
              <div className="min-w-0 border-t border-[var(--color-border)] px-2.5 py-2.5 sm:px-3 sm:py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="min-w-0 truncate font-display text-[13.5px] font-semibold tracking-tight text-[var(--color-ink)] sm:text-[15px]">
                    {template.name}
                  </h2>
                  <span className="hidden shrink-0 rounded-full bg-[var(--color-accent-tint)] px-2 py-0.5 text-[10px] font-medium tracking-wide text-[var(--color-accent)] sm:inline">
                    {layoutLabel(template.layout)}
                  </span>
                </div>
                <p className="mt-0.5 min-h-[2.4em] text-[11.5px] leading-snug text-[var(--color-ink-soft)] sm:min-h-0 sm:text-[12.5px]">
                  {template.description}
                </p>
              </div>
              <Link
                href={builderHref(template.id)}
                aria-label={`Use ${template.name} template`}
                className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              />
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`Preview ${template.name} layout`}
                onClick={(event) => openPreview(template, event.currentTarget)}
                className="absolute top-2 left-2 z-[2] hidden h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[var(--color-ink-soft)] shadow-card backdrop-blur-sm transition duration-200 hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              >
                <ExpandIcon />
              </button>
            </article>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-[13px] text-[var(--color-ink-soft)] sm:mt-10">
        Click a template to open it in the builder.
      </p>

      {preview && <TemplatePreviewModal theme={preview} onClose={closePreview} />}
    </>
  );
}

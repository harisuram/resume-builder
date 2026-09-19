"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  TEMPLATES,
  layoutLabel,
  type LayoutKind,
  type TemplateTheme,
} from "@/components/templates/shared/theme";
import { ctaPrimary } from "@/components/ui/cta";
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
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
        d="M3 8h10M9 4.5 12.5 8 9 11.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? TEMPLATES : TEMPLATES.filter((template) => template.layout === filter)),
    [filter],
  );
  const selected = TEMPLATES.find((template) => template.id === selectedId) ?? null;
  const preview = TEMPLATES.find((template) => template.id === previewId) ?? null;

  function selectTemplate(template: TemplateTheme) {
    setSelectedId(template.id);
  }

  function openPreview(template: TemplateTheme, button?: HTMLButtonElement) {
    if (button) openerRef.current = button;
    setSelectedId(template.id);
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

      <ul
        role="list"
        className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4"
      >
        {visible.map((template, index) => {
          const selectedCard = template.id === selectedId;
          return (
            <li
              key={template.id}
              className="template-card-in min-w-0"
              style={{ "--template-card-delay": `${Math.min(index, 11) * 45}ms` } as CSSProperties}
            >
              <article
                className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-[var(--color-surface)] shadow-card transition duration-300 ease-out hover:-translate-y-1 ${
                  selectedCard
                    ? "border-transparent"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]/35 hover:shadow-[0_22px_44px_-28px_color-mix(in_srgb,var(--color-ink)_45%,transparent)]"
                }`}
                style={
                  selectedCard
                    ? {
                        boxShadow: `0 0 0 2px var(--color-paper), 0 0 0 4px ${template.accent}, 0 22px 44px -28px color-mix(in srgb, ${template.accent} 55%, transparent)`,
                      }
                    : undefined
                }
              >
                <button
                  type="button"
                  aria-pressed={selectedCard}
                  aria-label={`Select ${template.name} template`}
                  onClick={() => selectTemplate(template)}
                  className="flex min-w-0 flex-1 cursor-pointer flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  <div className="relative aspect-[210/297] w-full overflow-hidden bg-white">
                    <div className="absolute inset-0 origin-top transition-transform duration-500 ease-out group-hover:scale-[1.035]" aria-hidden="true">
                      <ScaledTemplatePreview
                        theme={template}
                        compact
                        fullPage
                        framed={false}
                        fillParent
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                    <span
                      className={`pointer-events-none absolute bottom-2.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink)] shadow-card transition duration-300 ${
                        selectedCard ? "opacity-0 md:group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {selectedCard ? "Selected" : "Select"}
                    </span>
                    <span
                      className={`absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-card ${
                        selectedCard ? "template-check-pop scale-100 opacity-100" : "scale-75 opacity-0"
                      }`}
                      style={{ background: template.accent }}
                      aria-hidden="true"
                    >
                      <CheckIcon />
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
                </button>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`Preview ${template.name} layout`}
                  onClick={(event) => openPreview(template, event.currentTarget)}
                  className="absolute top-2 left-2 z-10 hidden h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[var(--color-ink-soft)] shadow-card backdrop-blur-sm transition duration-200 hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                >
                  <ExpandIcon />
                </button>
              </article>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-center text-[13px] text-[var(--color-ink-soft)] sm:mt-10">
        {selected ? (
          <span>
            {selected.name} is selected — continue into the builder, or{" "}
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={(event) => openPreview(selected, event.currentTarget)}
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              preview it larger
            </button>
            .
          </span>
        ) : (
          "Select a template to continue building."
        )}
      </p>

      {selected && (
        <div
          role="region"
          aria-label="Selected template"
          className="template-dock-in pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"
        >
          <div className="pointer-events-auto mx-auto flex w-full max-w-3xl flex-col gap-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-3 py-3 shadow-[0_-12px_40px_color-mix(in_srgb,var(--color-ink)_16%,transparent)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="hidden h-9 w-1.5 shrink-0 rounded-full sm:block"
                style={{ background: selected.accent }}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
                  Continue building
                </p>
                <p key={selected.id} className="template-dock-name truncate font-display text-[15px] font-semibold text-[var(--color-ink)]">
                  {selected.name}
                  <span className="hidden font-sans text-[13px] font-normal text-[var(--color-ink-soft)] sm:inline">
                    {" "}
                    · {layoutLabel(selected.layout)}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={(event) => openPreview(selected, event.currentTarget)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[13px] font-semibold text-[var(--color-ink)] transition duration-200 hover:border-[var(--color-accent)]/35 sm:min-h-0 sm:w-auto"
              >
                Preview
              </button>
              <Link
                href={builderHref(selected.id)}
                className={`${ctaPrimary.sm} min-h-11 w-full gap-1.5 sm:min-h-0 sm:w-auto`}
              >
                Continue with {selected.name}
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      )}

      {preview && <TemplatePreviewModal theme={preview} onClose={closePreview} />}
    </>
  );
}

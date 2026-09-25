"use client";

import { useLayoutEffect, useRef } from "react";
import { ScaledTemplatePreview } from "@/components/site/ScaledTemplatePreview";
import { TEMPLATE_LIST } from "@/components/templates/registry";

/** Scrollable column of template thumbnails for the export step on desktop —
 * the dropdown picker hides there since every look is already on screen. */
export function TemplateRail({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const listRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    // Bring the current template into view on entry. Scroll the list itself —
    // scrollIntoView would also move the export pane.
    const list = listRef.current;
    const selected = list?.querySelector<HTMLElement>('[aria-pressed="true"]')?.closest("li");
    if (!list || !selected) return;
    list.scrollTop = Math.max(0, selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2);
    // Only on mount — re-centering after every click would jump the list.
  }, []);

  return (
    <div className="no-print flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-1 pb-3">
        <h3 className="font-display text-[14px] font-semibold leading-tight text-[var(--color-ink)]">Choose a template</h3>
        <p className="mt-0.5 text-[11px] leading-snug text-[var(--color-ink-faint)]">
          Tap any design to restyle your resume instantly.
        </p>
      </div>
      <ul
        ref={listRef}
        role="list"
        aria-label="Templates"
        className="grid min-h-0 flex-1 list-none grid-cols-1 content-start gap-4 overflow-y-auto overscroll-contain px-1 pb-4 [scrollbar-gutter:stable] xl:grid-cols-2 xl:gap-3"
      >
        {TEMPLATE_LIST.map((template) => {
          const selected = template.id === value;
          return (
            <li key={template.id} className="min-w-0">
              <div
                className={`group relative overflow-hidden rounded-lg border bg-white shadow-card transition duration-150 ease-out ${
                  selected
                    ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/35"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]/45"
                }`}
              >
                <div className="relative aspect-[210/297] w-full overflow-hidden" aria-hidden="true" inert>
                  <ScaledTemplatePreview theme={template} compact fullPage framed={false} fillParent />
                </div>
                {/* An overlay rather than a button wrapped around the sheet:
                    Vitae draws its own toggle button, and nested buttons are
                    invalid HTML. */}
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Use ${template.name} template`}
                  onClick={() => onChange(template.id)}
                  className="absolute inset-0 z-[2] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                />
              </div>
              <p
                className={`mt-1.5 truncate px-0.5 text-[11.5px] leading-tight ${
                  selected ? "font-semibold text-[var(--color-accent)]" : "font-medium text-[var(--color-ink)]"
                }`}
              >
                {template.name}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { TEMPLATES, type TemplateTheme } from "@/components/templates/shared/theme";
import { TemplateThumb } from "./TemplateThumb";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { HOME_SERIF } from "./home/serif";

const PREVIEW = TEMPLATES.slice(0, 6);

export function TemplatePreviewStrip() {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const preview = PREVIEW.find((template) => template.id === previewId) ?? null;

  function openPreview(template: TemplateTheme, button: HTMLButtonElement) {
    openerRef.current = button;
    setPreviewId(template.id);
  }

  function closePreview() {
    setPreviewId(null);
    openerRef.current?.focus();
  }

  return (
    <section
      aria-labelledby="template-strip-heading"
      className="mt-16 w-full min-w-0 max-w-6xl border-t border-[var(--color-ink)]/15 pt-10 sm:mt-24 sm:pt-12 lg:mt-32"
    >
      <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id="template-strip-heading" className={`${HOME_SERIF} text-[32px] leading-tight tracking-[-0.01em] text-[var(--color-ink)] sm:text-[40px]`}>
          {TEMPLATES.length} templates, all free
        </h2>
        <Link
          href="/templates"
          className="text-[15px] font-medium text-[var(--color-ink)] underline decoration-[var(--color-ink)]/30 underline-offset-4 hover:decoration-[var(--color-ink)]"
        >
          See all templates
        </Link>
      </div>
      {/* Phones: a row to swipe through, peeking off the edge. */}
      <div className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
        {PREVIEW.map((template) => (
          <button
            key={template.id}
            type="button"
            aria-haspopup="dialog"
            aria-label={`Preview ${template.name} layout`}
            onClick={(event) => openPreview(template, event.currentTarget)}
            className="group w-[44%] min-w-0 shrink-0 cursor-pointer snap-start sm:w-auto overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-left shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--color-accent)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <div className="relative aspect-[210/297] w-full overflow-hidden bg-white">
              {/* The button's aria-label already names the template. */}
              <div className="absolute inset-0 origin-top transition-transform duration-500 ease-out group-hover:scale-[1.035]">
                <TemplateThumb theme={template} alt="" sizes="(min-width: 1024px) 140px, (min-width: 640px) 33vw, 50vw" />
              </div>
            </div>
            <p className="truncate border-t border-[var(--color-border)] px-2 py-2 text-center text-[11px] font-medium text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]">
              {template.name}
            </p>
          </button>
        ))}
      </div>

      {preview && <TemplatePreviewModal theme={preview} onClose={closePreview} />}
    </section>
  );
}

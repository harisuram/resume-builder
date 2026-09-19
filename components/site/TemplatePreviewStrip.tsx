"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { TEMPLATES, type TemplateTheme } from "@/components/templates/shared/theme";
import { ScaledTemplatePreview } from "./ScaledTemplatePreview";
import { TemplatePreviewModal } from "./TemplatePreviewModal";

const PREVIEW = TEMPLATES.slice(0, 6);

export function TemplatePreviewStrip() {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const preview = PREVIEW.find((template) => template.id === previewId) ?? null;

  function openPreview(template: TemplateTheme, button: HTMLButtonElement) {
    openerRef.current = button;
    setPreviewId(template.id);
  }

  const closePreview = useCallback(() => {
    setPreviewId(null);
    openerRef.current?.focus();
  }, []);

  return (
    <div className="mt-16 w-full min-w-0 max-w-4xl">
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          {TEMPLATES.length} templates
        </p>
        <Link href="/templates" className="text-[13px] font-medium text-[var(--color-accent)] hover:underline">
          See all templates
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {PREVIEW.map((template) => (
          <button
            key={template.id}
            type="button"
            aria-haspopup="dialog"
            aria-label={`Preview ${template.name} layout`}
            onClick={(event) => openPreview(template, event.currentTarget)}
            className="group min-w-0 cursor-pointer overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-left shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--color-accent)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <div className="relative aspect-[210/297] w-full overflow-hidden bg-white">
              <div
                className="absolute inset-0 origin-top transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                aria-hidden="true"
              >
                <ScaledTemplatePreview theme={template} compact fullPage framed={false} fillParent />
              </div>
            </div>
            <p className="truncate border-t border-[var(--color-border)] px-2 py-2 text-center text-[11px] font-medium text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]">
              {template.name}
            </p>
          </button>
        ))}
      </div>

      {preview && <TemplatePreviewModal theme={preview} onClose={closePreview} />}
    </div>
  );
}

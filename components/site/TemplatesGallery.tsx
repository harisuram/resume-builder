"use client";

import { useCallback, useRef, useState } from "react";
import { TEMPLATES, layoutLabel, type TemplateTheme } from "@/components/templates/shared/theme";
import { TemplatePreviewModal } from "./TemplatePreviewModal";

export function TemplatesGallery() {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const preview = TEMPLATES.find((template) => template.id === previewId) ?? null;

  function openPreview(template: TemplateTheme, button: HTMLButtonElement) {
    openerRef.current = button;
    setPreviewId(template.id);
  }

  const closePreview = useCallback(() => {
    setPreviewId(null);
    openerRef.current?.focus();
  }, []);

  return (
    <>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {TEMPLATES.map((template) => (
          <li key={template.id}>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-label={`Preview ${template.name} layout`}
              onClick={(event) => openPreview(template, event.currentTarget)}
              className="w-full cursor-pointer overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-left shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--color-accent)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            >
              <div className="h-1.5" style={{ background: template.accent }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
                    {template.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-[var(--color-accent-tint)] px-2 py-0.5 text-[10.5px] font-medium tracking-wide text-[var(--color-accent)]">
                    {layoutLabel(template.layout)}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{template.description}</p>
                <p className="mt-3 text-[12px] font-medium text-[var(--color-accent)]">Preview layout</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {preview && <TemplatePreviewModal theme={preview} onClose={closePreview} />}
    </>
  );
}

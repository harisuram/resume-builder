"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { TEMPLATES, type TemplateTheme } from "@/components/templates/shared/theme";
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
          Thirty-one templates
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
            className="group min-w-0 cursor-pointer overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--color-accent)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <div
              className="rounded-lg px-2 pt-2.5 pb-3"
              style={{
                background: `linear-gradient(180deg, color-mix(in srgb, ${template.accent} 22%, white), #fff)`,
              }}
            >
              <div className="mx-auto h-1 w-8 rounded-full" style={{ background: template.accent }} />
              <div className="mt-2 space-y-1">
                <div className="h-1 rounded-full bg-[var(--color-border)]" />
                <div className="h-1 w-4/5 rounded-full bg-[var(--color-border)]" />
                <div className="h-1 w-3/5 rounded-full bg-[var(--color-border)]" />
              </div>
            </div>
            <p className="mt-2 truncate text-center text-[11px] font-medium text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]">
              {template.name}
            </p>
          </button>
        ))}
      </div>

      {preview && <TemplatePreviewModal theme={preview} onClose={closePreview} />}
    </div>
  );
}

"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { getTemplateComponent } from "@/components/templates/registry";
import { getTheme } from "@/components/templates/shared/theme";
import { PAGE_WIDTH_PX } from "@/lib/page";
import { sampleResumeForPreview } from "@/lib/sampleResume";
import type { ResumeData } from "@/lib/types";

function SwapIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path
        d="M4.5 5.5h7.2M9.2 3.2 11.8 5.5 9.2 7.8M11.5 10.5H4.3M6.8 8.2 4.2 10.5 6.8 12.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EmptyResumePreview({
  data,
  onChangeTemplate,
}: {
  data: ResumeData;
  onChangeTemplate?: () => void;
}) {
  const theme = getTheme(data.templateId);
  const sample = sampleResumeForPreview(data);
  const Template = getTemplateComponent(theme.id);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [stageHeight, setStageHeight] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage) return;

    function measure() {
      const containerWidth = viewport!.clientWidth;
      const nextScale = containerWidth > 0 ? Math.min(containerWidth / PAGE_WIDTH_PX, 1) : 1;
      const nextStageHeight = stage!.offsetHeight * nextScale;
      setScale((prev) => (prev === nextScale ? prev : nextScale));
      setStageHeight((prev) => (Math.abs(prev - nextStageHeight) < 0.5 ? prev : nextStageHeight));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [data.templateId, data.sectionStatus, data.sectionOrder, data.sections.additional?.heading]);

  return (
    <div data-empty-resume-preview="" role="region" aria-label={`${theme.name} template preview`} className="relative">
      <div
        ref={viewportRef}
        className="resume-scale-viewport relative mx-auto w-full max-w-[760px] overflow-hidden"
        style={{ height: stageHeight || undefined }}
      >
        <div
          ref={stageRef}
          className="resume-scale-stage pointer-events-none relative origin-top-left overflow-hidden rounded-sm border border-[var(--color-border)] shadow-card"
          aria-hidden="true"
          data-sample-resume={theme.id}
          style={{ width: PAGE_WIDTH_PX, transform: `scale(${scale})` }}
        >
          <Template data={sample} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[color-mix(in_srgb,var(--color-ink)_3.5%,var(--color-paper))] via-[color-mix(in_srgb,var(--color-paper)_80%,transparent)] to-transparent pt-16 pb-1">
        <div className="pointer-events-auto mx-1 flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-3 py-2.5 shadow-card backdrop-blur-sm sm:mx-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[var(--color-ink)]">
              Preview of {theme.name}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--color-ink-soft)]">
              Sample text — add your details and this becomes your resume.
            </p>
          </div>
          {onChangeTemplate && (
            <button
              type="button"
              onClick={onChangeTemplate}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-[12px] font-semibold text-[var(--color-accent-ink)] shadow-cta transition duration-150 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] sm:min-h-0 sm:w-auto"
            >
              <SwapIcon />
              Change template
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { canonicalTemplateId } from "@/components/templates/shared/theme";
import { useResumePdf } from "@/components/builder/useResumePdf";
import { letterContent } from "@/lib/coverLetter";
import { persistCurrentLetter, useCoverLetterStore } from "@/lib/coverLetterStore";
import { useBuilderStore, useResumeData } from "@/lib/store";
import type { ResumeData } from "@/lib/types";

/** The letter's template: its own pick, or the resume's when it follows it. */
export function useLetterTemplate() {
  const resumeTemplateId = useBuilderStore((s) => canonicalTemplateId(s.templateId));
  const ownTemplateId = useCoverLetterStore((s) => s.letter.templateId);
  const templateId = ownTemplateId ? canonicalTemplateId(ownTemplateId) : resumeTemplateId;
  return {
    templateId,
    resumeTemplateId,
    /** True while the letter follows the resume's template. */
    matchesResume: templateId === resumeTemplateId,
  };
}

/** Picking the resume's own template goes back to following it, so a later
 * change on the resume carries over to the letter again. */
export function setLetterTemplate(id: string) {
  const resumeTemplateId = canonicalTemplateId(useBuilderStore.getState().templateId);
  const next = canonicalTemplateId(id);
  useCoverLetterStore.getState().setTemplateId(next === resumeTemplateId ? null : next);
  persistCurrentLetter();
}

/** Keeps the cover letter PDF rendered — the resume's header details in the
 * letter's template, with the letter where the sections would go. */
export function useLetterPdf(enabled: boolean, debounceMs?: number) {
  const resume = useResumeData();
  const letter = useCoverLetterStore((s) => s.letter);
  const { templateId } = useLetterTemplate();
  const data = useMemo<ResumeData>(() => ({ ...resume, templateId }), [resume, templateId]);
  const content = useMemo(() => letterContent(letter), [letter]);
  return useResumePdf(data, enabled, debounceMs, content);
}

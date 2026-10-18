"use client";

import { useState } from "react";
import { getTheme } from "@/components/templates/shared/theme";
import { DocumentSheet, SHOWCASE_TEMPLATE_IDS, type ShowcaseTemplateId } from "./DocumentSheet";
import { HOME_SERIF } from "./home/serif";

/** A resume and its cover letter side by side, restyled together by the
 * template list — the letter follows the resume's template in the builder
 * the same way. */
export function MatchingSet() {
  const [templateId, setTemplateId] = useState<ShowcaseTemplateId>("fern");
  const name = getTheme(templateId).name;

  return (
    <section
      aria-labelledby="matching-set-heading"
      className="mt-16 grid w-full min-w-0 max-w-6xl gap-8 border-t border-[var(--color-ink)]/15 pt-10 sm:mt-24 sm:gap-10 sm:pt-12 lg:mt-32 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14"
    >
      <div className="min-w-0">
        <h2 id="matching-set-heading" className={`${HOME_SERIF} text-[32px] leading-tight tracking-[-0.01em] text-[var(--color-ink)] sm:text-[40px]`}>
          Pick a look once. Both pages follow.
        </h2>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          The cover letter takes your resume’s template, name and contact details, so the two arrive as a set. Want
          the letter to look different? Choose another template for it — your resume keeps its own.
        </p>

        <div
          role="radiogroup"
          aria-label="Template"
          className="-mx-6 mt-6 flex snap-x gap-x-6 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:mt-7 sm:flex-wrap sm:gap-x-5 sm:gap-y-2 sm:overflow-visible sm:px-0 lg:flex-col lg:gap-y-1 [&::-webkit-scrollbar]:hidden"
        >
          {SHOWCASE_TEMPLATE_IDS.map((id) => {
            const theme = getTheme(id);
            const selected = id === templateId;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTemplateId(id)}
                className={`group inline-flex shrink-0 snap-start items-center gap-2.5 whitespace-nowrap py-1 text-left text-[15px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                  selected ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                  style={{ background: theme.headerColor ?? theme.railColor ?? theme.accent }}
                  aria-hidden="true"
                />
                <span className={selected ? "underline decoration-2 underline-offset-[6px]" : ""}>{theme.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-2 items-start gap-4 sm:gap-6">
        {(["resume", "letter"] as const).map((kind) => (
          <figure key={kind} className="min-w-0">
            {/* Keyed by template so a switch fades the new pair in. */}
            <div key={templateId} className="animate-fade-up">
              <DocumentSheet
                kind={kind}
                templateId={templateId}
                alt={`${kind === "resume" ? "Resume" : "Cover letter"} in the ${name} template`}
                sizes="(min-width: 1024px) 330px, 45vw"
              />
            </div>
            <figcaption className="mt-3 text-[13px] text-[var(--color-ink-soft)]">
              {kind === "resume" ? "Resume" : "Cover letter"}, {name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { getTheme } from "@/components/templates/shared/theme";
import { DocumentSheet, SHOWCASE_TEMPLATE_IDS, type ShowcaseTemplateId } from "./DocumentSheet";

/** "One look, two documents": a resume and its cover letter side by side,
 * restyled together by the template chips — the letter follows the resume's
 * template in the builder the same way. */
export function MatchingSet() {
  const [templateId, setTemplateId] = useState<ShowcaseTemplateId>(SHOWCASE_TEMPLATE_IDS[0]);
  const name = getTheme(templateId).name;

  return (
    <section aria-labelledby="matching-set-heading" className="mt-24 w-full min-w-0 max-w-5xl">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Matching set</p>
        <h2
          id="matching-set-heading"
          className="mt-2 text-balance font-display text-[26px] font-semibold tracking-tight text-[var(--color-ink)] sm:text-[32px]"
        >
          One look, two documents
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Your cover letter uses your resume&rsquo;s template, name and contact details, so the two arrive as a set.
          Want a different look for the letter? Pick one — your resume keeps its own.
        </p>
      </div>

      <div role="radiogroup" aria-label="Template" className="mt-7 flex flex-wrap justify-center gap-2">
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
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                selected
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-tint)] text-[var(--color-accent)] shadow-card"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-ink)]"
              }`}
            >
              <span
                className="h-3 w-3 rounded-full ring-1 ring-black/10"
                style={{ background: theme.headerColor ?? theme.railColor ?? theme.accent }}
                aria-hidden="true"
              />
              {theme.name}
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-[28px] border border-[var(--color-border)] bg-[radial-gradient(90%_70%_at_50%_0%,var(--color-accent-tint),transparent_75%)] px-5 py-8 sm:px-12 sm:py-12">
        <div className="mx-auto grid max-w-[620px] grid-cols-2 items-start gap-4 sm:gap-8">
          {(["resume", "letter"] as const).map((kind) => (
            <figure key={kind} className="min-w-0">
              {/* Keyed by template so a switch fades the new pair in. */}
              <div key={templateId} className="animate-fade-up">
                <DocumentSheet
                  kind={kind}
                  templateId={templateId}
                  alt={`${kind === "resume" ? "Resume" : "Cover letter"} in the ${name} template`}
                  sizes="(min-width: 640px) 290px, 45vw"
                />
              </div>
              <figcaption className="mt-3 text-center text-[12.5px] font-medium text-[var(--color-ink-soft)]">
                {kind === "resume" ? "Resume" : "Cover letter"}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

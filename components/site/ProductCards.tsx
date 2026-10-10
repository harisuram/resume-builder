import Link from "next/link";
import type { ReactNode } from "react";
import { ctaGhost, ctaPrimary } from "@/components/ui/cta";
import { TEMPLATE_COUNT_WORDS } from "@/lib/seo";
import { DocumentSheet, type ShowcaseTemplateId } from "./DocumentSheet";
import { HomeImportCallout } from "./HomeImportCallout";

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3.5 8.2 2.8 2.8 6.2-6.6" />
    </svg>
  );
}

function ResumeGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M9.5 12h5M9.5 15.5h5M9.5 8.5h2" />
    </svg>
  );
}

function LetterGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

/** Two sheets fanned on a soft stage: the front one in full colour, the one
 * behind it tilted, so each card shows its document as a finished page. */
function Stage({
  kind,
  front,
  back,
  label,
}: {
  kind: "resume" | "letter";
  front: ShowcaseTemplateId;
  back: ShowcaseTemplateId;
  label: string;
}) {
  return (
    <div
      className="relative h-36 overflow-hidden border-b border-[var(--color-border)] bg-[radial-gradient(120%_90%_at_50%_0%,var(--color-accent-tint),transparent_70%)] sm:h-48"
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-7 w-[42%] max-w-[190px] -translate-x-[78%] rotate-[-7deg] opacity-80 transition-transform duration-500 ease-out group-hover:-translate-x-[84%] group-hover:rotate-[-9deg] sm:top-9">
        <DocumentSheet kind={kind} templateId={back} alt="" sizes="190px" />
      </div>
      <div className="absolute left-1/2 top-5 w-[46%] max-w-[210px] -translate-x-[30%] rotate-[3deg] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 group-hover:rotate-[1.5deg] sm:top-6">
        <DocumentSheet kind={kind} templateId={front} alt={label} sizes="210px" />
      </div>
    </div>
  );
}

function ProductCard({
  kind,
  eyebrow,
  title,
  body,
  points,
  actions,
  stage,
}: {
  kind: "resume" | "letter";
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  actions: ReactNode;
  stage: ReactNode;
}) {
  const headingId = `product-${kind}`;
  return (
    <article
      aria-labelledby={headingId}
      className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_24px_60px_-32px_rgb(15_23_42_/_0.35)] transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[var(--color-accent)]/30 hover:shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_32px_70px_-30px_rgb(15_23_42_/_0.45)]"
    >
      {stage}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {kind === "resume" ? <ResumeGlyph /> : <LetterGlyph />}
          {eyebrow}
        </p>
        <h3 id={headingId} className="mt-1.5 font-display text-[21px] font-semibold tracking-tight text-[var(--color-ink)]">
          {title}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">{body}</p>
        {/* On phones the actions come before the checklist, so the way in is
            on the first screen; from sm the checklist sits above them. */}
        <ul className="order-last mt-4 flex flex-col gap-1.5 sm:order-none sm:mt-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-[13.5px] text-[var(--color-ink-soft)]">
              <CheckIcon />
              {point}
            </li>
          ))}
        </ul>
        {/* Actions pinned to the card's foot so both cards line up. */}
        <div className="mt-5 flex flex-col gap-2.5 sm:mt-auto sm:flex-row sm:flex-wrap sm:items-start sm:pt-5">{actions}</div>
      </div>
    </article>
  );
}

/** The homepage's two products, side by side and equal: resume and cover
 * letter. Each card carries its own way in. */
export function ProductCards() {
  return (
    <section aria-labelledby="products-heading" className="mt-9 w-full min-w-0 max-w-5xl sm:mt-10">
      <h2 id="products-heading" className="sr-only">
        Start with a resume or a cover letter
      </h2>
      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        <ProductCard
          kind="resume"
          eyebrow="Resume"
          title="Build your resume"
          body="Fill in only the sections that belong, or import the resume you already have, then pick a look in the live preview."
          points={[
            `${TEMPLATE_COUNT_WORDS} ATS-friendly templates`,
            "Import from PDF or Word",
            "AI rewrite for summaries and bullet points",
          ]}
          stage={<Stage kind="resume" front="ember" back="atlas" label="A resume in the Ember template" />}
          actions={
            <>
              <Link href="/builder" className={`${ctaPrimary.md} w-full sm:w-auto`}>
                Build my resume
              </Link>
              <HomeImportCallout variant="button" />
            </>
          }
        />
        <ProductCard
          kind="letter"
          eyebrow="Cover letter"
          title="Write your cover letter"
          body="Guided one paragraph at a time, with your name, contact details and template carried over from your resume."
          points={[
            "Matches your resume’s template, or picks its own",
            "AI help on every paragraph",
            "Reorder or switch off any paragraph",
          ]}
          stage={<Stage kind="letter" front="ember" back="atlas" label="A cover letter in the Ember template" />}
          actions={
            <>
              <Link href="/cover-letter/builder" className={`${ctaPrimary.md} w-full sm:w-auto`}>
                Write my cover letter
              </Link>
              <Link href="/cover-letter" className={`${ctaGhost} w-full sm:w-auto`}>
                How it works
              </Link>
            </>
          }
        />
      </div>
    </section>
  );
}

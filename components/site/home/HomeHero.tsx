import Image from "next/image";
import Link from "next/link";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { DocumentSheet, coverLetterThumbSrc } from "../DocumentSheet";
import { TEMPLATE_THUMB_HEIGHT, TEMPLATE_THUMB_WIDTH, templateThumbSrc } from "../TemplateThumb";
import { HomeImportCallout } from "../HomeImportCallout";
import { HOME_SERIF, HOME_SERIF_ITALIC } from "./serif";

/** One of the two ways in. Both are drawn the same, at the same size, so
 * neither document reads as the main one. On a phone each is a tile: its
 * page taped to a sheet of warm paper, a serif title, a one-line caption and
 * a round arrow, the two side by side at the top of the screen. From sm up
 * it's a row in a ruled list beside the sample pages. */
function Door({
  href,
  title,
  note,
  caption,
  id,
  page,
  tilt,
}: {
  href: string;
  title: string;
  note: string;
  /** Phones only: the short line under the title. */
  caption: string;
  id: string;
  page: string;
  tilt: "left" | "right";
}) {
  return (
    <li className="min-w-0 sm:border-t sm:border-[var(--color-ink)]/15 sm:last:border-b">
      <Link
        href={href}
        aria-label={title}
        aria-describedby={id}
        className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--color-ink)]/10 bg-[var(--color-surface)] shadow-[0_1px_1px_rgb(15_23_42_/_0.04),0_2px_6px_-2px_rgb(15_23_42_/_0.08),0_22px_40px_-26px_rgb(15_23_42_/_0.45)] transition duration-200 ease-out active:scale-[0.975] active:shadow-[0_1px_1px_rgb(15_23_42_/_0.04),0_8px_18px_-14px_rgb(15_23_42_/_0.4)] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-none sm:border-0 sm:bg-transparent sm:py-6 sm:shadow-none sm:active:scale-100 sm:active:shadow-none"
      >
        {/* Phones: the page, slightly askew and taped to warm paper — the
            desktop "desk" in miniature. */}
        <span
          className="relative block aspect-[4/5] overflow-hidden bg-[color-mix(in_srgb,var(--home-tape)_30%,var(--color-surface))] sm:hidden"
          aria-hidden="true"
        >
          <span
            className={`absolute left-1/2 top-5 block w-[80%] -translate-x-1/2 ${tilt === "left" ? "-rotate-[2.5deg]" : "rotate-[2.5deg]"}`}
          >
            <Tape className={`-top-2.5 h-4 w-12 ${tilt === "left" ? "left-3 -rotate-[6deg]" : "right-3 rotate-[6deg]"}`} />
            <Image
              src={page}
              alt=""
              width={TEMPLATE_THUMB_WIDTH}
              height={TEMPLATE_THUMB_HEIGHT}
              sizes="40vw"
              priority
              className="block h-auto w-full rounded-[3px] shadow-[0_2px_4px_rgb(15_23_42_/_0.08),0_14px_24px_-12px_rgb(15_23_42_/_0.45)] ring-1 ring-black/5"
            />
          </span>
          {/* The page runs off the bottom; a soft fade into the card. */}
          <span className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--color-surface)] to-transparent" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col px-3.5 pb-3.5 pt-1 sm:block sm:p-0">
          <span
            className={`${HOME_SERIF} block text-[18px] leading-[1.15] text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)] min-[375px]:text-[20px] sm:text-[32px] sm:leading-tight`}
          >
            {title}
          </span>
          <span id={id} className="mt-1 hidden text-[14.5px] leading-snug text-[var(--color-ink-soft)] sm:block">
            {note}
          </span>
          {/* Phones: a short caption and a round arrow, pinned to the foot. */}
          <span className="mt-auto flex items-center justify-between gap-2 pt-3 sm:hidden" aria-hidden="true">
            <span className="min-w-0 text-[11px] leading-tight text-[var(--color-ink-soft)] min-[375px]:text-[12px]">{caption}</span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] transition-transform group-active:translate-x-0.5">
              <ArrowIcon className="h-2.5 w-4 text-[var(--color-paper)]! group-hover:text-[var(--color-paper)]!" />
            </span>
          </span>
        </span>
        <ArrowIcon className="hidden h-4 w-8 sm:block" />
      </Link>
    </li>
  );
}

function ArrowIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 32 16"
      className={`shrink-0 text-[var(--color-ink)] transition-transform duration-300 ease-out group-hover:translate-x-1.5 group-hover:text-[var(--color-accent)] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 8h29M23 1.5 30 8l-7 6.5" />
    </svg>
  );
}

/** A strip of masking tape, slightly crooked, holding a page down. */
function Tape({ className }: { className: string }) {
  return (
    <span
      className={`absolute z-10 h-6 w-20 bg-[var(--home-tape)] shadow-[0_1px_1px_rgb(0_0_0_/_0.06)] [clip-path:polygon(3%_0,97%_4%,100%_92%,0_100%)] ${className}`}
      aria-hidden="true"
    />
  );
}

/** The sample resume and its cover letter, laid on the page the way you'd
 * leave two printouts on a desk, with a pencilled note saying what they are. */
function Desk() {
  return (
    <div className="relative mx-auto hidden w-full max-w-[460px] sm:block sm:h-[460px] lg:h-[540px] lg:max-w-none" aria-hidden="true">
      <div className="absolute left-0 top-6 w-[58%] -rotate-[4deg] sm:top-8">
        <Tape className="-top-3 left-1/2 -translate-x-1/2 -rotate-[3deg]" />
        <DocumentSheet kind="resume" templateId="ember" alt="" sizes="(min-width: 1024px) 300px, 55vw" />
      </div>
      <div className="absolute right-0 top-20 w-[58%] rotate-[3deg] sm:top-28">
        <Tape className="-top-3 right-8 rotate-[5deg]" />
        <DocumentSheet kind="letter" templateId="ember" alt="" sizes="(min-width: 1024px) 300px, 55vw" />
      </div>
      {/* Pencilled note with an arrow curving down to the pages. */}
      <div className="absolute -top-2 right-2 hidden w-40 rotate-[-4deg] text-right sm:block lg:-right-2 lg:-top-6">
        <p className={`${HOME_SERIF} ${HOME_SERIF_ITALIC} text-[17px] leading-snug text-[var(--color-ink-soft)]`}>
          same template,
          <br />
          both pages
        </p>
        <svg viewBox="0 0 120 70" className="ml-auto mr-10 mt-1 h-12 w-24 text-[var(--color-ink-soft)]" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
          <path d="M104 4c-6 30-40 52-84 54" />
          <path d="M28 50l-9 8 11 4" />
        </svg>
      </div>
    </div>
  );
}

/** The top of the home page: what the site is, in plain words, and the two
 * ways in — resume and cover letter, side by side as equals. */
export function HomeHero() {
  return (
    <section className="grid w-full min-w-0 max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
      {/* Phones: headline, then the two ways in, then the details. From sm
          up: headline, details, then the ruled list. */}
      <div className="flex min-w-0 flex-col">
        <h1 className={`${HOME_SERIF} text-balance text-[33px] leading-[1.06] tracking-[-0.022em] text-[var(--color-ink)] sm:text-[54px] sm:leading-[1.05] sm:tracking-[-0.025em] lg:text-[62px]`}>
          A{" "}
          <span className="bg-[linear-gradient(transparent_62%,var(--home-marker)_62%,var(--home-marker)_92%,transparent_92%)] px-0.5">
            free
          </span>{" "}
          resume builder, and a cover letter <em className={HOME_SERIF_ITALIC}>to match.</em>
        </h1>
        <p className="order-4 mt-6 max-w-[34rem] text-pretty text-[15.5px] leading-relaxed text-[var(--color-ink-soft)] sm:order-none sm:text-[16.5px]">
          No sign-up, no watermark, nothing to pay at the download button. Fill in what belongs, skip what doesn’t,
          and the PDF comes out exactly as the preview shows it. Your draft stays in this browser.
        </p>

        <ul className="order-2 mt-7 grid max-w-[34rem] grid-cols-2 gap-3 sm:order-none sm:mt-9 sm:block">
          <Door
            href="/builder"
            title="Build my resume"
            note={`${TEMPLATES.length} templates, from a blank page or the resume you have.`}
            caption={`${TEMPLATES.length} templates`}
            id="door-resume"
            page={templateThumbSrc("ember")}
            tilt="left"
          />
          <Door
            href="/cover-letter/builder"
            title="Write my cover letter"
            note="Same template and details as your resume, with help on every paragraph."
            caption="Matches your resume"
            id="door-letter"
            page={coverLetterThumbSrc("ember")}
            tilt="right"
          />
        </ul>

        <p className="order-3 mt-3 rounded-2xl border border-[var(--color-ink)]/10 bg-[var(--color-surface)]/60 px-4 py-3.5 text-[14px] leading-snug text-[var(--color-ink-soft)] sm:order-none sm:mt-5 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
          Already have a resume as a PDF or Word file? You can <HomeImportCallout variant="link" /> and edit from
          there.
        </p>
      </div>

      <Desk />
    </section>
  );
}

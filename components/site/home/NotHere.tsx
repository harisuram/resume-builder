import Link from "next/link";
import { HOME_SERIF } from "./serif";

const ITEMS = [
  { thing: "A sign-up form.", detail: "There’s no account to make, and nobody asks for your email." },
  { thing: "A watermark.", detail: "The PDF you download is the one the preview shows, and it’s yours." },
  { thing: "A paywall at the download button.", detail: "Download as often as you like, as many versions as you need." },
  {
    thing: "Your resume on a server.",
    detail: "Drafts are saved in your browser. Text only leaves it when you import a file or ask the AI for a rewrite.",
  },
] as const;

/** A short hand-drawn cross — the mark for "not here". */
function Cross() {
  return (
    <svg viewBox="0 0 20 20" className="mt-1.5 h-4 w-4 shrink-0 text-[var(--color-undo)]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
      <path d="M4.5 4.8c3.4 3 6.9 6.6 10.8 10.6" />
      <path d="M15.2 4.2c-3.6 3.3-7.2 7-10.5 11.3" />
    </svg>
  );
}

/** What the site doesn't do — the usual catches of "free" resume builders,
 * each with the plain fact behind it. */
export function NotHere() {
  return (
    <section
      aria-labelledby="not-here-heading"
      className="mt-16 grid w-full min-w-0 max-w-6xl gap-8 border-t border-[var(--color-ink)]/15 pt-10 sm:mt-24 sm:pt-12 lg:mt-32 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14"
    >
      <div>
        <h2 id="not-here-heading" className={`${HOME_SERIF} text-[32px] leading-tight tracking-[-0.01em] text-[var(--color-ink)] sm:text-[40px]`}>
          What you won’t find here
        </h2>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Most free resume sites have a catch somewhere between the first click and the download. This one is paid
          for by ads instead.{" "}
          <Link href="/private" className="font-medium text-[var(--color-ink)] underline decoration-[var(--color-ink)]/30 underline-offset-4 hover:decoration-[var(--color-ink)]">
            How private it is
          </Link>
        </p>
      </div>
      <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2 sm:gap-y-7">
        {ITEMS.map((item) => (
          <li key={item.thing} className="flex gap-3">
            <Cross />
            <p className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              <span className="font-semibold text-[var(--color-ink)]">{item.thing}</span> {item.detail}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

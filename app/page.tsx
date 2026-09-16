import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { Logo } from "@/components/ui/Logo";
import { ADSENSE_SLOTS } from "@/lib/ads";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Letterform",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  description:
    "A free resume builder: pick the sections you need, skip the rest, and download a PDF. No account — nothing leaves your browser until you choose to save.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const FEATURES = [
  {
    title: "You choose the sections",
    body: "Experience, internships, projects, education, skills, certifications, patents, languages, hobbies, soft skills, plus a custom additional section — they're all in the flow. Turn off anything that doesn't belong. A skipped section never leaves an empty heading on the page.",
  },
  {
    title: "Twenty-one templates, one live preview",
    body: "Switch designs anytime and watch the page update instantly. What you see is the same view you'll download.",
  },
  {
    title: "PDF from the live preview",
    body: "Print a PDF of the template you picked. The download is the same view you already reviewed — same layout, headings, and section order.",
  },
  {
    title: "Private by default",
    body: "Everything lives in your browser. Nothing is saved on this device until you explicitly say so — and nothing is uploaded anywhere.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-[var(--color-paper)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo href="" />
        <Link
          href="/builder"
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-[var(--color-accent-ink)] transition duration-150 ease-out hover:brightness-110 active:brightness-95"
        >
          Start building
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pb-20 pt-10 sm:pt-16">
        <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--color-ink-faint)]">
          Free · No account · Nothing leaves your browser
        </p>
        <h1 className="mt-4 max-w-2xl text-balance text-center font-display text-[36px] font-semibold leading-[1.15] text-[var(--color-ink)] sm:text-[46px]">
          Build a resume from only the sections you need.
        </h1>
        <p className="mt-5 max-w-xl text-center text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Fill in experience, education, projects, internships, skills — or skip any of them. Then pick a template and
          download a PDF. Free, no account, nothing leaves your browser.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/builder"
            className="rounded-md bg-[var(--color-accent)] px-6 py-3 text-[14px] font-medium text-[var(--color-accent-ink)] transition duration-150 ease-out hover:brightness-110 active:brightness-95"
          >
            Build my resume
          </Link>
          <span className="text-[12.5px] text-[var(--color-ink-faint)]">Takes about ten minutes.</span>
        </div>

        <div className="mt-20 grid w-full max-w-4xl gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors duration-150 ease-out hover:border-[var(--color-accent)]/40"
            >
              <h2 className="font-display text-[16px] font-semibold text-[var(--color-ink)]">{feature.title}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">{feature.body}</p>
            </div>
          ))}
        </div>

        <AdSlot
          slot={ADSENSE_SLOTS.landing}
          name="Landing page"
          className="mt-16 flex w-full max-w-3xl flex-col items-center gap-1"
        />
      </main>

      <footer className="border-t border-[var(--color-border)] px-6 py-6 text-center text-[12px] text-[var(--color-ink-faint)]">
        Letterform — built with Next.js, deployed on Cloudflare Pages.
      </footer>
    </div>
  );
}

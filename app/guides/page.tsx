import Link from "next/link";
import { BuilderCta } from "@/components/site/BuilderCta";
import { Lead, MarketingPage, PageTitle } from "@/components/site/MarketingPage";
import { GUIDES, guidePath, guideReadMinutes, type GuideCategory } from "@/lib/guides";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/guides");

const CATEGORY_ORDER: GuideCategory[] = ["Writing", "Sections", "Formatting", "Examples", "Job search"];

export default function GuidesPage() {
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    guides: GUIDES.filter((guide) => guide.category === category),
  })).filter((group) => group.guides.length > 0);

  return (
    <MarketingPage
      jsonLd={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Guides", path: "/guides" },
      ])}
    >
      <div className="mx-auto w-full min-w-0 max-w-4xl">
        <div className="animate-fade-up max-w-2xl">
          <PageTitle>Resume writing guides</PageTitle>
          <Lead>
            Practical, example-led guides to every part of a resume — what to put in each section, how to phrase it, and
            how hiring software and recruiters read the result. Each one stands on its own; read the ones you need.
          </Lead>
        </div>

        {groups.map((group) => (
          <section key={group.category} className="mt-12">
            <h2 className="font-display text-[18px] font-semibold tracking-tight text-[var(--color-ink)]">
              {group.category}
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {group.guides.map((guide) => (
                <li key={guide.slug} className="list-none">
                  <Link
                    href={guidePath(guide.slug)}
                    className="flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card transition-colors hover:border-[var(--color-accent)]"
                  >
                    <span className="font-display text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
                      {guide.title}
                    </span>
                    <span className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">
                      {guide.description}
                    </span>
                    <span className="mt-auto pt-3 text-[12px] text-[var(--color-ink-faint)]">
                      {guideReadMinutes(guide)} min read
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="mt-14">
          <BuilderCta>Make a resume</BuilderCta>
        </div>
      </div>
    </MarketingPage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuilderCta } from "@/components/site/BuilderCta";
import { GuideBody, sectionId } from "@/components/site/GuideBody";
import { Article, Lead, MarketingPage, PageTitle } from "@/components/site/MarketingPage";
import { GUIDES, formatGuideDate, getGuide, guidePath, guideReadMinutes } from "@/lib/guides";
import { SITE_NAME, articleJsonLd, breadcrumbJsonLd, faqJsonLd, guideMetadata } from "@/lib/seo";

// Static export: every guide is prerendered, and unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  return guide ? guideMetadata(guide) : {};
}

const link = "font-medium text-[var(--color-accent)] hover:underline";

export default async function GuidePage({ params }: Props) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();

  const related = guide.related.map(getGuide).filter((g) => g !== undefined);
  const jsonLd = [
    articleJsonLd(guide),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Guides", path: "/guides" },
      { name: guide.title, path: guidePath(guide.slug) },
    ]),
    ...(guide.faqs?.length ? [faqJsonLd(guide.faqs)] : []),
  ];

  return (
    <MarketingPage jsonLd={jsonLd}>
      <Article>
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-[var(--color-ink-faint)]">
          <Link href="/guides" className="hover:text-[var(--color-ink)]">
            Guides
          </Link>
          <span aria-hidden="true"> / </span>
          <span>{guide.category}</span>
        </nav>

        <div className="mt-3">
          <PageTitle>{guide.title}</PageTitle>
        </div>
        <p className="mt-3 text-[12.5px] text-[var(--color-ink-faint)]">
          By the {SITE_NAME} team · Updated{" "}
          <time dateTime={guide.updated}>{formatGuideDate(guide.updated)}</time> · {guideReadMinutes(guide)} min read
        </p>
        <Lead>{guide.intro}</Lead>

        <nav
          aria-label="In this guide"
          className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-card"
        >
          <p className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            In this guide
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13.5px] leading-relaxed">
            {guide.sections.map((section) => (
              <li key={section.heading}>
                <a href={`#${sectionId(section.heading)}`} className={link}>
                  {section.heading}
                </a>
              </li>
            ))}
            {guide.faqs?.length ? (
              <li>
                <a href="#faq" className={link}>
                  Frequently asked questions
                </a>
              </li>
            ) : null}
          </ol>
        </nav>

        <GuideBody sections={guide.sections} />

        {guide.faqs?.length ? (
          <section id="faq" className="scroll-mt-24">
            <h2 className="mt-12 font-display text-[20px] font-semibold tracking-tight text-[var(--color-ink)]">
              Frequently asked questions
            </h2>
            {guide.faqs.map((faq) => (
              <div key={faq.question} className="mt-5">
                <h3 className="font-display text-[15.5px] font-semibold tracking-tight text-[var(--color-ink)]">
                  {faq.question}
                </h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--color-ink-soft)]">{faq.answer}</p>
              </div>
            ))}
          </section>
        ) : null}

        <div className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <p className="font-display text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
            Put it into practice
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
            Build your resume section by section, skip what doesn’t apply, and download a PDF of the template you pick.
            Free, with no account.
          </p>
          <div className="mt-4">
            <BuilderCta>Make a resume</BuilderCta>
          </div>
        </div>

        {related.length ? (
          <section className="mt-12">
            <h2 className="font-display text-[18px] font-semibold tracking-tight text-[var(--color-ink)]">
              Related guides
            </h2>
            <ul className="mt-3 space-y-2 text-[14.5px]">
              {related.map((g) => (
                <li key={g.slug}>
                  <Link href={guidePath(g.slug)} className={link}>
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13.5px]">
              <Link href="/guides" className={link}>
                All resume guides →
              </Link>
            </p>
          </section>
        ) : null}
      </Article>
    </MarketingPage>
  );
}

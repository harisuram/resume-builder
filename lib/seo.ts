import type { Metadata } from "next";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { capitalizedNumberWords } from "./numberWords";
import type { Guide } from "./guides/types";
import { SITE_URL, absoluteUrl, type IndexablePath } from "./site";

/** Spelled-out template count ("Forty"), derived from the catalog so the copy
 * can't drift when templates are added or removed. */
export const TEMPLATE_COUNT_WORDS = capitalizedNumberWords(TEMPLATES.length);

export const SITE_NAME = "Free Resume Builder";

/** Synonyms for the same product — used in JSON-LD `alternateName`, not as extra URLs. */
export const ALTERNATE_NAMES = [
  "Resume Maker",
  "Resume Creator",
  "Free Resume Maker",
  "Free Resume Creator",
  "CV Builder",
  "CV Maker",
  "CV Creator",
  "Curriculum Vitae Builder",
  "Curriculum Vitae Maker",
  "Curriculum Vitae Creator",
  "Free Curriculum Vitae",
  "Private Resume Builder",
  "Private Resume Creator",
  "AI Resume Builder",
  "Free AI Resume Maker",
  "AI Resume Maker",
] as const;

export const HOME_TITLE = "Free AI Resume Maker — Unlimited, No Account";
/** Shown under the link in search results and browser/social previews. */
export const HOME_DESCRIPTION =
  "The best free, unlimited AI-powered resume builder. Make a resume or CV for any field — no account, no limits. Pick a template and download a PDF.";

export const SITE_KEYWORDS = [
  "free resume builder",
  "unlimited resume maker",
  "best AI-powered resume builder",
  "AI resume maker",
  "free CV maker",
] as const;

export const FEATURES = [
  {
    title: "Drop a resume to start",
    body: "PDF, Word, or text. Headings like Work History, Technical Skills, or Academic Background fill the matching sections — then you edit in the same builder.",
  },
  {
    title: "You choose the sections",
    body: "Experience, internships, projects, education, skills, certifications, patents, languages, hobbies, soft skills, plus a custom additional section — they're all in the flow. Turn off anything that doesn't belong. A skipped section never leaves an empty heading on the page.",
  },
  {
    title: "Suggestions for any field",
    body: "Roles, skills, degrees, certifications, and more are not software-only. The lists include pharmacy, architecture, construction, IT, networking, data, and databases — or type anything that isn’t there.",
  },
  {
    title: `${TEMPLATE_COUNT_WORDS} templates, one live preview`,
    body: "Switch designs anytime and watch the page update instantly. What you see is the same view you'll download. The gallery lists every resume template and curriculum vitae layout.",
    href: "/templates" as const,
    linkLabel: "Browse templates",
  },
  {
    title: "PDF from the live preview",
    body: "The preview you see is the PDF itself, so the download has exactly the layout, headings, and section order you already checked.",
  },
  {
    title: "Private by default",
    body: "Work stays in your browser. Clicking Save & Next or Skip writes a draft to this device’s local storage — nothing is uploaded as a hosted resume. Ads, importing a resume, and the optional AI rewrite are the only times anything leaves your device — the private resume builder page has the details.",
    href: "/private" as const,
    linkLabel: "How private this is",
  },
] as const;

export const FEATURE_LIST = [
  "Free and unlimited — no account, no download cap",
  "Drop an existing resume to fill matching sections",
  "Optional AI rewrite for your summary, experience bullets, and project descriptions",
  "Choose only the resume sections you need",
  "Suggestions for roles and skills across software, data, IT, pharmacy, architecture, and construction",
  `${TEMPLATE_COUNT_WORDS} resume templates with a live preview`,
  "Download a PDF of the same preview",
  "No account — drafts stay in this browser’s local storage, not on a resume hosting account",
] as const;

export interface FaqItem {
  question: string;
  answer: string;
}

export const HOME_FAQS: FaqItem[] = [
  {
    question: "Can I start from my existing resume?",
    answer:
      "Yes. Choose Import my resume (or Import in the builder) and pick a PDF, Word (.docx), or text file. Each section fills in automatically, even when your headings use different words like Work History, Career Objective, or Core Competencies. Check each section, then pick a template and download.",
  },
  {
    question: "Is this resume builder free?",
    answer:
      "Yes. This is a free resume builder, resume maker, and resume creator. You can make a resume or a free curriculum vitae without paying, and you never have to create an account.",
  },
  {
    question: "How do I make a resume here?",
    answer:
      "Open the builder, drop a resume or add your name and contact details (including a country code on the phone), fill only the sections that belong on this resume, skip the rest, pick a template, and download a PDF. A short walkthrough lives on the how-to page if you want the steps spelled out.",
  },
  {
    question: "Can I make a resume for fields besides software?",
    answer:
      "Yes. Role, skill, degree, and certification suggestions include pharmacy, architecture, construction, IT, networking, data, and databases — or type anything that isn’t in the list. The same editor works for any field.",
  },
  {
    question: "Is it safe? Do you store my resume?",
    answer:
      "Your draft lives in your browser. Clicking Save & Next or Skip saves it to this device’s local storage, and there’s no account or hosted copy. Three things do touch the internet: Google AdSense ads, importing a resume (the text is sent so sections can be filled in), and the optional “Make ATS-friendly” button (the text you’re rewriting is sent to an AI service). The private page explains each one.",
  },
  {
    question: "Do I need an account or email?",
    answer:
      "No. There is no sign-up, no registration, and no email gate. You can use this resume creator without an account.",
  },
  {
    question: "Can I download a resume as PDF?",
    answer:
      "Yes. The PDF is generated right in your browser and saved as a file. The preview you look at while editing is that same PDF, so what you download matches what you reviewed.",
  },
  {
    question: "Can I make a CV or a free curriculum vitae?",
    answer:
      "Yes. Resume and curriculum vitae use the same editor. If you call it a CV, pick a template and download a PDF the same way — including a free curriculum vitae with no account.",
  },
  {
    question: "Are the templates ATS-friendly?",
    answer:
      "Templates use real headings and skip empty sections, which keeps the file readable. Your summary, experience entries, and projects also have an optional “Make ATS-friendly” rewrite. The ATS page covers what that does and what it does not claim.",
  },
];

export interface HowToStep {
  name: string;
  text: string;
}

export const HOW_TO_STEPS: HowToStep[] = [
  {
    name: "Add your name and contact details — or drop a resume",
    text: "Start with name, email, location, and an optional phone number with a country code. Links are optional. Or drop a PDF, Word, or text resume and we'll fill every section we can read, including synonym headings like Work History. Required fields have to be valid before you can continue.",
  },
  {
    name: "Write a short summary — or skip it",
    text: "A few sentences on what you do is enough. If you don’t want a summary section, skip it so it never prints an empty heading.",
  },
  {
    name: "Skip the photo if it doesn’t belong",
    text: "A headshot is optional. Many US resumes omit it. If a template has a photo slot and you skip this step, the layout simply has no picture.",
  },
  {
    name: "Fill only the sections that apply",
    text: "Work through experience, internships, projects, education, skills, and the rest. Pick from suggestions — software, data, IT, pharmacy, architecture, construction — or type your own. Skip anything that isn’t on this resume.",
  },
  {
    name: "Optionally tighten your wording",
    text: "Your summary, experience entries, and projects each have a “Make ATS-friendly” button that rewrites what you wrote into plain, action-led lines. It only runs if you click it — and it’s worth reading the result before you keep it.",
  },
  {
    name: "Pick a template and download a PDF",
    text: "Switch designs in the live preview until one fits, then download a PDF of that same view. The file is the preview you already checked.",
  },
];

export const FOOTER_LINKS: { href: IndexablePath; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/how-to-make-a-resume", label: "How to make a resume" },
  { href: "/guides", label: "Resume guides" },
  { href: "/templates", label: "Templates" },
  { href: "/private", label: "Private & safe" },
  { href: "/ats", label: "ATS" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export const FOOTER_TAGLINE =
  "A free resume and CV builder for any field — software, data, IT, pharmacy, architecture, construction, and more. Skip the sections you don’t need, pick a template, and download a PDF.";

export const FOOTER_NOTE = "Free · Unlimited · AI-powered · No account";

export const PAGE_META: Record<
  Exclude<IndexablePath, "/">,
  { title: string; description: string }
> = {
  "/how-to-make-a-resume": {
    title: "How to Make a Resume Free (No Account)",
    description:
      "How to make a resume with the best free, unlimited AI-powered builder: add your details, skip unused sections, pick a template, and download a PDF. No account.",
  },
  "/guides": {
    title: "Resume Writing Guides",
    description:
      "In-depth resume guides: summaries, bullet points, skills, education, ATS, formats, cover letters, and career gaps — with examples you can adapt.",
  },
  "/private": {
    title: "Safe, Private Resume Builder",
    description:
      "A private, free, unlimited resume builder with no account. Drafts stay in your browser. Honest notes on ads, resume import, and the optional AI-powered ATS rewrite.",
  },
  "/templates": {
    title: "Free Resume Templates",
    description:
      `${TEMPLATE_COUNT_WORDS} free, unlimited resume templates. Preview the best AI-powered layouts, switch designs live, and download a PDF — no account.`,
  },
  "/ats": {
    title: "ATS-Friendly Resume Builder",
    description:
      "Make an ATS-friendly resume with real headings and an optional AI-powered bullet rewrite. Free, unlimited resume creator — no account.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description:
      "How Free Resume Builder handles your data: drafts in browser storage, no account, Google AdSense cookies, and what the optional import and AI rewrite send.",
  },
  "/about": {
    title: "About",
    description:
      "Who runs Free Resume Builder, why it is free with no account, how it is paid for, and what it does and doesn’t try to do.",
  },
  "/contact": {
    title: "Contact",
    description:
      "Get in touch about Free Resume Builder — bug reports, template problems, privacy questions, or corrections to a guide. Email address and what to include.",
  },
  "/terms": {
    title: "Terms and Conditions",
    description:
      "The terms for using Free Resume Builder: acceptable use, your content, the optional AI features, advertising, liability, and governing law.",
  },
  "/disclaimer": {
    title: "Disclaimer",
    description:
      "Limits of Free Resume Builder and its guides: general career information, no guarantee of interviews or ATS results, AI output, ads, and external links.",
  },
};

export function pageMetadata(path: IndexablePath): Metadata {
  const title = path === "/" ? HOME_TITLE : PAGE_META[path].title;
  const description = path === "/" ? HOME_DESCRIPTION : PAGE_META[path].description;
  const url = absoluteUrl(path);
  const branded = path === "/" ? title : `${title} — ${SITE_NAME}`;
  // Prefer `/og.png` (published by scripts/build.mjs). Extensionless
  // `/opengraph-image` is rejected by WhatsApp and similar scrapers.
  const image = {
    url: "/og.png",
    width: 1200,
    height: 630,
    alt: HOME_TITLE,
  };

  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: path },
    openGraph: {
      title: branded,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: branded,
      description,
      images: ["/og.png"],
    },
  };
}

export function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    alternateName: [...ALTERNATE_NAMES],
    url: SITE_URL,
    image: absoluteUrl("/og.png"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    description: HOME_DESCRIPTION,
    featureList: [...FEATURE_LIST],
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: [...ALTERNATE_NAMES],
    url: SITE_URL,
    description: HOME_DESCRIPTION,
  };
}

export function faqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function howToJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to make a resume",
    description: PAGE_META["/how-to-make-a-resume"].description,
    totalTime: "PT10M",
    tool: [{ "@type": "HowToTool", name: SITE_NAME }],
    step: HOW_TO_STEPS.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
      url: `${absoluteUrl("/how-to-make-a-resume")}#step-${i + 1}`,
    })),
  };
}

/** Per-article metadata for /guides/[slug]. Same shape as `pageMetadata`,
 * but typed as an article with its publish and update dates. */
export function guideMetadata(guide: Guide): Metadata {
  const path = `/guides/${guide.slug}`;
  const url = absoluteUrl(path);
  const branded = `${guide.title} — ${SITE_NAME}`;

  return {
    title: guide.title,
    description: guide.description,
    robots: { index: true, follow: true },
    alternates: { canonical: path },
    openGraph: {
      title: branded,
      description: guide.description,
      url,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: guide.published,
      modifiedTime: guide.updated,
      section: guide.category,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: HOME_TITLE }],
    },
    twitter: {
      card: "summary_large_image",
      title: branded,
      description: guide.description,
      images: ["/og.png"],
    },
  };
}

export function articleJsonLd(guide: Guide) {
  const url = absoluteUrl(`/guides/${guide.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.published,
    dateModified: guide.updated,
    articleSection: guide.category,
    image: absoluteUrl("/og.png"),
    mainEntityOfPage: url,
    url,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

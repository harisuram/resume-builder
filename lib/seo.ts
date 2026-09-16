import type { Metadata } from "next";
import { SITE_URL, absoluteUrl, type IndexablePath } from "./site";

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
    title: "You choose the sections",
    body: "Experience, internships, projects, education, skills, certifications, patents, languages, hobbies, soft skills, plus a custom additional section — they're all in the flow. Turn off anything that doesn't belong. A skipped section never leaves an empty heading on the page.",
  },
  {
    title: "Suggestions for any field",
    body: "Roles, skills, degrees, certifications, and more are not software-only. The lists include pharmacy, architecture, construction, IT, networking, data, and databases — or type anything that isn’t there.",
  },
  {
    title: "Twenty-one templates, one live preview",
    body: "Switch designs anytime and watch the page update instantly. What you see is the same view you'll download. The gallery lists every resume template and curriculum vitae layout.",
    href: "/templates" as const,
    linkLabel: "Browse templates",
  },
  {
    title: "PDF from the live preview",
    body: "Print a PDF of the template you picked. The download is the same view you already reviewed — same layout, headings, and section order.",
  },
  {
    title: "Private by default",
    body: "Work stays in your browser. Nothing is saved on this device until you choose to save. Ads (if enabled) and the optional ATS rewrite are the only network exceptions — details on the private resume builder page.",
    href: "/private" as const,
    linkLabel: "How private this is",
  },
] as const;

export const FEATURE_LIST = [
  "Free and unlimited — no account, no download cap",
  "Optional AI-powered ATS rewrite for experience bullets",
  "Choose only the resume sections you need",
  "Suggestions for roles and skills across software, data, IT, pharmacy, architecture, and construction",
  "Twenty-one resume templates with a live preview",
  "Download a PDF of the same preview",
  "No account — data stays in your browser until you save or opt in",
] as const;

export interface FaqItem {
  question: string;
  answer: string;
}

export const HOME_FAQS: FaqItem[] = [
  {
    question: "Is this resume builder free?",
    answer:
      "Yes. This is a free resume builder, resume maker, and resume creator. You can make a resume or a free curriculum vitae without paying, and you never have to create an account.",
  },
  {
    question: "How do I make a resume here?",
    answer:
      "Open the builder, add your name and contact details (including a country code on the phone), fill only the sections that belong on this resume, skip the rest, pick a template, and download a PDF. A short walkthrough lives on the how-to page if you want the steps spelled out.",
  },
  {
    question: "Can I make a resume for fields besides software?",
    answer:
      "Yes. Role, skill, degree, and certification suggestions include pharmacy, architecture, construction, IT, networking, data, and databases — or type anything that isn’t in the list. The same editor works for any field.",
  },
  {
    question: "Is it safe? Do you store my resume?",
    answer:
      "Drafts live in your browser. Nothing is written to this device until you explicitly save, and there is no resume hosting account. If ads are on, Google AdSense loads. If you click “Make ATS-friendly,” those experience bullets are sent to a rewrite API. The private page explains both exceptions.",
  },
  {
    question: "Do I need an account or email?",
    answer:
      "No. There is no sign-up, no registration, and no email gate. You can use this resume creator without an account.",
  },
  {
    question: "Can I download a resume as PDF?",
    answer:
      "Yes. Download uses the browser’s print-to-PDF flow against the live preview, so the file matches the template you already reviewed.",
  },
  {
    question: "Can I make a CV or a free curriculum vitae?",
    answer:
      "Yes. Resume and curriculum vitae use the same editor. If you call it a CV, pick a template and download a PDF the same way — including a free curriculum vitae with no account.",
  },
  {
    question: "Are the templates ATS-friendly?",
    answer:
      "Templates use real headings and skip empty sections, which keeps the file readable. Experience entries also have an optional “Make ATS-friendly” rewrite. The ATS page covers what that does and what it does not claim.",
  },
];

export interface HowToStep {
  name: string;
  text: string;
}

export const HOW_TO_STEPS: HowToStep[] = [
  {
    name: "Add your name and contact details",
    text: "Start with name, email, location, and an optional phone number with a country code. Links are optional. Required fields have to be valid before you can continue.",
  },
  {
    name: "Skip the photo if it doesn’t belong",
    text: "A headshot is optional. Many US resumes omit it. If a template has a photo slot and you skip this step, the layout simply has no picture.",
  },
  {
    name: "Write a short summary — or skip it",
    text: "A few sentences on what you do is enough. If you don’t want a summary section, skip it so it never prints an empty heading.",
  },
  {
    name: "Fill only the sections that apply",
    text: "Work through experience, internships, projects, education, skills, and the rest. Pick from suggestions — software, data, IT, pharmacy, architecture, construction — or type your own. Skip anything that isn’t on this resume.",
  },
  {
    name: "Optionally make experience bullets ATS-friendly",
    text: "On an experience entry you can rewrite bullets into plain, action-led lines. That step is optional and only runs if you click it.",
  },
  {
    name: "Pick a template and download a PDF",
    text: "Switch designs in the live preview until one fits, then download a PDF of that same view. The file is the preview you already checked.",
  },
];

export const FOOTER_LINKS: { href: IndexablePath; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/how-to-make-a-resume", label: "How to make a resume" },
  { href: "/templates", label: "Templates" },
  { href: "/private", label: "Private & safe" },
  { href: "/ats", label: "ATS" },
  { href: "/privacy", label: "Privacy" },
  { href: "/about", label: "About" },
];

export const FOOTER_TAGLINE =
  "The best free, unlimited AI-powered resume builder for any field — software, data, IT, pharmacy, architecture, construction, and more. Skip unused sections, pick a template, download a PDF.";

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
  "/private": {
    title: "Safe, Private Resume Builder",
    description:
      "A private, free, unlimited resume builder with no account. Drafts stay in your browser. Honest notes on ads and the optional AI-powered ATS rewrite.",
  },
  "/templates": {
    title: "Free Resume Templates",
    description:
      "Twenty-one free, unlimited resume templates. Preview the best AI-powered layouts, switch designs live, and download a PDF — no account.",
  },
  "/ats": {
    title: "ATS-Friendly Resume Builder",
    description:
      "Make an ATS-friendly resume with real headings and an optional AI-powered bullet rewrite. Free, unlimited resume creator — no account.",
  },
  "/privacy": {
    title: "Privacy",
    description:
      "How this free, unlimited AI-powered resume builder handles data: browser storage, no account, optional ads, and the optional ATS rewrite.",
  },
  "/about": {
    title: "About",
    description:
      "The best free, unlimited AI-powered resume maker for any field. Skip unused sections, pick a template, download a PDF. No account.",
  },
};

export function pageMetadata(path: IndexablePath): Metadata {
  const title = path === "/" ? HOME_TITLE : PAGE_META[path].title;
  const description = path === "/" ? HOME_DESCRIPTION : PAGE_META[path].description;
  const url = absoluteUrl(path);
  const branded = path === "/" ? title : `${title} — ${SITE_NAME}`;
  // Child routes that set `openGraph` replace the parent object (they do not
  // inherit the file-based opengraph-image). Homepage keeps the file convention.
  const image = {
    url: "/opengraph-image",
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
      ...(path === "/" ? {} : { images: [image] }),
    },
    twitter: {
      card: "summary_large_image",
      title: branded,
      description,
      ...(path === "/" ? {} : { images: ["/opengraph-image"] }),
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
    image: absoluteUrl("/opengraph-image"),
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

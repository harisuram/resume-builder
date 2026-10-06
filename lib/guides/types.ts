import type { FaqItem } from "@/lib/seo";

/** One piece of an article body. Plain strings only — no HTML — so the copy
 * can't break the page and stays easy to edit. */
export type GuideBlock =
  /** A paragraph. */
  | { type: "p"; text: string }
  /** A bulleted list. */
  | { type: "ul"; items: string[] }
  /** A numbered list. */
  | { type: "ol"; items: string[] }
  /** A weak line next to a rewritten one, with an optional note on why. */
  | { type: "compare"; weak: string; strong: string; note?: string }
  /** A sample block of resume text, shown as lines on a card. */
  | { type: "sample"; title: string; lines: string[] }
  /** A short highlighted tip. */
  | { type: "tip"; text: string };

export interface GuideSection {
  heading: string;
  blocks: GuideBlock[];
}

export type GuideCategory = "Writing" | "Sections" | "Formatting" | "Job search" | "Examples";

export interface Guide {
  /** URL segment under /guides/. Lowercase words joined by hyphens. */
  slug: string;
  /** H1 and <title>. */
  title: string;
  /** Meta description, also used as the card blurb on /guides. 120–160 chars. */
  description: string;
  category: GuideCategory;
  /** ISO dates (YYYY-MM-DD). */
  published: string;
  updated: string;
  /** Opening paragraph shown under the title. */
  intro: string;
  sections: GuideSection[];
  faqs?: FaqItem[];
  /** Slugs of other guides to link at the end. */
  related: string[];
}

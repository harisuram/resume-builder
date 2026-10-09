import type { FaqItem } from "@/lib/seo";

function Chevron() {
  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3 w-3 shrink-0 text-[var(--color-ink-faint)] transition-transform duration-150 group-open:rotate-180"
      aria-hidden="true"
    >
      <path
        d="M2.2 4.2 6 8l3.8-3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Native <details> rather than client state: every answer ships in the
 * server-rendered HTML, so crawlers read it without running the page. The
 * shared `name` makes opening one question close the others. */
export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="mt-6 divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
      {items.map((faq) => (
        <details key={faq.question} name="faq" className="group">
          <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left transition duration-150 hover:bg-[var(--color-accent-tint)]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)] [&::-webkit-details-marker]:hidden">
            <h3 className="m-0 font-display text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
              {faq.question}
            </h3>
            <Chevron />
          </summary>
          <p className="px-6 pb-5 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

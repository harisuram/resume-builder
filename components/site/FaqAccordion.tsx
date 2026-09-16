"use client";

import { useId, useState } from "react";
import type { FaqItem } from "@/lib/seo";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 text-[var(--color-ink-faint)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
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

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <dl className="mt-6 divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
      {items.map((faq, index) => {
        const open = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        return (
          <div key={faq.question}>
            <dt>
              <h3 className="m-0">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition duration-150 hover:bg-[var(--color-accent-tint)]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
                >
                  <span className="font-display text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
                    {faq.question}
                  </span>
                  <Chevron open={open} />
                </button>
              </h3>
            </dt>
            <dd id={panelId} hidden={!open}>
              <p className="px-6 pb-5 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">{faq.answer}</p>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

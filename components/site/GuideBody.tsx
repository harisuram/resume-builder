import type { GuideBlock, GuideSection } from "@/lib/guides";

const bodyText = "text-[14.5px] leading-relaxed text-[var(--color-ink-soft)]";

/** Stable in-page anchor for a section heading ("Hard vs soft skills" → "hard-vs-soft-skills"). */
export function sectionId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "p":
      return <p className={`mt-3 ${bodyText}`}>{block.text}</p>;
    case "ul":
      return (
        <ul className={`mt-3 list-disc space-y-1.5 pl-5 ${bodyText}`}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className={`mt-3 list-decimal space-y-1.5 pl-5 ${bodyText}`}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    case "compare":
      return (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <p className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">Weak</p>
            <p className={`mt-1 ${bodyText}`}>{block.weak}</p>
          </div>
          <div className="bg-[var(--color-accent-tint)]/50 px-5 py-4">
            <p className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-[var(--color-accent)]">Stronger</p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-[var(--color-ink)]">{block.strong}</p>
            {block.note ? <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{block.note}</p> : null}
          </div>
        </div>
      );
    case "sample":
      return (
        <figure className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-card">
          <figcaption className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-[var(--color-accent)]">
            {block.title}
          </figcaption>
          <div className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-[var(--color-ink)]">
            {block.lines.map((line, i) => (
              <p key={i} className="break-words">
                {line}
              </p>
            ))}
          </div>
        </figure>
      );
    case "tip":
      return (
        <aside className="mt-4 rounded-2xl border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-tint)]/60 px-5 py-4">
          <p className="text-[14px] leading-relaxed text-[var(--color-ink)]">
            <span className="font-semibold">Tip: </span>
            {block.text}
          </p>
        </aside>
      );
  }
}

export function GuideBody({ sections }: { sections: readonly GuideSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading} id={sectionId(section.heading)} className="scroll-mt-24">
          <h2 className="mt-10 font-display text-[20px] font-semibold tracking-tight text-[var(--color-ink)]">
            {section.heading}
          </h2>
          {section.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </section>
      ))}
    </>
  );
}

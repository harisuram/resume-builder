export function SectionFormHeader({ title, help }: { title: string; help?: string }) {
  return (
    <div>
      <h2 className="font-display text-[20px] font-semibold tracking-tight text-[var(--color-ink)]">{title}</h2>
      {help && <p className="mt-1 text-[13px] text-[var(--color-ink-soft)]">{help}</p>}
    </div>
  );
}

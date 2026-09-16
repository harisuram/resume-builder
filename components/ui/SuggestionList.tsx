"use client";

/** Scrollable listbox of catalog matches. Parent owns highlight + open state. */
export function SuggestionList({
  id,
  items,
  highlight,
  onHighlight,
  onSelect,
  label,
}: {
  id?: string;
  items: string[];
  highlight: number | null;
  onHighlight: (index: number) => void;
  onSelect: (value: string) => void;
  label: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul
      id={id}
      role="listbox"
      aria-label={label}
      className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
    >
      {items.map((item, index) => {
        const isHighlighted = index === highlight;
        return (
          <li
            key={item}
            role="option"
            aria-selected={isHighlighted}
            className={`cursor-pointer px-3 py-1.5 text-[13px] ${
              isHighlighted ? "bg-[var(--color-accent-tint)] text-[var(--color-accent)]" : "text-[var(--color-ink)]"
            }`}
            onMouseEnter={() => onHighlight(index)}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(item);
            }}
          >
            {item}
          </li>
        );
      })}
    </ul>
  );
}

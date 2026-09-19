"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { DeleteIconButton } from "@/components/ui/DeleteIconButton";

/** Tracks which just-appended entry should steal focus. Starts null so
 * opening a section that already has items doesn't jump into the last card. */
export function useFocusNewIndex() {
  const [index, setIndex] = useState<number | null>(null);
  return {
    focusIndex: index,
    /** Call with the current list length *before* appending — that's the
     * new item's index. */
    focusNew: (length: number) => setIndex(length),
  };
}

const FOCUSABLE =
  "input:not([type=hidden]):not([type=button]):not([type=submit]), textarea, select";

export function ItemCard({
  onRemove,
  autoFocus = false,
  children,
}: {
  onRemove: () => void;
  /** When true (the card that was just added), the first field is focused
   * so the user can type without an extra click. */
  autoFocus?: boolean;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!autoFocus) return;
    rootRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [autoFocus]);

  return (
    <div
      ref={rootRef}
      className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 pt-11 shadow-card transition-colors duration-150 ease-out hover:border-[var(--color-accent)]/30 md:pt-4"
    >
      <DeleteIconButton
        icon="entry"
        onClick={onRemove}
        aria-label="Remove"
        className="absolute right-2 top-2 h-9 w-9 md:right-3 md:top-3 md:h-8 md:w-8"
      />
      {/* Extra top padding on phones keeps fields clear of the delete icon;
          from md the icon sits in the corner and pr reserves horizontal room. */}
      <div className="grid gap-3 md:pr-12">{children}</div>
    </div>
  );
}

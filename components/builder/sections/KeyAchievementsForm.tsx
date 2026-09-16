"use client";

import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import { useFocusNewIndex } from "./ItemCard";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

export function KeyAchievementsForm() {
  const items = useBuilderStore((s) => s.sections.keyAchievements) ?? [];
  const status = useBuilderStore((s) => s.sectionStatus.keyAchievements) ?? "not_started";
  const setKeyAchievements = useBuilderStore((s) => s.setKeyAchievements);
  const skipped = status === "skipped";
  const { focusIndex, focusNew } = useFocusNewIndex();

  function updateAt(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    setKeyAchievements(next);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader
        title="Key achievements"
        help="Standout, quantifiable wins — the highlights you want noticed first, right under your summary."
      />
      {skipped ? (
        <SkippedNotice label="Key achievements" />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <TextInput
                  value={item}
                  onChange={(e) => updateAt(i, e.target.value)}
                  placeholder="Grew the customer base by 40% in under a year"
                  autoFocus={i === focusIndex}
                />
                <button
                  type="button"
                  onClick={() => setKeyAchievements(items.filter((_, idx) => idx !== i))}
                  aria-label="Remove achievement"
                  className="shrink-0 text-[12px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-accent)]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => {
              focusNew(items.length);
              setKeyAchievements([...items, ""]);
            }}
          >
            + Add achievement
          </Button>
        </div>
      )}
    </div>
  );
}

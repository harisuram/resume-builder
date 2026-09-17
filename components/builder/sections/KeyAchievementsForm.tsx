"use client";

import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import { useTouchedFields } from "@/lib/useTouchedFields";
import { MAX_BULLET_LENGTH, validateAchievement } from "@/lib/validation";
import { useFocusNewIndex } from "./ItemCard";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

export function KeyAchievementsForm() {
  const items = useBuilderStore((s) => s.sections.keyAchievements) ?? [];
  const status = useBuilderStore((s) => s.sectionStatus.keyAchievements) ?? "not_started";
  const setKeyAchievements = useBuilderStore((s) => s.setKeyAchievements);
  const skipped = status === "skipped";
  const { focusIndex, focusNew } = useFocusNewIndex();
  const { touch, errorFor } = useTouchedFields();

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
        <SkippedNotice label="Key achievements" sectionKey="keyAchievements" />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {items.map((item, i) => {
              const error = errorFor(`${i}`, validateAchievement(item).message);
              return (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <TextInput
                    value={item}
                    onChange={(e) => updateAt(i, e.target.value)}
                    onBlur={touch(`${i}`)}
                    placeholder="Grew the customer base by 40% in under a year"
                    autoFocus={i === focusIndex}
                    maxLength={MAX_BULLET_LENGTH}
                    invalid={Boolean(error)}
                    aria-label={`Achievement ${i + 1}`}
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
                {error ? (
                  <p role="alert" className="mt-1 text-[11.5px] text-red-600">
                    {error}
                  </p>
                ) : null}
              </div>
              );
            })}
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

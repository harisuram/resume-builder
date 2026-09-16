"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import type { AdditionalItem } from "@/lib/types";
import { ItemCard, useFocusNewIndex } from "./ItemCard";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

const EMPTY: AdditionalItem = { title: "", bullets: [""] };

export function AdditionalForm() {
  const additional = useBuilderStore((s) => s.sections.additional);
  const status = useBuilderStore((s) => s.sectionStatus.additional) ?? "not_started";
  const setAdditionalHeading = useBuilderStore((s) => s.setAdditionalHeading);
  const addAdditionalItem = useBuilderStore((s) => s.addAdditionalItem);
  const updateAdditionalItem = useBuilderStore((s) => s.updateAdditionalItem);
  const removeAdditionalItem = useBuilderStore((s) => s.removeAdditionalItem);
  const items = additional?.items ?? [];
  const heading = additional?.heading ?? "";
  const skipped = status === "skipped";
  const { focusIndex, focusNew } = useFocusNewIndex();

  function setBullets(index: number, bullets: string[]) {
    updateAdditionalItem(index, { bullets });
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader
        title="Additional"
        help="Anything else — publications, volunteer work, awards. Name the heading yourself."
      />
      {skipped ? (
        <SkippedNotice label={heading.trim() || "Additional"} />
      ) : (
        <>
          <FieldGroup
            label="Section title"
            hint="Shown as the heading on the resume. Leave blank to use “Additional”."
          >
            <TextInput
              value={heading}
              onChange={(e) => setAdditionalHeading(e.target.value)}
              placeholder="Additional"
              aria-label="Section title"
            />
          </FieldGroup>

          <div className="flex flex-col gap-3">
            {items.map((item, i) => (
              <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeAdditionalItem(i)}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldGroup label="Title">
                    <TextInput
                      value={item.title}
                      onChange={(e) => updateAdditionalItem(i, { title: e.target.value })}
                      placeholder="Volunteer coordinator"
                    />
                  </FieldGroup>
                  <FieldGroup label="Subtitle (optional)">
                    <TextInput
                      value={item.subtitle ?? ""}
                      onChange={(e) => updateAdditionalItem(i, { subtitle: e.target.value })}
                      placeholder="Red Cross"
                    />
                  </FieldGroup>
                  <FieldGroup label="Date or range (optional)">
                    <TextInput
                      value={item.date ?? ""}
                      onChange={(e) => updateAdditionalItem(i, { date: e.target.value })}
                      placeholder="2019 — 2021"
                    />
                  </FieldGroup>
                </div>
                <div className="border-t border-[var(--color-border)] pt-3">
                  <p className="mb-2 text-[12px] font-medium tracking-wide text-[var(--color-ink-soft)]">
                    Details (one line per bullet)
                  </p>
                  <div className="flex flex-col gap-2">
                    {item.bullets.map((bullet, bi) => (
                      <div key={bi} className="flex items-center gap-2">
                        <TextInput
                          value={bullet}
                          onChange={(e) => {
                            const next = [...item.bullets];
                            next[bi] = e.target.value;
                            setBullets(i, next);
                          }}
                          placeholder="Organized a quarterly blood drive"
                        />
                        <button
                          type="button"
                          onClick={() => setBullets(i, item.bullets.filter((_, idx) => idx !== bi))}
                          aria-label="Remove bullet"
                          className="shrink-0 text-[12px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-accent)]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBullets(i, [...item.bullets, ""])}
                    className="mt-2 text-[12px] font-medium text-[var(--color-accent)] transition-opacity hover:opacity-80"
                  >
                    + Add bullet
                  </button>
                </div>
              </ItemCard>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => {
              focusNew(items.length);
              addAdditionalItem(EMPTY);
            }}
          >
            + Add entry
          </Button>
        </>
      )}
    </div>
  );
}

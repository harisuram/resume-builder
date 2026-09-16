"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import type { AdditionalItem } from "@/lib/types";
import { useTouchedFields } from "@/lib/useTouchedFields";
import {
  getAdditionalHeadingError,
  getAdditionalItemErrors,
  MAX_BULLET_LENGTH,
  MAX_FIELD_LENGTH,
} from "@/lib/validation";
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
  const { touch, errorFor } = useTouchedFields();

  function setBullets(index: number, bullets: string[]) {
    updateAdditionalItem(index, { bullets });
  }

  const headingError = errorFor("heading", getAdditionalHeadingError(heading));

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
            htmlFor="additional-heading"
            hint="Shown as the heading on the resume. Leave blank to use “Additional”."
            error={headingError}
          >
            <TextInput
              id="additional-heading"
              value={heading}
              onChange={(e) => setAdditionalHeading(e.target.value)}
              onBlur={touch("heading")}
              placeholder="Additional"
              aria-label="Section title"
              maxLength={MAX_FIELD_LENGTH}
              invalid={Boolean(headingError)}
            />
          </FieldGroup>

          <div className="flex flex-col gap-3">
            {items.map((item, i) => {
              const errors = getAdditionalItemErrors(item);
              const titleError = errorFor(`${i}.title`, errors.title);
              const subtitleError = errorFor(`${i}.subtitle`, errors.subtitle);
              const dateError = errorFor(`${i}.date`, errors.date);
              return (
              <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeAdditionalItem(i)}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldGroup label="Title" htmlFor={`additional-${i}-title`} required error={titleError}>
                    <TextInput
                      id={`additional-${i}-title`}
                      value={item.title}
                      onChange={(e) => updateAdditionalItem(i, { title: e.target.value })}
                      onBlur={touch(`${i}.title`)}
                      placeholder="Volunteer coordinator"
                      maxLength={MAX_FIELD_LENGTH}
                      invalid={Boolean(titleError)}
                    />
                  </FieldGroup>
                  <FieldGroup label="Subtitle (optional)" htmlFor={`additional-${i}-subtitle`} error={subtitleError}>
                    <TextInput
                      id={`additional-${i}-subtitle`}
                      value={item.subtitle ?? ""}
                      onChange={(e) => updateAdditionalItem(i, { subtitle: e.target.value })}
                      onBlur={touch(`${i}.subtitle`)}
                      placeholder="Red Cross"
                      maxLength={MAX_FIELD_LENGTH}
                      invalid={Boolean(subtitleError)}
                    />
                  </FieldGroup>
                  <FieldGroup label="Date or range (optional)" htmlFor={`additional-${i}-date`} error={dateError}>
                    <TextInput
                      id={`additional-${i}-date`}
                      value={item.date ?? ""}
                      onChange={(e) => updateAdditionalItem(i, { date: e.target.value })}
                      onBlur={touch(`${i}.date`)}
                      placeholder="2019 — 2021"
                      maxLength={MAX_FIELD_LENGTH}
                      invalid={Boolean(dateError)}
                    />
                  </FieldGroup>
                </div>
                <div className="border-t border-[var(--color-border)] pt-3">
                  <p className="mb-2 text-[12px] font-medium tracking-wide text-[var(--color-ink-soft)]">
                    Details (one line per bullet)
                  </p>
                  <div className="flex flex-col gap-2">
                    {item.bullets.map((bullet, bi) => {
                      const bulletError = errorFor(`${i}.bullet.${bi}`, errors.bullets[bi]);
                      return (
                      <div key={bi}>
                        <div className="flex items-center gap-2">
                          <TextInput
                            value={bullet}
                            onChange={(e) => {
                              const next = [...item.bullets];
                              next[bi] = e.target.value;
                              setBullets(i, next);
                            }}
                            onBlur={touch(`${i}.bullet.${bi}`)}
                            placeholder="Organized a quarterly blood drive"
                            maxLength={MAX_BULLET_LENGTH}
                            invalid={Boolean(bulletError)}
                            aria-label={`Detail ${bi + 1}`}
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
                        {bulletError ? (
                          <p role="alert" className="mt-1 text-[11.5px] text-red-600">
                            {bulletError}
                          </p>
                        ) : null}
                      </div>
                      );
                    })}
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
              );
            })}
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

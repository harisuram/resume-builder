"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, Select, TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import { LANGUAGE_LEVELS, type Language, type LanguageLevel } from "@/lib/types";
import { ItemCard, useFocusNewIndex } from "./ItemCard";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

const EMPTY: Language = { name: "", level: "Fluent" };

export function LanguagesForm() {
  const items = useBuilderStore((s) => s.sections.languages) ?? [];
  const status = useBuilderStore((s) => s.sectionStatus.languages) ?? "not_started";
  const addListItem = useBuilderStore((s) => s.addListItem);
  const updateListItem = useBuilderStore((s) => s.updateListItem);
  const removeListItem = useBuilderStore((s) => s.removeListItem);
  const skipped = status === "skipped";
  const { focusIndex, focusNew } = useFocusNewIndex();

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Languages" help="Spoken languages, with proficiency." />
      {skipped ? (
        <SkippedNotice label="Languages" />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((lang, i) => (
              <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem("languages", i)}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldGroup label="Language">
                    <TextInput
                      value={lang.name}
                      onChange={(e) => updateListItem("languages", i, { name: e.target.value })}
                      placeholder="Spanish"
                    />
                  </FieldGroup>
                  <FieldGroup label="Proficiency" htmlFor={`language-level-${i}`}>
                    <Select
                      id={`language-level-${i}`}
                      value={lang.level}
                      onChange={(e) => updateListItem("languages", i, { level: e.target.value as LanguageLevel })}
                      aria-label="Proficiency"
                    >
                      {LANGUAGE_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </Select>
                  </FieldGroup>
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
              addListItem("languages", EMPTY);
            }}
          >
            + Add language
          </Button>
        </>
      )}
    </div>
  );
}

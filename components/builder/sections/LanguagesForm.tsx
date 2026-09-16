"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, Select } from "@/components/ui/Field";
import { SuggestInput } from "@/components/ui/SuggestInput";
import { LANGUAGE_CATALOG } from "@/lib/catalogs";
import { useBuilderStore } from "@/lib/store";
import { LANGUAGE_LEVELS, type Language, type LanguageLevel } from "@/lib/types";
import { useTouchedFields } from "@/lib/useTouchedFields";
import { getLanguageErrors, MAX_FIELD_LENGTH } from "@/lib/validation";
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
  const { touch, errorFor } = useTouchedFields();

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Languages" help="Spoken languages, with proficiency." />
      {skipped ? (
        <SkippedNotice label="Languages" />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((lang, i) => {
              const nameError = errorFor(`${i}.name`, getLanguageErrors(lang).name);
              return (
              <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem("languages", i)}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldGroup label="Language" htmlFor={`language-${i}-name`} required error={nameError}>
                    <SuggestInput
                      id={`language-${i}-name`}
                      value={lang.name}
                      onChange={(value) => updateListItem("languages", i, { name: value })}
                      onBlur={touch(`${i}.name`)}
                      placeholder="Spanish"
                      maxLength={MAX_FIELD_LENGTH}
                      invalid={Boolean(nameError)}
                      suggestions={LANGUAGE_CATALOG}
                      suggestionLabel="Suggested languages"
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
              );
            })}
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

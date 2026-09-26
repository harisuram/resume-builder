"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import type { Patent } from "@/lib/types";
import { useTouchedFields } from "@/lib/useTouchedFields";
import { getPatentErrors, MAX_FIELD_LENGTH } from "@/lib/validation";
import { ItemCard, useFocusNewIndex } from "./ItemCard";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

const EMPTY: Patent = { title: "" };

export function PatentsForm() {
  const items = useBuilderStore((s) => s.sections.patents) ?? [];
  const status = useBuilderStore((s) => s.sectionStatus.patents) ?? "not_started";
  const addListItem = useBuilderStore((s) => s.addListItem);
  const updateListItem = useBuilderStore((s) => s.updateListItem);
  const removeListItem = useBuilderStore((s) => s.removeListItem);
  const skipped = status === "skipped";
  const { focusIndex, focusNew } = useFocusNewIndex();
  const { touch, errorFor } = useTouchedFields();

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Patents" help="Patents granted or pending, with number and date." />
      {skipped ? (
        <SkippedNotice label="Patents" sectionKey="patents" />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((patent, i) => {
              const errors = getPatentErrors(patent);
              const titleError = errorFor(`${i}.title`, errors.title);
              const numberError = errorFor(`${i}.number`, errors.number);
              const officeError = errorFor(`${i}.office`, errors.office);
              const linkError = errorFor(`${i}.link`, errors.link);
              return (
              <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem("patents", i)}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldGroup label="Title" htmlFor={`patent-${i}-title`} required error={titleError}>
                    <TextInput
                      id={`patent-${i}-title`}
                      value={patent.title}
                      onChange={(e) => updateListItem("patents", i, { title: e.target.value })}
                      onBlur={touch(`${i}.title`)}
                      placeholder="Distributed cache coherency protocol"
                      maxLength={MAX_FIELD_LENGTH}
                      invalid={Boolean(titleError)}
                    />
                  </FieldGroup>
                  <FieldGroup label="Patent number (optional)" htmlFor={`patent-${i}-number`} error={numberError}>
                    <TextInput
                      id={`patent-${i}-number`}
                      value={patent.number ?? ""}
                      onChange={(e) => updateListItem("patents", i, { number: e.target.value })}
                      onBlur={touch(`${i}.number`)}
                      placeholder="US 99,012,345"
                      maxLength={MAX_FIELD_LENGTH}
                      invalid={Boolean(numberError)}
                    />
                  </FieldGroup>
                  <FieldGroup label="Office (optional)" htmlFor={`patent-${i}-office`} error={officeError}>
                    <TextInput
                      id={`patent-${i}-office`}
                      value={patent.office ?? ""}
                      onChange={(e) => updateListItem("patents", i, { office: e.target.value })}
                      onBlur={touch(`${i}.office`)}
                      placeholder="USPTO"
                      maxLength={MAX_FIELD_LENGTH}
                      invalid={Boolean(officeError)}
                    />
                  </FieldGroup>
                  <FieldGroup label="Date (optional)" htmlFor={`patent-${i}-date`}>
                    <TextInput
                      id={`patent-${i}-date`}
                      type="month"
                      value={patent.date ?? ""}
                      onChange={(e) => updateListItem("patents", i, { date: e.target.value || undefined })}
                    />
                  </FieldGroup>
                  <FieldGroup label="Link (optional)" htmlFor={`patent-${i}-link`} error={linkError}>
                    <TextInput
                      id={`patent-${i}-link`}
                      value={patent.link ?? ""}
                      onChange={(e) => updateListItem("patents", i, { link: e.target.value })}
                      onBlur={touch(`${i}.link`)}
                      placeholder="https://patents.google.com/..."
                      maxLength={MAX_FIELD_LENGTH}
                      invalid={Boolean(linkError)}
                    />
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
              addListItem("patents", EMPTY);
            }}
          >
            + Add patent
          </Button>
        </>
      )}
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import type { Patent } from "@/lib/types";
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

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Patents" help="Patents granted or pending, with number and date." />
      {skipped ? (
        <SkippedNotice label="Patents" />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((patent, i) => (
              <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem("patents", i)}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldGroup label="Title">
                    <TextInput
                      value={patent.title}
                      onChange={(e) => updateListItem("patents", i, { title: e.target.value })}
                      placeholder="Distributed cache coherency protocol"
                    />
                  </FieldGroup>
                  <FieldGroup label="Patent number (optional)">
                    <TextInput
                      value={patent.number ?? ""}
                      onChange={(e) => updateListItem("patents", i, { number: e.target.value })}
                      placeholder="US 11,234,567"
                    />
                  </FieldGroup>
                  <FieldGroup label="Office (optional)">
                    <TextInput
                      value={patent.office ?? ""}
                      onChange={(e) => updateListItem("patents", i, { office: e.target.value })}
                      placeholder="USPTO"
                    />
                  </FieldGroup>
                  <FieldGroup label="Date (optional)">
                    <TextInput
                      type="month"
                      value={patent.date ?? ""}
                      onChange={(e) => updateListItem("patents", i, { date: e.target.value || undefined })}
                    />
                  </FieldGroup>
                  <FieldGroup label="Link (optional)">
                    <TextInput
                      value={patent.link ?? ""}
                      onChange={(e) => updateListItem("patents", i, { link: e.target.value })}
                      placeholder="https://patents.google.com/..."
                    />
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

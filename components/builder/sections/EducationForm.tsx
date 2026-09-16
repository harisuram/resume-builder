"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChipInput } from "@/components/ui/ChipInput";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import type { Education } from "@/lib/types";
import { ItemCard, useFocusNewIndex } from "./ItemCard";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

const EMPTY: Education = { institution: "", degree: "", startDate: "" };

export function EducationForm() {
  const items = useBuilderStore((s) => s.sections.education) ?? [];
  const status = useBuilderStore((s) => s.sectionStatus.education) ?? "not_started";
  const addListItem = useBuilderStore((s) => s.addListItem);
  const updateListItem = useBuilderStore((s) => s.updateListItem);
  const removeListItem = useBuilderStore((s) => s.removeListItem);
  const { focusIndex, focusNew } = useFocusNewIndex();

  const skipped = status === "skipped";

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Education" help="Schools, degrees, and coursework." />
      {skipped ? (
        <SkippedNotice label="Education" />
      ) : (
        <>
      <div className="flex flex-col gap-3">
        {items.map((edu, i) => (
          <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem("education", i)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldGroup label="Institution">
                <TextInput
                  value={edu.institution}
                  onChange={(e) => updateListItem("education", i, { institution: e.target.value })}
                  placeholder="University of Texas at Austin"
                />
              </FieldGroup>
              <FieldGroup label="Degree">
                <TextInput
                  value={edu.degree}
                  onChange={(e) => updateListItem("education", i, { degree: e.target.value })}
                  placeholder="B.S. Computer Science"
                />
              </FieldGroup>
              <FieldGroup label="Field of study (optional)">
                <TextInput
                  value={edu.fieldOfStudy ?? ""}
                  onChange={(e) => updateListItem("education", i, { fieldOfStudy: e.target.value })}
                  placeholder="Computer Science"
                />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Start date">
                  <TextInput
                    type="month"
                    value={edu.startDate}
                    onChange={(e) => updateListItem("education", i, { startDate: e.target.value })}
                  />
                </FieldGroup>
                <FieldGroup label="End date">
                  <TextInput
                    type="month"
                    value={edu.endDate ?? ""}
                    onChange={(e) => updateListItem("education", i, { endDate: e.target.value || undefined })}
                  />
                </FieldGroup>
              </div>
            </div>
            <DetailFields edu={edu} onChange={(patch) => updateListItem("education", i, patch)} />
          </ItemCard>
        ))}
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => {
          focusNew(items.length);
          addListItem("education", EMPTY);
        }}
      >
        + Add education
      </Button>
        </>
      )}
    </div>
  );
}

function DetailFields({
  edu,
  onChange,
}: {
  edu: Education;
  onChange: (patch: Partial<Education>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = Boolean(edu.gpa || (edu.coursework && edu.coursework.length > 0));

  if (!expanded && !hasDetail) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="self-start text-[12px] font-medium text-[var(--color-accent)] transition-opacity hover:opacity-80"
      >
        + Add GPA / coursework
      </button>
    );
  }

  return (
    <div className="grid gap-3 border-t border-[var(--color-border)] pt-3 sm:grid-cols-2">
      <FieldGroup label="GPA (optional)">
        <TextInput value={edu.gpa ?? ""} onChange={(e) => onChange({ gpa: e.target.value })} placeholder="3.8 / 4.0" />
      </FieldGroup>
      <FieldGroup label="Relevant coursework (optional)">
        <ChipInput
          values={edu.coursework ?? []}
          onChange={(coursework) => onChange({ coursework })}
          placeholder="Add a course, press Enter"
        />
      </FieldGroup>
    </div>
  );
}

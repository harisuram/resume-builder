"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChipInput } from "@/components/ui/ChipInput";
import { FieldGroup, Select, TextInput } from "@/components/ui/Field";
import { SuggestInput } from "@/components/ui/SuggestInput";
import { COURSE_CATALOG, DEGREE_CATALOG, FIELD_CATALOG } from "@/lib/catalogs";
import { defaultGradeType, getGradeScale, GRADE_GROUPS, GRADE_SCALES, isGradeType } from "@/lib/grades";
import { useBuilderStore } from "@/lib/store";
import type { Education } from "@/lib/types";
import { useDetectedCountry } from "@/lib/useDetectedCountry";
import { useTouchedFields } from "@/lib/useTouchedFields";
import { getEducationErrors, MAX_CHIP_LENGTH, MAX_FIELD_LENGTH } from "@/lib/validation";
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
  const { touch, errorFor } = useTouchedFields();

  const skipped = status === "skipped";

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Education" help="Schools, degrees, and coursework." />
      {skipped ? (
        <SkippedNotice label="Education" sectionKey="education" />
      ) : (
        <>
      <div className="flex flex-col gap-3">
        {items.map((edu, i) => {
          const errors = getEducationErrors(edu);
          const institutionError = errorFor(`${i}.institution`, errors.institution);
          const degreeError = errorFor(`${i}.degree`, errors.degree);
          const fieldError = errorFor(`${i}.fieldOfStudy`, errors.fieldOfStudy);
          const endError = errorFor(`${i}.endDate`, errors.endDate);
          return (
          <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem("education", i)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldGroup label="Institution" htmlFor={`education-${i}-institution`} required error={institutionError}>
                <TextInput
                  id={`education-${i}-institution`}
                  value={edu.institution}
                  onChange={(e) => updateListItem("education", i, { institution: e.target.value })}
                  onBlur={touch(`${i}.institution`)}
                  placeholder="University of Texas at Austin"
                  maxLength={MAX_FIELD_LENGTH}
                  invalid={Boolean(institutionError)}
                />
              </FieldGroup>
              <FieldGroup label="Degree" htmlFor={`education-${i}-degree`} required error={degreeError}>
                <SuggestInput
                  id={`education-${i}-degree`}
                  value={edu.degree}
                  onChange={(value) => updateListItem("education", i, { degree: value })}
                  onBlur={touch(`${i}.degree`)}
                  placeholder="B.S. / B.Arch / Pharm.D."
                  maxLength={MAX_FIELD_LENGTH}
                  invalid={Boolean(degreeError)}
                  suggestions={DEGREE_CATALOG}
                  suggestionLabel="Suggested degrees"
                />
              </FieldGroup>
              <div className="sm:col-span-2">
                <FieldGroup label="Field of study (optional)" htmlFor={`education-${i}-field`} error={fieldError}>
                  <SuggestInput
                    id={`education-${i}-field`}
                    value={edu.fieldOfStudy ?? ""}
                    onChange={(value) => updateListItem("education", i, { fieldOfStudy: value })}
                    onBlur={touch(`${i}.fieldOfStudy`)}
                    placeholder="Pharmacy, Architecture, Construction…"
                    maxLength={MAX_FIELD_LENGTH}
                    invalid={Boolean(fieldError)}
                    suggestions={FIELD_CATALOG}
                    suggestionLabel="Suggested fields"
                  />
                </FieldGroup>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:col-span-2 md:grid-cols-2">
                <FieldGroup label="Start date" htmlFor={`education-${i}-start`}>
                  <TextInput
                    id={`education-${i}-start`}
                    type="month"
                    value={edu.startDate}
                    className="w-full min-w-0 md:min-w-[14rem]"
                    onChange={(e) => {
                      const startDate = e.target.value;
                      updateListItem(
                        "education",
                        i,
                        startDate ? { startDate } : { startDate: "", endDate: undefined },
                      );
                    }}
                    onBlur={touch(`${i}.startDate`)}
                  />
                </FieldGroup>
                <FieldGroup label="End date" htmlFor={`education-${i}-end`} error={endError}>
                  <TextInput
                    id={`education-${i}-end`}
                    type="month"
                    value={edu.endDate ?? ""}
                    disabled={!edu.startDate}
                    className="w-full min-w-0 md:min-w-[14rem]"
                    onChange={(e) => updateListItem("education", i, { endDate: e.target.value || undefined })}
                    onBlur={touch(`${i}.endDate`)}
                    invalid={Boolean(endError)}
                  />
                </FieldGroup>
              </div>
            </div>
            <DetailFields
              edu={edu}
              index={i}
              gpaError={errorFor(`${i}.gpa`, errors.gpa)}
              gpaMessage={errors.gpa}
              onGpaBlur={touch(`${i}.gpa`)}
              onChange={(patch) => updateListItem("education", i, patch)}
            />
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
  index,
  gpaError: touchedGpaError,
  gpaMessage,
  onGpaBlur,
  onChange,
}: {
  edu: Education;
  index: number;
  /** The grade's error once its field has been left. */
  gpaError?: string;
  /** The grade's error regardless — shown at once for a grade that was
   * already saved (or imported) when the form opened. */
  gpaMessage?: string;
  onGpaBlur: () => void;
  onChange: (patch: Partial<Education>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [prefilled] = useState(() => Boolean(edu.gpa?.trim()));
  const gpaError = touchedGpaError ?? (prefilled ? gpaMessage : undefined);
  const country = useDetectedCountry();
  const hasDetail = Boolean(edu.gpa || (edu.coursework && edu.coursework.length > 0));
  // A saved grade keeps its scale; a new one starts on the scale most common
  // where the visitor is (lib/grades.ts), and any scale can be picked.
  const gradeType = edu.gradeType ?? (edu.gpa ? "gpa" : defaultGradeType(country));
  const scale = getGradeScale(gradeType);
  const gradeId = `education-${index}-gpa`;

  if (!expanded && !hasDetail) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="self-start text-[12px] font-medium text-[var(--color-accent)] transition-opacity hover:opacity-80"
      >
        + Add grade / coursework
      </button>
    );
  }

  return (
    <div className="grid gap-3 border-t border-[var(--color-border)] pt-3 sm:grid-cols-2">
      <FieldGroup label="Grading system" htmlFor={`education-${index}-grade-type`}>
        <Select
          id={`education-${index}-grade-type`}
          value={gradeType}
          onChange={(e) => {
            if (!isGradeType(e.target.value)) return;
            const next = getGradeScale(e.target.value);
            // A value from one list of labels means nothing on another scale.
            const keep = next.kind !== "choice" || next.options.includes(edu.gpa?.trim() ?? "");
            onChange({ gradeType: next.id, ...(keep ? {} : { gpa: "" }) });
            // Re-check the kept value against the new scale right away.
            onGpaBlur();
          }}
        >
          {GRADE_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {GRADE_SCALES.filter((option) => option.group === group).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </FieldGroup>
      <FieldGroup label="Grade (optional)" htmlFor={gradeId} error={gpaError}>
        {scale.kind === "choice" ? (
          <Select
            id={gradeId}
            value={edu.gpa ?? ""}
            onChange={(e) => onChange({ gpa: e.target.value, gradeType })}
            onBlur={onGpaBlur}
            invalid={Boolean(gpaError)}
          >
            <option value="">Choose…</option>
            {scale.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        ) : (
          <TextInput
            id={gradeId}
            value={edu.gpa ?? ""}
            onChange={(e) => onChange({ gpa: e.target.value, gradeType })}
            onBlur={onGpaBlur}
            placeholder={scale.placeholder}
            inputMode={scale.kind === "number" && scale.id !== "outOf110" ? "decimal" : undefined}
            maxLength={40}
            invalid={Boolean(gpaError)}
          />
        )}
      </FieldGroup>
      <FieldGroup label="Relevant coursework (optional)">
        <ChipInput
          values={edu.coursework ?? []}
          onChange={(coursework) => onChange({ coursework })}
          placeholder="Add a course, press Enter"
          maxLength={MAX_CHIP_LENGTH}
          itemLabel="course"
          suggestions={COURSE_CATALOG}
        />
      </FieldGroup>
    </div>
  );
}

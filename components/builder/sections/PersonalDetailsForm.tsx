"use client";

import { useState } from "react";
import { FieldGroup, Select, TextInput } from "@/components/ui/Field";
import { SuggestInput } from "@/components/ui/SuggestInput";
import { NATIONALITY_CATALOG } from "@/lib/catalogs";
import { getSectionMeta } from "@/lib/persona";
import { useBuilderStore } from "@/lib/store";
import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, type PersonalDetails } from "@/lib/types";
import { useTouchedFields } from "@/lib/useTouchedFields";
import { getPersonalDetailsErrors, MAX_NATIONALITY_LENGTH } from "@/lib/validation";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

export { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS };

/** Today as `YYYY-MM-DD` in local time — the date input's `max`. */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function PersonalDetailsForm() {
  const details = useBuilderStore((s) => s.sections.personalDetails) ?? {};
  const status = useBuilderStore((s) => s.sectionStatus.personalDetails) ?? "not_started";
  const updatePersonalDetails = useBuilderStore((s) => s.updatePersonalDetails);
  const { touch, errorFor } = useTouchedFields();
  const meta = getSectionMeta("personalDetails");
  const errors = getPersonalDetailsErrors(details);
  // Fields that already held something when the step opened (a saved draft,
  // an import) show their errors straight away — otherwise Next would say
  // "fix the highlighted fields" with nothing highlighted. New typing waits
  // for blur, like every other form.
  const [prefilled] = useState(() => new Set(Object.keys(details).filter((key) => details[key as keyof PersonalDetails])));
  const shown = (field: keyof PersonalDetails) =>
    errorFor(field, errors[field]) ?? (prefilled.has(field) ? errors[field] : undefined);
  const dobError = shown("dateOfBirth");
  const genderError = shown("gender");
  const maritalError = shown("maritalStatus");
  const nationalityError = shown("nationality");

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title={meta.label} help={meta.helpText} />
      {status === "skipped" ? (
        <SkippedNotice label={meta.label} sectionKey="personalDetails" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldGroup label="Date of birth" htmlFor="personal-dob" error={dobError}>
            <TextInput
              id="personal-dob"
              type="date"
              value={details.dateOfBirth ?? ""}
              max={todayIso()}
              onChange={(e) => updatePersonalDetails({ dateOfBirth: e.target.value })}
              onBlur={touch("dateOfBirth")}
              invalid={Boolean(dobError)}
            />
          </FieldGroup>
          <FieldGroup label="Gender" htmlFor="personal-gender" error={genderError}>
            <Select
              id="personal-gender"
              value={details.gender ?? ""}
              onChange={(e) => updatePersonalDetails({ gender: e.target.value })}
              invalid={Boolean(genderError)}
            >
              <option value="">Leave off</option>
              {details.gender && genderError && <option value={details.gender}>{details.gender}</option>}
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Marital status" htmlFor="personal-marital" error={maritalError}>
            <Select
              id="personal-marital"
              value={details.maritalStatus ?? ""}
              onChange={(e) => updatePersonalDetails({ maritalStatus: e.target.value })}
              invalid={Boolean(maritalError)}
            >
              <option value="">Leave off</option>
              {details.maritalStatus && maritalError && (
                <option value={details.maritalStatus}>{details.maritalStatus}</option>
              )}
              {MARITAL_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Nationality" htmlFor="personal-nationality" error={nationalityError}>
            <SuggestInput
              id="personal-nationality"
              value={details.nationality ?? ""}
              onChange={(value) => updatePersonalDetails({ nationality: value })}
              onBlur={touch("nationality")}
              placeholder="Indian"
              maxLength={MAX_NATIONALITY_LENGTH}
              invalid={Boolean(nationalityError)}
              suggestions={NATIONALITY_CATALOG}
              suggestionLabel="Suggested nationalities"
            />
          </FieldGroup>
          <p className="text-[12px] text-[var(--color-ink-faint)] sm:col-span-2">
            Fill in only what you want printed — empty fields stay off the resume. Applying in the US, UK, Canada or
            Australia? Recruiters there usually expect none of these, so you can skip this section.
          </p>
        </div>
      )}
    </div>
  );
}

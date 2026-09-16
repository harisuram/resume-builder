"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import type { Certification } from "@/lib/types";
import { useTouchedFields } from "@/lib/useTouchedFields";
import { getCertificationErrors, MAX_FIELD_LENGTH } from "@/lib/validation";
import { ItemCard, useFocusNewIndex } from "./ItemCard";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

const EMPTY: Certification = { name: "", issuer: "", date: "" };

export function CertificationsForm() {
  const items = useBuilderStore((s) => s.sections.certifications) ?? [];
  const status = useBuilderStore((s) => s.sectionStatus.certifications) ?? "not_started";
  const addListItem = useBuilderStore((s) => s.addListItem);
  const updateListItem = useBuilderStore((s) => s.updateListItem);
  const removeListItem = useBuilderStore((s) => s.removeListItem);
  const { focusIndex, focusNew } = useFocusNewIndex();
  const { touch, errorFor } = useTouchedFields();

  const skipped = status === "skipped";

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Certifications" help="Licenses and certifications, with issuing body and date." />
      {skipped ? (
        <SkippedNotice label="Certifications" />
      ) : (
        <>
      <div className="flex flex-col gap-3">
        {items.map((cert, i) => {
          const errors = getCertificationErrors(cert);
          const nameError = errorFor(`${i}.name`, errors.name);
          const issuerError = errorFor(`${i}.issuer`, errors.issuer);
          return (
          <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem("certifications", i)}>
            <div className="grid gap-3 sm:grid-cols-3">
              <FieldGroup label="Name" htmlFor={`cert-${i}-name`} required error={nameError}>
                <TextInput
                  id={`cert-${i}-name`}
                  value={cert.name}
                  onChange={(e) => updateListItem("certifications", i, { name: e.target.value })}
                  onBlur={touch(`${i}.name`)}
                  placeholder="AWS Certified Developer"
                  maxLength={MAX_FIELD_LENGTH}
                  invalid={Boolean(nameError)}
                />
              </FieldGroup>
              <FieldGroup label="Issuer" htmlFor={`cert-${i}-issuer`} required error={issuerError}>
                <TextInput
                  id={`cert-${i}-issuer`}
                  value={cert.issuer}
                  onChange={(e) => updateListItem("certifications", i, { issuer: e.target.value })}
                  onBlur={touch(`${i}.issuer`)}
                  placeholder="Amazon Web Services"
                  maxLength={MAX_FIELD_LENGTH}
                  invalid={Boolean(issuerError)}
                />
              </FieldGroup>
              <FieldGroup label="Date" htmlFor={`cert-${i}-date`}>
                <TextInput
                  id={`cert-${i}-date`}
                  type="month"
                  value={cert.date}
                  onChange={(e) => updateListItem("certifications", i, { date: e.target.value })}
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
          addListItem("certifications", EMPTY);
        }}
      >
        + Add certification
      </Button>
        </>
      )}
    </div>
  );
}

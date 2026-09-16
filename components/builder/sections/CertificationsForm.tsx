"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { SuggestInput } from "@/components/ui/SuggestInput";
import { CERTIFICATION_CATALOG, CERTIFICATION_ISSUER_CATALOG } from "@/lib/catalogs";
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
                <SuggestInput
                  id={`cert-${i}-name`}
                  value={cert.name}
                  onChange={(value) => updateListItem("certifications", i, { name: value })}
                  onBlur={touch(`${i}.name`)}
                  placeholder="AWS Certified Developer, CCNA, PMP…"
                  maxLength={MAX_FIELD_LENGTH}
                  invalid={Boolean(nameError)}
                  suggestions={CERTIFICATION_CATALOG}
                  suggestionLabel="Suggested certifications"
                />
              </FieldGroup>
              <FieldGroup label="Issuer" htmlFor={`cert-${i}-issuer`} required error={issuerError}>
                <SuggestInput
                  id={`cert-${i}-issuer`}
                  value={cert.issuer}
                  onChange={(value) => updateListItem("certifications", i, { issuer: value })}
                  onBlur={touch(`${i}.issuer`)}
                  placeholder="Amazon Web Services, Cisco, OSHA…"
                  maxLength={MAX_FIELD_LENGTH}
                  invalid={Boolean(issuerError)}
                  suggestions={CERTIFICATION_ISSUER_CATALOG}
                  suggestionLabel="Suggested issuers"
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

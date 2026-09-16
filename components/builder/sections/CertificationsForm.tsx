"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import type { Certification } from "@/lib/types";
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

  const skipped = status === "skipped";

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Certifications" help="Licenses and certifications, with issuing body and date." />
      {skipped ? (
        <SkippedNotice label="Certifications" />
      ) : (
        <>
      <div className="flex flex-col gap-3">
        {items.map((cert, i) => (
          <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem("certifications", i)}>
            <div className="grid gap-3 sm:grid-cols-3">
              <FieldGroup label="Name">
                <TextInput
                  value={cert.name}
                  onChange={(e) => updateListItem("certifications", i, { name: e.target.value })}
                  placeholder="AWS Certified Developer"
                />
              </FieldGroup>
              <FieldGroup label="Issuer">
                <TextInput
                  value={cert.issuer}
                  onChange={(e) => updateListItem("certifications", i, { issuer: e.target.value })}
                  placeholder="Amazon Web Services"
                />
              </FieldGroup>
              <FieldGroup label="Date">
                <TextInput
                  type="month"
                  value={cert.date}
                  onChange={(e) => updateListItem("certifications", i, { date: e.target.value })}
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

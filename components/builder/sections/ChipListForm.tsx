"use client";

import { ChipInput } from "@/components/ui/ChipInput";
import { useBuilderStore } from "@/lib/store";
import { MAX_CHIP_LENGTH } from "@/lib/validation";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

export function ChipListForm({
  sectionKey,
  title,
  help,
  placeholder,
  itemLabel,
}: {
  sectionKey: "skills" | "hobbies" | "softSkills";
  title: string;
  help: string;
  placeholder: string;
  itemLabel: string;
}) {
  const values = useBuilderStore((s) => s.sections[sectionKey]) ?? [];
  const status = useBuilderStore((s) => s.sectionStatus[sectionKey]) ?? "not_started";
  const setSkills = useBuilderStore((s) => s.setSkills);
  const setHobbies = useBuilderStore((s) => s.setHobbies);
  const setSoftSkills = useBuilderStore((s) => s.setSoftSkills);
  const skipped = status === "skipped";

  function onChange(next: string[]) {
    if (sectionKey === "skills") setSkills(next);
    else if (sectionKey === "hobbies") setHobbies(next);
    else setSoftSkills(next);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title={title} help={help} />
      {skipped ? (
        <SkippedNotice label={title} />
      ) : (
        <ChipInput
          values={values}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={MAX_CHIP_LENGTH}
          itemLabel={itemLabel}
        />
      )}
    </div>
  );
}

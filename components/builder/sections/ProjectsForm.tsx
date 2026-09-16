"use client";

import { Button } from "@/components/ui/Button";
import { ChipInput } from "@/components/ui/ChipInput";
import { FieldGroup, TextArea, TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import type { Project } from "@/lib/types";
import { useTouchedFields } from "@/lib/useTouchedFields";
import { getProjectErrors, MAX_CHIP_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_FIELD_LENGTH } from "@/lib/validation";
import { ItemCard, useFocusNewIndex } from "./ItemCard";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

const EMPTY: Project = { name: "", description: "" };

export function ProjectsForm() {
  const items = useBuilderStore((s) => s.sections.projects) ?? [];
  const status = useBuilderStore((s) => s.sectionStatus.projects) ?? "not_started";
  const addListItem = useBuilderStore((s) => s.addListItem);
  const updateListItem = useBuilderStore((s) => s.updateListItem);
  const removeListItem = useBuilderStore((s) => s.removeListItem);
  const { focusIndex, focusNew } = useFocusNewIndex();
  const { touch, errorFor } = useTouchedFields();

  const skipped = status === "skipped";

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Projects" help="Things you built — classwork, side projects, hackathons." />
      {skipped ? (
        <SkippedNotice label="Projects" />
      ) : (
        <>
      <div className="flex flex-col gap-3">
        {items.map((project, i) => {
          const errors = getProjectErrors(project);
          const nameError = errorFor(`${i}.name`, errors.name);
          const descriptionError = errorFor(`${i}.description`, errors.description);
          const linkError = errorFor(`${i}.link`, errors.link);
          return (
          <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem("projects", i)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldGroup label="Project name" htmlFor={`project-${i}-name`} required error={nameError}>
                <TextInput
                  id={`project-${i}-name`}
                  value={project.name}
                  onChange={(e) => updateListItem("projects", i, { name: e.target.value })}
                  onBlur={touch(`${i}.name`)}
                  placeholder="Resume Builder"
                  maxLength={MAX_FIELD_LENGTH}
                  invalid={Boolean(nameError)}
                />
              </FieldGroup>
              <FieldGroup label="Link (optional)" htmlFor={`project-${i}-link`} error={linkError}>
                <TextInput
                  id={`project-${i}-link`}
                  value={project.link ?? ""}
                  onChange={(e) => updateListItem("projects", i, { link: e.target.value })}
                  onBlur={touch(`${i}.link`)}
                  placeholder="github.com/you/project"
                  maxLength={MAX_FIELD_LENGTH}
                  invalid={Boolean(linkError)}
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Description" htmlFor={`project-${i}-description`} required error={descriptionError}>
              <TextArea
                id={`project-${i}-description`}
                rows={2}
                value={project.description}
                onChange={(e) => updateListItem("projects", i, { description: e.target.value })}
                onBlur={touch(`${i}.description`)}
                placeholder="What it does and what you used to build it."
                maxLength={MAX_DESCRIPTION_LENGTH}
                invalid={Boolean(descriptionError)}
              />
            </FieldGroup>
            <FieldGroup label="Technologies (optional)">
              <ChipInput
                values={project.technologies ?? []}
                onChange={(technologies) => updateListItem("projects", i, { technologies })}
                placeholder="Add a technology, press Enter"
                maxLength={MAX_CHIP_LENGTH}
                itemLabel="technology"
              />
            </FieldGroup>
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
          addListItem("projects", EMPTY);
        }}
      >
        + Add project
      </Button>
        </>
      )}
    </div>
  );
}

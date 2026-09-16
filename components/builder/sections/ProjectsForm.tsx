"use client";

import { Button } from "@/components/ui/Button";
import { ChipInput } from "@/components/ui/ChipInput";
import { FieldGroup, TextArea, TextInput } from "@/components/ui/Field";
import { useBuilderStore } from "@/lib/store";
import type { Project } from "@/lib/types";
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

  const skipped = status === "skipped";

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Projects" help="Things you built — classwork, side projects, hackathons." />
      {skipped ? (
        <SkippedNotice label="Projects" />
      ) : (
        <>
      <div className="flex flex-col gap-3">
        {items.map((project, i) => (
          <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem("projects", i)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldGroup label="Project name">
                <TextInput
                  value={project.name}
                  onChange={(e) => updateListItem("projects", i, { name: e.target.value })}
                  placeholder="Resume Builder"
                />
              </FieldGroup>
              <FieldGroup label="Link (optional)">
                <TextInput
                  value={project.link ?? ""}
                  onChange={(e) => updateListItem("projects", i, { link: e.target.value })}
                  placeholder="github.com/you/project"
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Description">
              <TextArea
                rows={2}
                value={project.description}
                onChange={(e) => updateListItem("projects", i, { description: e.target.value })}
                placeholder="What it does and what you used to build it."
              />
            </FieldGroup>
            <FieldGroup label="Technologies (optional)">
              <ChipInput
                values={project.technologies ?? []}
                onChange={(technologies) => updateListItem("projects", i, { technologies })}
                placeholder="Add a technology, press Enter"
              />
            </FieldGroup>
          </ItemCard>
        ))}
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

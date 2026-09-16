"use client";

import { ChipListForm } from "./ChipListForm";

export function SkillsForm() {
  return (
    <ChipListForm
      sectionKey="skills"
      title="Skills"
      help="Technical languages, tools, and frameworks worth listing."
      placeholder="Add a skill, press Enter"
    />
  );
}

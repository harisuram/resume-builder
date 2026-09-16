"use client";

import { ChipListForm } from "./ChipListForm";

export function SkillsForm() {
  return (
    <ChipListForm
      sectionKey="skills"
      title="Skills"
      help="Tools, methods, and systems — software, data, IT, trades, clinical, and more."
      placeholder="Add a skill, press Enter"
      itemLabel="skill"
    />
  );
}

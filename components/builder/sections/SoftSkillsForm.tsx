"use client";

import { ChipListForm } from "./ChipListForm";

export function SoftSkillsForm() {
  return (
    <ChipListForm
      sectionKey="softSkills"
      title="Soft skills"
      help="How you work with people — communication, leadership, mentoring."
      placeholder="Add a soft skill, press Enter"
    />
  );
}

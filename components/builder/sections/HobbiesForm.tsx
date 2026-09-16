"use client";

import { ChipListForm } from "./ChipListForm";

export function HobbiesForm() {
  return (
    <ChipListForm
      sectionKey="hobbies"
      title="Hobbies"
      help="Interests worth listing if they add something the rest of the resume doesn't."
      placeholder="Add a hobby, press Enter"
      itemLabel="hobby"
    />
  );
}

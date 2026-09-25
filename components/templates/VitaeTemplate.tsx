"use client";

import { useState } from "react";
import type { ResumeData } from "@/lib/types";
import { SingleColumnLayout } from "./layouts/SingleColumnLayout";
import type { NameHeadingLevel } from "./registry";
import { visiblePhoto } from "./shared/atoms";
import { getTheme } from "./shared/theme";

/** JSON Resume Vitae's one distinguishing feature per spec: a built-in
 * light/dark toggle scoped to the resume surface only. The only template
 * with any client-side state — kept in its own file so the other templates
 * (and the layouts/atoms they share) don't carry a "use client" boundary
 * they don't need. */
export function VitaeTemplate({
  data,
  headingLevel,
}: {
  data: ResumeData;
  headingLevel?: NameHeadingLevel;
}) {
  const [dark, setDark] = useState(false);
  const theme = getTheme("jsonresume-vitae");
  // The header photo sits in the top-right corner, so the toggle drops to the
  // bottom-right rather than covering it.
  const togglePosition = visiblePhoto(data) ? "bottom-3" : "top-3";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDark((v) => !v)}
        className={`no-print absolute right-3 ${togglePosition} z-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink-soft)] shadow-sm transition hover:text-[var(--color-ink)]`}
      >
        {dark ? "Light mode" : "Dark mode"}
      </button>
      <SingleColumnLayout
        data={data}
        theme={theme}
        resumeTheme={dark ? "dark" : "light"}
        headingLevel={headingLevel}
      />
    </div>
  );
}

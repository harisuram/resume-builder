import type { SectionKey } from "@/lib/types";

/** Icon geometry as plain data, so the HTML templates (icons.tsx, atoms.tsx)
 * and the PDF document (components/pdf) draw from one source instead of two
 * copies of every path that could drift apart. */
export type IconShape =
  | { tag: "path"; d: string }
  | { tag: "circle"; cx: number; cy: number; r: number }
  | { tag: "rect"; x: number; y: number; width: number; height: number; rx?: number };

export interface IconDef {
  /** Solid glyph (brand marks) rather than a stroked line icon. */
  filled?: boolean;
  viewBox: string;
  shapes: IconShape[];
}

const line = (...shapes: IconShape[]): IconDef => ({ viewBox: "0 0 24 24", shapes });
const path = (d: string): IconShape => ({ tag: "path", d });
const circle = (cx: number, cy: number, r: number): IconShape => ({ tag: "circle", cx, cy, r });

/** Stroke settings shared by every line icon. */
export const LINE_ICON_STROKE = { width: 1.6, linecap: "round", linejoin: "round" } as const;

const GLOBE = line(
  circle(12, 12, 8.5),
  path("M3.5 12h17"),
  path("M12 3.5c2.4 2.3 3.7 5.2 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.2-3.7-8.5S9.6 5.8 12 3.5Z"),
);
const EXPERIENCE = line(
  { tag: "rect", x: 3, y: 7.5, width: 18, height: 12, rx: 1.5 },
  path("M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5"),
  path("M3 12.5h18"),
);

export const ICONS = {
  education: line(
    path("M2 8.5 12 4l10 4.5-10 4.5-10-4.5Z"),
    path("M6 10.7v4.3c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.3"),
    path("M21 8.5v6"),
  ),
  experience: EXPERIENCE,
  project: line(path("m9 8-4 4 4 4"), path("m15 8 4 4-4 4")),
  skill: line(path("M14.5 3.5 12 6l-1.5-1.5L8 7l1.5 1.5L3 15v3.5H6.5L14 11l1.5 1.5 2.5-2.5L16.5 8.5 19 6l-4.5-2.5Z")),
  keyAchievement: line(
    path("m12 3.5 2.3 4.7 5.2.75-3.75 3.65.9 5.2L12 15.3l-4.65 2.5.9-5.2-3.75-3.65 5.2-.75L12 3.5Z"),
  ),
  certification: line(circle(12, 9, 5.5), path("m8.5 13.5-1.5 6 5-2.5 5 2.5-1.5-6")),
  patent: line(
    path("M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z"),
    path("M14 3.5v4h4"),
    path("M9 13h6"),
    path("M9 16.5h4"),
  ),
  language: GLOBE,
  hobby: line(
    circle(12, 12, 3),
    path("M12 5.5v-2"),
    path("M12 20.5v-2"),
    path("m7.4 7.4-1.4-1.4"),
    path("m18 18-1.4-1.4"),
    path("M5.5 12h-2"),
    path("M20.5 12h-2"),
    path("m7.4 16.6-1.4 1.4"),
    path("m18 6-1.4 1.4"),
  ),
  softSkill: line(
    circle(9, 8, 2.4),
    circle(15.5, 8.5, 2),
    path("M4.5 18c.4-2.6 2.4-4 4.5-4s4.1 1.4 4.5 4"),
    path("M14 14.2c1.6-.3 3.4.6 4 2.8"),
  ),
  additional: line(path("M5 6.5h14"), path("M5 12h14"), path("M5 17.5h9")),
  globe: GLOBE,
  // Octicons mark-github (MIT, © GitHub Inc.) and the Simple Icons LinkedIn
  // mark (CC0). Licence text: public/third-party-notices.txt.
  github: {
    filled: true,
    viewBox: "0 0 16 16",
    shapes: [
      path(
        "M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z",
      ),
    ],
  },
  linkedin: {
    filled: true,
    viewBox: "0 0 24 24",
    shapes: [
      path(
        "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z",
      ),
    ],
  },
  mail: line({ tag: "rect", x: 3, y: 5.5, width: 18, height: 13, rx: 1.5 }, path("m4 7 8 6 8-6")),
  phone: line(
    path("M6 3.5h3l1.2 4-2 1.3a10.5 10.5 0 0 0 5 5l1.3-2 4 1.2v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 4.5 5.1 1.5 1.5 0 0 1 6 3.5Z"),
  ),
  pin: line(path("M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z"), circle(12, 9.5, 2.3)),
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

export const SECTION_ICON_NAMES: Partial<Record<SectionKey, IconName>> = {
  education: "education",
  experience: "experience",
  internships: "experience",
  partTime: "experience",
  projects: "project",
  skills: "skill",
  certifications: "certification",
  keyAchievements: "keyAchievement",
  patents: "patent",
  languages: "language",
  hobbies: "hobby",
  softSkills: "softSkill",
  additional: "additional",
};

/** Bullet marks, drawn in a 10×10 box. Each carries its own fill/stroke
 * because the solid shapes and the line marks use different weights. */
export type BulletKind = "chevron" | "square" | "diamond" | "dash" | "arrow";

export interface BulletDef {
  shape: IconShape;
  /** Solid fill; otherwise stroked at `strokeWidth` with round caps. */
  filled: boolean;
  strokeWidth?: number;
  /** Round the corners where segments meet (the two-segment marks). */
  roundJoin?: boolean;
}

export const BULLETS: Record<BulletKind, BulletDef> = {
  square: { shape: { tag: "rect", x: 2, y: 2, width: 6, height: 6, rx: 0.6 }, filled: true },
  diamond: { shape: path("M5 1.2 8.8 5 5 8.8 1.2 5Z"), filled: true },
  dash: { shape: path("M1.2 5h7.6"), filled: false, strokeWidth: 1.6 },
  arrow: { shape: path("M1.4 5h6.2M5.2 2.6 8.6 5 5.2 7.4"), filled: false, strokeWidth: 1.4, roundJoin: true },
  chevron: { shape: path("M3.2 2.2 7.2 5 3.2 7.8"), filled: false, strokeWidth: 1.5, roundJoin: true },
};

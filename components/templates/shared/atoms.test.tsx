import { render } from "@testing-library/react";
import { bulletKind, ExperienceList, itemBreaks, KeyAchievementsList } from "./atoms";
import { getTheme } from "./theme";
import { makeFullResumeData } from "@/test-utils/fixtures";

describe("bulletKind", () => {
  it("picks a distinct mark from the template heading style, never a plain disc", () => {
    expect(bulletKind(getTheme("jakes-resume"))).toBe("arrow");
    expect(bulletKind(getTheme("bre-purple"))).toBe("square");
    expect(bulletKind(getTheme("bre-cool"))).toBe("dash");
    expect(bulletKind(getTheme("bre-green"))).toBe("diamond");
    expect(bulletKind(getTheme("bre-creative"))).toBe("chevron");
  });
});

describe("BulletList", () => {
  it("renders achievement and experience lines with the template's bullet mark, not list-disc", () => {
    const data = makeFullResumeData();
    const theme = getTheme("jakes-resume");
    const { container } = render(
      <>
        <KeyAchievementsList items={data.sections.keyAchievements!} theme={theme} breaks={itemBreaks(data, "keyAchievements")} />
        <ExperienceList items={data.sections.experience!} theme={theme} breaks={itemBreaks(data, "experience")} />
      </>,
    );
    expect(container.querySelector("ul.list-disc")).toBeNull();
    expect(container.querySelectorAll('[data-bullet-kind="arrow"]').length).toBeGreaterThan(0);
    expect(container.textContent).toContain(data.sections.keyAchievements![0]);
    expect(container.textContent).toContain(data.sections.experience![0].bullets[0]);
  });
});

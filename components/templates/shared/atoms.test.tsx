import { render } from "@testing-library/react";
import { bulletKind, ExperienceList, hasAvatar, itemBreaks, KeyAchievementsList, visiblePhoto } from "./atoms";
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
    expect(container.textContent).toContain("Mar 2019 – Present");
  });

  it("prints Present for an explicitly current role and a real end date otherwise", () => {
    const theme = getTheme("jakes-resume");
    const breaks = itemBreaks(makeFullResumeData(), "experience");
    const { rerender, container } = render(
      <ExperienceList
        items={[{ company: "Acme", role: "Engineer", startDate: "2020-01", current: true, bullets: [] }]}
        theme={theme}
        breaks={breaks}
      />,
    );
    expect(container.textContent).toContain("Jan 2020 – Present");

    rerender(
      <ExperienceList
        items={[
          { company: "Acme", role: "Engineer", startDate: "2020-01", endDate: "2021-06", current: false, bullets: [] },
        ]}
        theme={theme}
        breaks={breaks}
      />,
    );
    expect(container.textContent).toContain("Jan 2020 – Jun 2021");
    expect(container.textContent).not.toContain("Present");
  });
});

describe("visiblePhoto / hasAvatar", () => {
  const photo = "data:image/jpeg;base64,abc123";

  it("returns the uploaded photo unless Photo is skipped", () => {
    const data = makeFullResumeData({ photo });
    expect(visiblePhoto(data)).toBe(photo);

    const skipped = { ...data, sectionStatus: { ...data.sectionStatus, photo: "skipped" as const } };
    expect(visiblePhoto(skipped)).toBeUndefined();
  });

  it("hides a skipped photo even on templates with an avatar slot", () => {
    const data = makeFullResumeData({ photo, sectionStatus: { photo: "skipped" } });
    const theme = getTheme("bre-creative");
    expect(hasAvatar(data, theme)).toBe(Boolean(theme.showAvatar));
    expect(visiblePhoto(data)).toBeUndefined();
  });
});

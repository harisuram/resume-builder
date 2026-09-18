import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { saveResumeData } from "@/lib/storage";
import { dismissBuilderTour } from "@/lib/builderTour";
import { useBuilderStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { BuilderShell } from "./BuilderShell";

beforeEach(() => {
  localStorage.clear();
  dismissBuilderTour();
  useBuilderStore.getState().resetStore();
  useToastStore.getState().clear();
  window.history.replaceState({}, "", "/");
});

function nav() {
  return within(screen.getByRole("navigation", { name: "Resume sections" }));
}

describe("BuilderShell", () => {
  it("opens on Basic info with every section listed, no persona gate", async () => {
    render(<BuilderShell />);
    expect(await screen.findByRole("heading", { name: "Basic info" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Choose file" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Import resume" })).not.toBeInTheDocument();
    expect(nav().getByText("Summary")).toBeInTheDocument();
    expect(nav().getByText("Internships")).toBeInTheDocument();
    expect(screen.queryByText("Which best describes you?")).not.toBeInTheDocument();
  });

  it("auto-loads a previously saved resume on mount", async () => {
    saveResumeData(makeFullResumeData());
    render(<BuilderShell />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "Basic info" })).toBeInTheDocument());
    expect(useBuilderStore.getState().basicInfo.name).toBe("Alexandra Montgomery-Whitfield");
    expect(screen.getByRole("button", { name: "Start new resume" })).toBeInTheDocument();
  });

  it("switches the active form panel via the section nav", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    await userEvent.click(nav().getByText("Skills"));
    expect(screen.getByText("Tools, methods, and systems — software, data, IT, trades, clinical, and more.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Full name")).not.toBeInTheDocument();
  });

  it("routes every content section key to its matching form", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });

    const routes: [string, string][] = [
      ["Education", "Schools, degrees, and coursework."],
      ["Projects", "Things you built — classwork, side projects, hackathons."],
      ["Internships", "Internships or co-ops you've done, most recent first."],
      ["Part-time work", "Part-time jobs outside of an internship, most recent first."],
      ["Experience", "Paid roles you've held, most recent first."],
      ["Certifications", "Licenses and certifications, with issuing body and date."],
      ["Patents", "Patents granted or pending, with number and date."],
      ["Languages", "Spoken languages, with proficiency."],
      ["Hobbies", "Interests worth listing if they add something the rest of the resume doesn't."],
      ["Soft skills", "How you work with people — communication, leadership, mentoring."],
      ["Additional", "Anything else — publications, volunteer work, awards. Name the heading yourself."],
    ];
    for (const [navLabel, help] of routes) {
      await userEvent.click(nav().getByText(navLabel));
      expect(screen.getByText(help)).toBeInTheDocument();
    }
  });

  it("blocks Next on Basic info until name, email, and location are filled", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });

    expect(screen.getByRole("button", { name: "Save & Next" })).toBeDisabled();
    expect(screen.getAllByText("Fill in your name, email, and location to continue.")).not.toHaveLength(0);

    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }));
    expect(screen.getByRole("button", { name: "Save & Next" })).toBeEnabled();

    await userEvent.click(screen.getByRole("button", { name: "Save & Next" }));
    expect(screen.getByRole("heading", { name: "Summary", level: 2 })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("resumeData")!).basicInfo.name).toBe("Jamie");
  });

  it("blocks Next on a content section until it's filled in or skipped, and lets Skip past it regardless", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    await userEvent.click(nav().getByText("Skills"));

    expect(screen.getByRole("button", { name: "Save & Next" })).toBeDisabled();

    // Skip works even though the section is unresolved — that's its purpose.
    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(useBuilderStore.getState().sectionStatus.skills).toBe("skipped");
    expect(JSON.parse(localStorage.getItem("resumeData")!).sectionStatus.skills).toBe("skipped");
    expect(screen.getByRole("heading", { name: "Certifications", level: 2 })).toBeInTheDocument();

    // Back walks over the skipped Skills step to the previous included one.
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Education", level: 2 })).toBeInTheDocument();

    await userEvent.click(nav().getByText("Skills"));
    expect(screen.getByRole("button", { name: "Save & Next" })).toBeEnabled();
  });

  it("Next and Skip jump over sections already turned off in the nav", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    await userEvent.click(nav().getByText("Photo"));
    await userEvent.click(nav().getByRole("switch", { name: "Skip Key achievements" }));
    await userEvent.click(nav().getByRole("switch", { name: "Skip Internships" }));

    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(useBuilderStore.getState().sectionStatus.photo).toBe("skipped");
    expect(screen.getByRole("heading", { name: "Experience", level: 2 })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Summary", level: 2 })).toBeInTheDocument();
  });

  it("walks basicInfo -> summary via the Next/Back footer buttons", async () => {
    render(<BuilderShell />);
    expect(await screen.findByRole("heading", { name: "Basic info" })).toBeInTheDocument();
    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }));

    await userEvent.click(screen.getByRole("button", { name: "Save & Next" }));
    expect(screen.getByRole("heading", { name: "Summary", level: 2 })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Basic info" })).toBeInTheDocument();
  });

  it("fades the step in from the right on Next and from the left on Back", async () => {
    render(<BuilderShell />);
    expect(await screen.findByRole("heading", { name: "Basic info" })).toBeInTheDocument();
    expect(document.querySelector(".animate-step-in-from-right")).toBeNull();
    expect(document.querySelector(".animate-step-in-from-left")).toBeNull();

    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }));
    await userEvent.click(screen.getByRole("button", { name: "Save & Next" }));

    expect(screen.getByRole("heading", { name: "Summary", level: 2 }).closest(".animate-step-in-from-right")).not.toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Basic info" }).closest(".animate-step-in-from-left")).not.toBeNull();
    expect(document.querySelector(".animate-step-in-from-right")).toBeNull();
  });

  it("fades the step in from the right on Skip", async () => {
    render(<BuilderShell />);
    expect(await screen.findByRole("heading", { name: "Basic info" })).toBeInTheDocument();
    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }));
    await userEvent.click(screen.getByRole("button", { name: "Save & Next" }));
    expect(screen.getByRole("heading", { name: "Summary", level: 2 })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("heading", { name: "Photo" }).closest(".animate-step-in-from-right")).not.toBeNull();
    expect(useBuilderStore.getState().sectionStatus.summary).toBe("skipped");
  });

  it("scrolls the form pane to the top when Next opens the next section", async () => {
    const { container } = render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }));

    const main = container.querySelector("main")!;
    main.scrollTop = 480;
    expect(main.scrollTop).toBe(480);

    await userEvent.click(screen.getByRole("button", { name: "Save & Next" }));
    expect(screen.getByRole("heading", { name: "Summary", level: 2 })).toBeInTheDocument();
    expect(main.scrollTop).toBe(0);
  });

  it("Skip on the Photo step hides the photo and advances to Key achievements", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    await userEvent.click(nav().getByText("Photo"));
    act(() => useBuilderStore.getState().setPhoto("data:image/jpeg;base64,abc123"));

    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(useBuilderStore.getState().photo).toBe("data:image/jpeg;base64,abc123");
    expect(useBuilderStore.getState().sectionStatus.photo).toBe("skipped");
    expect(screen.getByRole("heading", { name: "Key achievements", level: 2 })).toBeInTheDocument();
  });

  it("walks Summary -> Photo -> Key achievements via Skip", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }));
    await userEvent.click(screen.getByRole("button", { name: "Save & Next" }));
    expect(screen.getByRole("heading", { name: "Summary", level: 2 })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("heading", { name: "Photo" })).toBeInTheDocument();
    expect(screen.getByText("No photo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save & Next" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(useBuilderStore.getState().sectionStatus.photo).toBe("skipped");
    expect(screen.getByRole("heading", { name: "Key achievements", level: 2 })).toBeInTheDocument();
  });

  it("Skip on Additional advances to export", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    await userEvent.click(nav().getByText("Additional"));
    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("heading", { name: "Preview & download" })).toBeInTheDocument();
  });

  it("renders the export step full-width with only the section nav aside (no separate preview aside)", async () => {
    const { container } = render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() => useBuilderStore.getState().setSkills(["TypeScript"]));
    await userEvent.click(nav().getByText("Preview & download"));

    expect(screen.getByRole("heading", { name: "Preview & download" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.querySelectorAll("aside")).toHaveLength(1);
    expect(container.querySelector("main")!.className).toContain("print-unclip");
    expect(container.querySelector("main")!.className).toContain("overflow-y-auto");
    expect(container.querySelector(".animate-step-in-from-right, .animate-step-in-from-left")?.className).toContain(
      "print-unclip",
    );
    // Nested preview scroll is for the side column only — on this step the
    // main pane is the scroller, or the wheel over the resume goes nowhere.
    expect(container.querySelector("main")!.querySelector(".overflow-y-auto")).toBeNull();
  });

  it("keeps the side-by-side preview aside to desktop (phones use the sheet instead)", async () => {
    const { container } = render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });

    const asides = container.querySelectorAll("aside");
    const previewAside = asides[asides.length - 1];
    expect(previewAside.className.split(/\s+/)).toContain("w-0");
    expect(previewAside.className.split(/\s+/)).not.toContain("hidden");
    expect(previewAside.className).toContain("md:w-[min(650px,max(325px,42.75%))]");
    expect(previewAside.className).toContain("md:overflow-hidden");
    expect(previewAside.className).toContain("min-h-0");
    expect(container.querySelector("main")!.className).not.toContain("hidden");
    expect(container.querySelector("main")!.className).toContain("overflow-y-auto");
  });

  it("caps the builder to the viewport so the preview column scrolls on its own", async () => {
    const { container } = render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });

    const shell = container.firstElementChild as HTMLElement;
    expect(shell.className).toContain("h-[100dvh]");
    expect(shell.className).toContain("overflow-hidden");
    expect((shell.firstElementChild as HTMLElement).className).toContain("print-unclip");

    const previewAside = container.querySelectorAll("aside")[container.querySelectorAll("aside").length - 1];
    expect(previewAside.className).toContain("md:overflow-hidden");
    expect(previewAside.querySelector(".overflow-y-auto")).not.toBeNull();
  });

  it("opens the mobile preview in a bottom sheet without leaving the current section", async () => {
    const { container } = render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });

    const button = screen.getByRole("button", { name: "Preview resume" });
    expect(button.className).toContain("md:hidden");
    expect(container.querySelector("main")!.contains(button)).toBe(true);

    const main = container.querySelector("main")!;
    main.scrollTop = 480;
    expect(main.scrollTop).toBe(480);

    await userEvent.click(button, { pointerEventsCheck: 0 });

    expect(screen.getByRole("dialog", { name: "Resume preview" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Preview & download" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Basic info", hidden: true })).toBeInTheDocument();
    expect(main.scrollTop).toBe(480);
    expect(screen.queryByRole("button", { name: "Preview resume" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Continue editing" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Resume preview" })).not.toBeInTheDocument());

    expect(screen.getByRole("heading", { name: "Basic info" })).toBeInTheDocument();
    expect(main.scrollTop).toBe(480);
    expect(screen.getByRole("button", { name: "Preview resume" })).toBeInTheDocument();
  });

  it("returns to the same section after the preview sheet is closed", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    await userEvent.click(nav().getByText("Skills"));
    expect(screen.getByRole("heading", { name: "Skills", level: 2 })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Preview resume" }), { pointerEventsCheck: 0 });
    expect(screen.getByRole("dialog", { name: "Resume preview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skills", level: 2, hidden: true })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Close preview" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Resume preview" })).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Skills", level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Preview & download" })).not.toBeInTheDocument();
  });

  it("still drops the pinned preview button on the export step", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    await userEvent.click(nav().getByText("Preview & download"));
    expect(screen.getByRole("heading", { name: "Preview & download" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preview resume" })).not.toBeInTheDocument();
  });

  it("pins the step footer on phones so Next stays clear of the preview button", async () => {
    const { container } = render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });

    const next = screen.getByRole("button", { name: "Save & Next" });
    const footer = next.closest(".no-print");
    expect(footer?.className).toContain("fixed");
    expect(footer?.className).toContain("md:static");

    const preview = screen.getByRole("button", { name: "Preview resume" });
    expect(footer?.contains(preview)).toBe(true);
    expect(preview.className).toContain("md:hidden");
    expect(container.querySelector("main")!.className).toContain("pb-[calc(11rem");
  });

  it("resets to an empty builder after 'Start new resume' is confirmed", async () => {
    saveResumeData(makeFullResumeData());
    render(<BuilderShell />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Start new resume" })).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Start new resume" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear and start over" }));

    expect(await screen.findByRole("heading", { name: "Basic info" })).toBeInTheDocument();
    expect(useBuilderStore.getState().basicInfo.name).toBe("");
    expect(localStorage.getItem("resumeData")).toBeNull();
  });

  it("shows a disabled Clear button on an empty step, next to Back", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();

    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }));
    await userEvent.click(screen.getByRole("button", { name: "Save & Next" }));
    expect(screen.getByRole("heading", { name: "Summary", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
  });

  it("clears only the current section after confirmation, leaving other sections alone", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" });
      useBuilderStore.getState().setSkills(["TypeScript", "Go"]);
      useBuilderStore.getState().setSummary("Backend engineer.");
    });
    await userEvent.click(within(screen.getByRole("navigation", { name: "Resume sections" })).getByText("Skills"));

    expect(screen.getByRole("button", { name: "Clear" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("dialog", { name: "Clear Skills?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear section" }));

    expect(useBuilderStore.getState().sections.skills).toBeUndefined();
    expect(useBuilderStore.getState().sectionStatus.skills).toBe("not_started");
    expect(useBuilderStore.getState().sections.summary).toBe("Backend engineer.");
    expect(useBuilderStore.getState().basicInfo.name).toBe("Jamie");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
  });

  it("cancelling the Clear confirmation leaves the section intact", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() => useBuilderStore.getState().setSkills(["TypeScript"]));
    await userEvent.click(within(screen.getByRole("navigation", { name: "Resume sections" })).getByText("Skills"));

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(useBuilderStore.getState().sections.skills).toEqual(["TypeScript"]);
  });

  it("toasts when a saved copy is present but unreadable", async () => {
    localStorage.setItem("resumeData", "{not valid json");
    render(<BuilderShell />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/Couldn't restore the saved resume/);
  });

  it("selects a gallery template from ?template= after hydrating", async () => {
    window.history.replaceState({}, "", "/builder?template=bre-creative");
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(useBuilderStore.getState().templateId).toBe("bre-creative");
  });

  it("lets a gallery pick override the template on a saved resume", async () => {
    saveResumeData(makeFullResumeData({ templateId: "jakes-resume" }));
    window.history.replaceState({}, "", "/builder?template=deedy-reversed");
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(useBuilderStore.getState().templateId).toBe("deedy-reversed");
    expect(useBuilderStore.getState().basicInfo.name).toBe("Alexandra Montgomery-Whitfield");
  });

  it("ignores an unknown ?template=", async () => {
    window.history.replaceState({}, "", "/builder?template=not-a-theme");
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(useBuilderStore.getState().templateId).toBe("jakes-resume");
  });

  it("writes a draft on Basic info Next without asking to save", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() =>
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Save & Next" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Summary", level: 2 })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("resumeData")!).basicInfo.name).toBe("Jamie");
    expect(useBuilderStore.getState().hasSavedCopy).toBe(true);
  });

  it("updates the saved draft on later Next clicks", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() =>
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Save & Next" }));
    act(() => useBuilderStore.getState().setSummary("Backend engineer."));
    await userEvent.click(screen.getByRole("button", { name: "Save & Next" }));

    expect(JSON.parse(localStorage.getItem("resumeData")!).sections.summary).toBe("Backend engineer.");
    expect(screen.getByRole("heading", { name: "Photo" })).toBeInTheDocument();
  });

  it("toasts when Next cannot write to this device, then still advances", async () => {
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() =>
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Save & Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Storage may be full/);
    expect(screen.getByRole("heading", { name: "Summary", level: 2 })).toBeInTheDocument();
    spy.mockRestore();
  });

  it("toasts on download when required basic info is missing", async () => {
    (window.print as jest.Mock).mockClear();
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() => useBuilderStore.getState().setSkills(["TypeScript"]));
    await userEvent.click(nav().getByText("Preview & download"));
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Fill in your name, email, and location in Basic info before downloading.",
    );
    expect(window.print).not.toHaveBeenCalled();
  });

  it("saves a copy on download without asking, even if Next was skipped", async () => {
    (window.print as jest.Mock).mockClear();
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() =>
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }),
    );
    await userEvent.click(nav().getByText("Preview & download"));
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("resumeData")!).basicInfo.name).toBe("Jamie");
    expect(useBuilderStore.getState().hasSavedCopy).toBe(true);
    expect(window.print).toHaveBeenCalledTimes(1);
  });
});

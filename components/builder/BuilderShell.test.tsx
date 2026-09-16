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

describe("BuilderShell", () => {
  it("opens on Basic info with every section listed, no persona gate", async () => {
    render(<BuilderShell />);
    expect(await screen.findByRole("heading", { name: "Basic info" })).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Internships")).toBeInTheDocument();
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
    await userEvent.click(screen.getByText("Skills"));
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
      await userEvent.click(screen.getByText(navLabel));
      expect(screen.getByText(help)).toBeInTheDocument();
    }
  });

  it("blocks Next on Basic info until name, email, and location are filled", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByText("Fill in your name, email, and location to continue.")).toBeInTheDocument();

    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Photo" })).toBeInTheDocument();
  });

  it("blocks Next on a content section until it's filled in or skipped, and lets Skip past it regardless", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    await userEvent.click(screen.getByText("Skills", { exact: true }));

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    // Skip works even though the section is unresolved — that's its purpose.
    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(useBuilderStore.getState().sectionStatus.skills).toBe("skipped");
    expect(screen.getByRole("heading", { name: "Certifications" })).toBeInTheDocument();

    // Back on a now-skipped section, Next is unblocked.
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("walks basicInfo -> photo -> summary via the Next/Back footer buttons", async () => {
    render(<BuilderShell />);
    expect(await screen.findByRole("heading", { name: "Basic info" })).toBeInTheDocument();
    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }));

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Photo" })).toBeInTheDocument();
    expect(screen.getByText("No photo")).toBeInTheDocument();

    // Photo is optional, so Next works immediately with nothing uploaded.
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Summary" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Photo" })).toBeInTheDocument();
  });

  it("scrolls the form pane to the top when Next opens the next section", async () => {
    const { container } = render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }));

    const main = container.querySelector("main")!;
    main.scrollTop = 480;
    expect(main.scrollTop).toBe(480);

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Photo" })).toBeInTheDocument();
    expect(main.scrollTop).toBe(0);
  });

  it("Skip on the Photo step clears any photo and advances to the next step", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() => useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin, TX" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" })); // basicInfo -> photo
    act(() => useBuilderStore.getState().setPhoto("data:image/jpeg;base64,abc123"));

    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(useBuilderStore.getState().photo).toBeNull();
    expect(screen.getByRole("heading", { name: "Summary" })).toBeInTheDocument();
  });

  it("renders the export step full-width with only the section nav aside (no separate preview aside)", async () => {
    const { container } = render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    act(() => useBuilderStore.getState().setSkills(["TypeScript"]));
    await userEvent.click(screen.getByText("Template & export"));

    expect(screen.getByRole("heading", { name: "Template & export" })).toBeInTheDocument();
    expect(screen.getByText("Save this resume on this device so you can pick it up again later?")).toBeInTheDocument();
    expect(container.querySelectorAll("aside")).toHaveLength(1);
    expect(container.querySelector("main")!.className).toContain("print-unclip");
    expect(container.querySelector("main")!.className).toContain("overflow-y-auto");
    // Nested preview scroll is for the side column only — on this step the
    // main pane is the scroller, or the wheel over the resume goes nowhere.
    expect(container.querySelector("main")!.querySelector(".overflow-y-auto")).toBeNull();
  });

  it("keeps the side-by-side preview aside to desktop, with no mobile view of its own", async () => {
    const { container } = render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });

    const asides = container.querySelectorAll("aside");
    const previewAside = asides[asides.length - 1];
    expect(previewAside.className).toContain("hidden");
    expect(previewAside.className).toContain("md:flex");
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

    const previewAside = container.querySelectorAll("aside")[container.querySelectorAll("aside").length - 1];
    expect(previewAside.className).toContain("md:overflow-hidden");
    expect(previewAside.querySelector(".overflow-y-auto")).not.toBeNull();
  });

  it("sends the pinned mobile button to the export step, and drops it once there", async () => {
    const { container } = render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });

    const button = screen.getByRole("button", { name: "Preview resume" });
    expect(button.className).toContain("fixed");
    expect(button.className).toContain("md:hidden");
    expect(container.querySelector("main")!.contains(button)).toBe(false);

    await userEvent.click(button);

    expect(screen.getByRole("heading", { name: "Template & export" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preview resume" })).not.toBeInTheDocument();
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
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Photo" })).toBeInTheDocument();
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
});

import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCoverLetterStore } from "@/lib/coverLetterStore";
import { useBuilderStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";
import { CoverLetterNav } from "./CoverLetterNav";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
    useCoverLetterStore.getState().resetStore();
    useToastStore.getState().clear();
  });
});

const order = () => useCoverLetterStore.getState().letter.paragraphs.map((p) => p.id);
const toasts = () => useToastStore.getState().toasts.map((t) => t.message);

function renderNav(props: Partial<Parameters<typeof CoverLetterNav>[0]> = {}) {
  const onSelect = jest.fn();
  const onAddParagraph = jest.fn();
  render(<CoverLetterNav active="recipient" onSelect={onSelect} onAddParagraph={onAddParagraph} {...props} />);
  return { onSelect, onAddParagraph, nav: within(screen.getByRole("navigation", { name: "Cover letter sections" })) };
}

describe("CoverLetterNav", () => {
  it("marks the current step and selects another on click", async () => {
    const { nav, onSelect } = renderNav();
    expect(nav.getByRole("button", { name: "Recipient" })).toHaveAttribute("aria-current", "step");
    await userEvent.click(nav.getByRole("button", { name: "Closing" }));
    expect(onSelect).toHaveBeenCalledWith("closing");
    await userEvent.click(nav.getByRole("button", { name: "Download" }));
    expect(onSelect).toHaveBeenCalledWith("export");
  });

  it("says whether Your details is done", () => {
    const { nav } = renderNav();
    expect(nav.getByText("Required")).toBeInTheDocument();
  });

  it("switches a paragraph off and on", async () => {
    const { nav } = renderNav();
    await userEvent.click(nav.getByRole("switch", { name: "Skip Achievements" }));
    expect(useCoverLetterStore.getState().letter.paragraphs.find((p) => p.id === "achievements")?.skipped).toBe(true);
    await userEvent.click(nav.getByRole("switch", { name: "Include Achievements" }));
    expect(useCoverLetterStore.getState().letter.paragraphs.find((p) => p.id === "achievements")?.skipped).toBe(false);
  });

  it("reorders with the arrow keys on the grip and confirms with a toast", async () => {
    const { nav } = renderNav();
    nav.getByRole("button", { name: "Reorder Achievements" }).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(order()).toEqual(["opening", "interest", "achievements", "skills", "fit"]);
    expect(toasts()).toContain("Achievements moved below Why you're interested");

    nav.getByRole("button", { name: "Reorder Opening" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    nav.getByRole("button", { name: "Reorder Opening" }).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(order()[0]).toBe("opening");
    expect(toasts()).toContain("Opening moved to the top");
  });

  it("says nothing when a move goes nowhere, and a skipped paragraph can't be picked up", async () => {
    const { nav } = renderNav();
    nav.getByRole("button", { name: "Reorder Opening" }).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(toasts()).toEqual([]);

    act(() => useCoverLetterStore.getState().toggleSkipParagraph("fit"));
    expect(nav.getByRole("button", { name: "Why you're a good fit is skipped and cannot be reordered" })).toBeDisabled();
  });

  it("lists custom paragraphs by name and asks for a new one", async () => {
    act(() => {
      const id = useCoverLetterStore.getState().addParagraph();
      useCoverLetterStore.getState().renameParagraph(id, "Referral");
    });
    const { nav, onAddParagraph } = renderNav();
    expect(nav.getByRole("button", { name: "Referral" })).toBeInTheDocument();
    await userEvent.click(nav.getByRole("button", { name: /Add paragraph/ }));
    expect(onAddParagraph).toHaveBeenCalledTimes(1);
  });
});

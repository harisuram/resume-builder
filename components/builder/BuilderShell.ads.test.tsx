import { renderToString } from "react-dom/server";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dismissBuilderTour } from "@/lib/builderTour";
import { useBuilderStore } from "@/lib/store";
import { BuilderShell } from "./BuilderShell";

jest.mock("../ads/AdSlot", () => ({
  AdSlot: ({ name, className, request = true }: { name?: string; className?: string; request?: boolean }) => (
    <div data-ad-class={className} data-ad-request={String(request)}>
      {name}
    </div>
  ),
}));

beforeEach(() => {
  localStorage.clear();
  dismissBuilderTour();
  useBuilderStore.getState().resetStore();
});

/* AdSense restricts ads on form-only screens and next to controls people
 * tap, so the builder keeps one unit per layout, away from inputs, the step
 * buttons, and Download. */
describe("BuilderShell ads", () => {
  it("shows only the preview units on a form step — none in the nav or under the step buttons", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    const previewTop = screen.getByText("Builder preview top");
    const preview = screen.getByText("Builder preview");
    expect(previewTop).toHaveAttribute("data-ad-class", expect.stringContaining("max-lg:hidden"));
    expect(previewTop).toHaveAttribute("data-ad-class", expect.stringContaining("mb-[150px]"));
    expect(preview).toHaveAttribute("data-ad-class", expect.stringContaining("mt-[150px]"));
    expect(preview).toHaveAttribute("data-ad-class", expect.stringContaining("md:hidden"));
    expect(screen.queryByText("Builder nav")).not.toBeInTheDocument();
    expect(screen.queryByText(/Section footer/)).not.toBeInTheDocument();
    // Download's slot is in this first screen so AdsBot can see it, collapsed
    // and not requested. The serving copy mounts on the Download step.
    const crawl = screen.getByText("Export page");
    expect(crawl).toHaveAttribute("data-ad-request", "false");
    expect(crawl.getAttribute("data-ad-class")).not.toMatch(/hidden/);
  });

  it("keeps every builder slot in the pre-hydrate HTML Google's crawler fetches", () => {
    const html = renderToString(<BuilderShell />);
    expect(html).toContain("Basic info");
    expect(html).toContain("Builder preview top");
    expect(html).toContain("Builder preview");
    expect(html).toContain("Export page");
    expect(html).toContain('data-ad-request="false"');
  });

  it("shows a single unit on export, placed after the preview rather than by Download", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    await userEvent.click(within(screen.getByRole("navigation", { name: "Resume sections" })).getByText("Download"));

    expect(screen.queryByText("Builder preview top")).not.toBeInTheDocument();
    expect(screen.queryByText("Builder preview")).not.toBeInTheDocument();
    const ad = screen.getByText("Export page");
    expect(ad).toHaveAttribute("data-ad-request", "true");
    const heading = screen.getByRole("heading", { name: "Preview & download" });
    expect(heading.compareDocumentPosition(ad) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(ad.previousElementSibling).not.toBeNull();
  });
});

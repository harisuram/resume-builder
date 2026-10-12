import { renderToString } from "react-dom/server";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCoverLetterStore } from "@/lib/coverLetterStore";
import { useBuilderStore } from "@/lib/store";
import { CoverLetterShell } from "./CoverLetterShell";

jest.mock("../ads/AdSlot", () => ({
  AdSlot: ({ name, className, request = true }: { name?: string; className?: string; request?: boolean }) => (
    <div data-ad-class={className} data-ad-request={String(request)}>
      {name}
    </div>
  ),
}));

jest.mock("../pdf/renderResumePdf", () => ({
  renderResumePdf: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  useBuilderStore.getState().resetStore();
  useCoverLetterStore.getState().resetStore();
});

describe("CoverLetterShell ads", () => {
  it("puts the download slot in the first screen without requesting it", async () => {
    render(<CoverLetterShell />);
    await screen.findByRole("navigation", { name: "Cover letter sections" });
    const crawl = screen.getByText("Cover letter download");
    expect(crawl).toHaveAttribute("data-ad-request", "false");
    expect(crawl.getAttribute("data-ad-class")).not.toMatch(/hidden/);
    expect(screen.getByText("Cover letter builder")).toHaveAttribute("data-ad-class", expect.stringContaining("md:hidden"));
    expect(screen.getByText("Cover letter preview top")).toHaveAttribute(
      "data-ad-class",
      expect.stringContaining("max-lg:hidden"),
    );
  });

  it("keeps every cover-letter builder slot in the pre-hydrate HTML", () => {
    const html = renderToString(<CoverLetterShell />);
    expect(html).toContain("Cover letter builder");
    expect(html).toContain("Cover letter preview top");
    expect(html).toContain("Cover letter download");
    expect(html).toContain('data-ad-request="false"');
  });

  it("serves only the download unit once that step is open", async () => {
    render(<CoverLetterShell />);
    await screen.findByRole("navigation", { name: "Cover letter sections" });
    await userEvent.click(within(screen.getByRole("navigation", { name: "Cover letter sections" })).getByText("Download"));

    expect(screen.queryByText("Cover letter builder")).not.toBeInTheDocument();
    expect(screen.queryByText("Cover letter preview top")).not.toBeInTheDocument();
    expect(screen.getByText("Cover letter download")).toHaveAttribute("data-ad-request", "true");
  });
});

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TemplatesPage from "./page";
import { TEMPLATES } from "@/components/templates/shared/theme";

describe("templates gallery", () => {
  it("shows the live template count in the lead, the tally, and every layout filter", () => {
    render(<TemplatesPage />);
    expect(screen.getByText(new RegExp(`^${TEMPLATES.length} free resume templates`))).toBeInTheDocument();
    expect(screen.getByText(`${TEMPLATES.length} templates`)).toBeInTheDocument();
    const filters = screen.getByRole("group", { name: "Filter by layout" });
    const byLayout = (layout: string) => TEMPLATES.filter((t) => t.layout === layout).length;
    expect(within(filters).getByRole("button", { name: `All, ${TEMPLATES.length} templates` })).toBeInTheDocument();
    expect(
      within(filters).getByRole("button", { name: `Single column, ${byLayout("single")} templates` }),
    ).toBeInTheDocument();
    expect(within(filters).getByRole("button", { name: `Sidebar, ${byLayout("sidebar")} templates` })).toBeInTheDocument();
    expect(
      within(filters).getByRole("button", { name: `Two column, ${byLayout("asymmetric")} templates` }),
    ).toBeInTheDocument();
    expect(within(filters).getByRole("button", { name: `Labeled, ${byLayout("labeled")} templates` })).toBeInTheDocument();
  });

  it("shows the new two-tone templates under their layout filters", async () => {
    render(<TemplatesPage />);
    const filters = screen.getByRole("group", { name: "Filter by layout" });
    await userEvent.click(within(filters).getByRole("button", { name: /^Sidebar,/ }));
    for (const name of ["Tidewater", "Evergreen", "Plum", "Lagoon"]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("heading", { name: "Oxford" })).not.toBeInTheDocument();

    await userEvent.click(within(filters).getByRole("button", { name: /^Single column,/ }));
    for (const name of ["Oxford", "Laurel", "Regent", "Mulberry"]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("heading", { name: "Tidewater" })).not.toBeInTheDocument();
  });

  it("lists every template as a link into the builder with that layout", () => {
    render(<TemplatesPage />);
    expect(screen.getByRole("heading", { level: 1, name: /free resume templates/i })).toBeInTheDocument();
    for (const template of TEMPLATES) {
      expect(screen.getByRole("heading", { name: template.name })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: `Use ${template.name} template` })).toHaveAttribute(
        "href",
        `/builder?template=${encodeURIComponent(template.id)}`,
      );
    }
    expect(document.querySelector('[data-sample-resume="atlas"]')).not.toBeNull();
    expect(document.querySelector('[data-template-skeleton]')).toBeNull();
    expect(document.querySelector('[data-layout="single"]')).not.toBeNull();
    expect(screen.getByText(/use template to open it in the builder/i)).toBeInTheDocument();
  });

  /* The card used to be one big link, so anywhere you tapped sent you to the
   * builder. Only the button does that now. */
  it("navigates from the Use template button and nowhere else on the card", () => {
    render(<TemplatesPage />);
    const card = screen.getByRole("heading", { name: "Atlas" }).closest("article") as HTMLElement;

    const links = within(card).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent("Use template");
    expect(links[0]).toHaveAccessibleName("Use Atlas template");

    // The sheet is a preview trigger, not a second way into the builder.
    expect(within(card).getByRole("button", { name: "Preview Atlas layout" })).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );
  });

  /* The label sat on a white pill in --color-ink, which is near-white on the
   * dark theme — the button read as blank. */
  it("paints the Use template label against the button's own background", () => {
    render(<TemplatesPage />);
    const cta = screen.getByRole("link", { name: "Use Atlas template" });
    expect(cta).toHaveClass("bg-[var(--color-accent)]", "text-[var(--color-accent-ink)]");
    expect(cta.className).not.toMatch(/bg-white/);
  });

  it("opens a sample-text preview of the layout and sends that template to the builder", async () => {
    render(<TemplatesPage />);
    await userEvent.click(screen.getByRole("button", { name: "Preview Atlas layout" }));

    const dialog = screen.getByRole("dialog", { name: "Atlas" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Classic engineering column")).toBeInTheDocument();
    expect(within(dialog).getByText("Alexandra Montgomery-Whitfield")).toBeInTheDocument();
    expect(within(dialog).getByText("Summary")).toBeInTheDocument();
    expect(within(dialog).getByText("Experience")).toBeInTheDocument();
    expect(within(dialog).getByText("Education")).toBeInTheDocument();
    expect(within(dialog).getByText("Skills")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Use this template" })).toHaveAttribute(
      "href",
      "/builder?template=atlas",
    );

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("previews a sidebar template with the rail split", async () => {
    render(<TemplatesPage />);
    await userEvent.click(screen.getByRole("button", { name: "Preview Ember layout" }));
    const dialog = screen.getByRole("dialog", { name: "Ember" });
    expect(dialog.querySelector('[data-layout="sidebar"]')).not.toBeNull();
    expect(dialog.querySelector('[data-resume-column="rail"]')).not.toBeNull();
    expect(within(dialog).getByRole("link", { name: "Use this template" })).toHaveAttribute(
      "href",
      "/builder?template=ember",
    );
  });

  it("filters the gallery by layout family", async () => {
    render(<TemplatesPage />);
    await userEvent.click(screen.getByRole("button", { name: /sidebar/i }));

    expect(screen.getByRole("heading", { name: "Ember" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Atlas" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sidebar/i })).toHaveAttribute("aria-pressed", "true");
  });
});

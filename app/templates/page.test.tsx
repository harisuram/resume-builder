import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TemplatesPage from "./page";
import { TEMPLATES } from "@/components/templates/shared/theme";

describe("templates gallery", () => {
  it("lists every template name as a selectable layout preview", () => {
    render(<TemplatesPage />);
    expect(screen.getByRole("heading", { level: 1, name: /free resume templates/i })).toBeInTheDocument();
    for (const template of TEMPLATES) {
      expect(screen.getByRole("heading", { name: template.name })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: `Select ${template.name} template` })).toBeInTheDocument();
    }
    expect(document.querySelector('[data-sample-resume="jakes-resume"]')).not.toBeNull();
    expect(document.querySelector('[data-template-skeleton]')).toBeNull();
    expect(document.querySelector('[data-layout="single"]')).not.toBeNull();
    expect(screen.getByText(/select a template to continue building/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /continue with/i })).not.toBeInTheDocument();
  });

  it("selects a template and continues into the builder with that layout", async () => {
    render(<TemplatesPage />);
    await userEvent.click(screen.getByRole("button", { name: "Select Atlas template" }));

    expect(screen.getByRole("button", { name: "Select Atlas template" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: /continue with atlas/i })).toHaveAttribute(
      "href",
      "/builder?template=jakes-resume",
    );
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
      "/builder?template=jakes-resume",
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
      "/builder?template=bre-creative",
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

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TEMPLATE_LIST } from "@/components/templates/registry";
import { TemplateRail } from "./TemplateRail";

describe("TemplateRail", () => {
  it("lists every template, including the two-tone additions", () => {
    render(<TemplateRail value="jakes-resume" onChange={() => {}} />);
    const list = screen.getByRole("list", { name: "Templates" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(TEMPLATE_LIST.length);
    for (const name of ["Tidewater", "Evergreen", "Plum", "Lagoon", "Oxford", "Laurel", "Regent", "Mulberry"]) {
      expect(within(list).getByRole("button", { name: `Use ${name} template` })).toBeInTheDocument();
    }
  });

  it("titles the rail and marks only the current template as pressed", () => {
    render(<TemplateRail value="oxford" onChange={() => {}} />);
    expect(screen.getByRole("heading", { name: "Choose a template" })).toBeInTheDocument();
    const pressed = screen.getAllByRole("button", { pressed: true });
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveAccessibleName("Use Oxford template");
  });

  it("reports the clicked template", async () => {
    const onChange = jest.fn();
    render(<TemplateRail value="jakes-resume" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Use Regent template" }));
    expect(onChange).toHaveBeenCalledWith("regent");
  });

  it("keeps the thumbnails out of the tab order and print", () => {
    const { container } = render(<TemplateRail value="jakes-resume" onChange={() => {}} />);
    expect(container.firstElementChild).toHaveClass("no-print");
    for (const preview of container.querySelectorAll("[data-sample-resume]")) {
      expect(preview.closest("[inert]")).not.toBeNull();
    }
  });
});

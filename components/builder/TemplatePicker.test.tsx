import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TEMPLATE_LIST } from "@/components/templates/registry";
import { TemplatePicker } from "./TemplatePicker";

describe("TemplatePicker", () => {
  it("shows the current template name on a Template-labeled control, not a native select", () => {
    render(<TemplatePicker value="jakes-resume" onChange={jest.fn()} />);
    const trigger = screen.getByRole("button", { name: "Choose a template" });
    expect(trigger).toHaveTextContent("Template");
    expect(trigger).toHaveTextContent("Atlas");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens a list of every template and reports the one that was chosen", async () => {
    const onChange = jest.fn();
    render(<TemplatePicker value="jakes-resume" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    expect(screen.getByRole("listbox", { name: "Templates" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(TEMPLATE_LIST.length);

    await userEvent.click(screen.getByRole("option", { name: "Ember" }));
    expect(onChange).toHaveBeenCalledWith("bre-creative");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("lists only template names, in a panel as wide as the trigger", async () => {
    const { container } = render(<TemplatePicker value="jakes-resume" onChange={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    expect(screen.queryByText("Warm coral sidebar")).not.toBeInTheDocument();
    const list = screen.getByRole("listbox", { name: "Templates" });
    expect(list.className).toContain("inset-x-0");
    expect(container.firstElementChild?.className).toContain("w-[12.5rem]");
  });

  it("closes on Escape without changing the selection", async () => {
    const onChange = jest.fn();
    render(<TemplatePicker value="jakes-resume" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

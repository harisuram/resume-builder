import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TEMPLATE_LIST } from "@/components/templates/registry";
import { TemplatePicker } from "./TemplatePicker";

describe("TemplatePicker", () => {
  it("shows the current template name on a Template-labeled control, not a native select", () => {
    render(<TemplatePicker value="atlas" onChange={jest.fn()} />);
    const trigger = screen.getByRole("button", { name: "Choose a template" });
    expect(trigger).toHaveTextContent("Template");
    expect(trigger).toHaveTextContent("Atlas");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens a list of every template and reports the one that was chosen", async () => {
    const onChange = jest.fn();
    render(<TemplatePicker value="atlas" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    expect(screen.getByRole("listbox", { name: "Templates" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(TEMPLATE_LIST.length);

    await userEvent.click(screen.getByRole("option", { name: "Ember" }));
    expect(onChange).toHaveBeenCalledWith("ember");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("lists only template names, in a full-width panel", async () => {
    const { container } = render(<TemplatePicker value="atlas" onChange={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    expect(screen.queryByText("Warm coral sidebar")).not.toBeInTheDocument();
    const list = screen.getByRole("listbox", { name: "Templates" });
    expect(list.className).toContain("inset-x-0");
    expect(list.className).toContain("list-none");
    expect(container.firstElementChild?.className).toContain("w-full");
    expect(container.firstElementChild?.className).not.toContain("w-[12.5rem]");
    expect(list.querySelector("[class*='rounded-full']")).toBeNull();
  });

  it("relabels the trigger when the empty-preview callout is on", () => {
    render(<TemplatePicker value="atlas" onChange={jest.fn()} emphasized />);
    const trigger = screen.getByRole("button", { name: "Choose a template" });
    expect(trigger).toHaveTextContent("Change template");
    expect(trigger).toHaveTextContent("Atlas");
  });

  it("closes on Escape without changing the selection", async () => {
    const onChange = jest.fn();
    render(<TemplatePicker value="atlas" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Choose a template" })).toHaveFocus();
  });

  it("focuses the selected template and scrolls it into view when the list opens", async () => {
    const offsetTop = jest.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      return this.tagName === "LI" ? 480 : 0;
    });
    const offsetHeight = jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(40);
    const clientHeight = jest.spyOn(HTMLUListElement.prototype, "clientHeight", "get").mockReturnValue(200);

    render(<TemplatePicker value="nova" onChange={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));

    const list = screen.getByRole("listbox", { name: "Templates" });
    const selected = screen.getByRole("option", { name: "Nova" });
    expect(selected).toHaveAttribute("aria-selected", "true");
    expect(selected).toHaveFocus();
    expect(list.scrollTop).toBe(400);

    offsetTop.mockRestore();
    offsetHeight.mockRestore();
    clientHeight.mockRestore();
  });

  it("keeps the newly chosen template focused the next time the list opens", async () => {
    function Harness() {
      const [value, setValue] = useState("atlas");
      return <TemplatePicker value={value} onChange={setValue} />;
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    await userEvent.click(screen.getByRole("option", { name: "Ember" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    const selected = screen.getByRole("option", { name: "Ember" });
    expect(selected).toHaveAttribute("aria-selected", "true");
    expect(selected).toHaveFocus();
  });
});

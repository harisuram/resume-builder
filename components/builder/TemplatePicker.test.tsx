import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
    const panel = list.closest("[data-template-picker-panel]")!;
    expect(panel.className).toContain("inset-x-0");
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

  it("focuses the search box and scrolls the selected template into view when the list opens", async () => {
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
    expect(screen.getByRole("searchbox", { name: "Search templates" })).toHaveFocus();
    expect(list.scrollTop).toBe(400);

    offsetTop.mockRestore();
    offsetHeight.mockRestore();
    clientHeight.mockRestore();
  });

  it("keeps the newly chosen template selected the next time the list opens", async () => {
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
  });
});

describe("TemplatePicker search", () => {
  async function openPicker(onChange = jest.fn()) {
    render(<TemplatePicker value="atlas" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    return { onChange, search: screen.getByRole("searchbox", { name: "Search templates" }) };
  }

  it("filters by name as you type", async () => {
    const { search } = await openPicker();
    await userEvent.type(search, "nov");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Nova"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 template found");
  });

  it("matches descriptions and layouts too, every word counting", async () => {
    const { search } = await openPicker();
    await userEvent.type(search, "sidebar");
    const names = screen.getAllByRole("option").map((o) => o.textContent);
    expect(names).toEqual(TEMPLATE_LIST.filter((t) => t.layout === "sidebar" || /sidebar/i.test(t.description)).map((t) => t.name));
    await userEvent.clear(search);
    // Words can match anywhere, in any order, ignoring case and spacing.
    await userEvent.type(search, "  GOLD   band ");
    expect(screen.getAllByRole("option").map((o) => o.textContent).sort()).toEqual(["Marquee", "Pivot", "Regent"]);
  });

  it("says so when nothing matches, and Clear brings the list back", async () => {
    const { search } = await openPicker();
    await userEvent.type(search, "zzzz");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText(/No templates match “zzzz”/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getAllByRole("option")).toHaveLength(TEMPLATE_LIST.length);
    expect(search).toHaveFocus();
  });

  it("chooses the only match on Enter", async () => {
    const { search, onChange } = await openPicker();
    await userEvent.type(search, "tessera{Enter}");
    expect(onChange).toHaveBeenCalledWith("tessera");
  });

  it("moves between the search box and the options with the arrow keys", async () => {
    const { search } = await openPicker();
    await userEvent.type(search, "o");
    await userEvent.keyboard("{ArrowDown}");
    const first = screen.getAllByRole("option")[0];
    expect(first).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("option")[1]).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(search).toHaveFocus();
  });

  it("clears the search on the first Escape and closes on the second", async () => {
    const { search } = await openPicker();
    await userEvent.type(search, "nova");
    await userEvent.keyboard("{Escape}");
    expect(search).toHaveValue("");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("animates out, hidden from assistive tech, then unmounts and forgets the search", async () => {
    const { search } = await openPicker();
    await userEvent.type(search, "nova");
    const panel = document.querySelector("[data-template-picker-panel]")!;
    expect(panel).toHaveAttribute("data-state", "open");
    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    expect(panel).toHaveAttribute("data-state", "closed");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    await waitFor(() => expect(document.querySelector("[data-template-picker-panel]")).toBeNull());
    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    expect(screen.getByRole("searchbox", { name: "Search templates" })).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(TEMPLATE_LIST.length);
  });
});

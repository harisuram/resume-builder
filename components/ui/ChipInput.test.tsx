import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ChipInput } from "./ChipInput";

function Controlled({ initial = [] as string[], suggestions }: { initial?: string[]; suggestions?: string[] }) {
  const [values, setValues] = useState<string[]>(initial);
  return (
    <ChipInput
      values={values}
      onChange={setValues}
      placeholder="Add a skill, press Enter"
      suggestions={suggestions}
    />
  );
}

describe("ChipInput", () => {
  it("adds a chip on Enter and clears the draft", async () => {
    render(<Controlled />);
    const input = screen.getByPlaceholderText("Add a skill, press Enter");
    await userEvent.type(input, "TypeScript{Enter}");
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("adds a chip on comma", async () => {
    render(<Controlled />);
    const input = screen.getByPlaceholderText("Add a skill, press Enter");
    await userEvent.type(input, "React,");
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("does not add a duplicate chip", async () => {
    render(<Controlled initial={["TypeScript"]} />);
    const input = screen.getByPlaceholderText("Add a skill, press Enter");
    await userEvent.type(input, "TypeScript{Enter}");
    expect(screen.getAllByText("TypeScript")).toHaveLength(1);
  });

  it("does not add an empty chip", async () => {
    render(<Controlled />);
    const input = screen.getByPlaceholderText("Add a skill, press Enter");
    await userEvent.type(input, "   {Enter}");
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  it("removes a chip via its remove button", async () => {
    render(<Controlled initial={["TypeScript", "React"]} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove TypeScript" }));
    expect(screen.queryByText("TypeScript")).not.toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("removes the last chip on Backspace when the draft is empty", async () => {
    render(<Controlled initial={["TypeScript", "React"]} />);
    const input = screen.getByPlaceholderText("Add a skill, press Enter");
    await userEvent.click(input);
    await userEvent.keyboard("{Backspace}");
    expect(screen.queryByText("React")).not.toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("commits the draft on blur", async () => {
    render(<Controlled />);
    const input = screen.getByPlaceholderText("Add a skill, press Enter");
    await userEvent.type(input, "Go");
    await userEvent.tab();
    expect(screen.getByText("Go")).toBeInTheDocument();
  });

  it("shows an error instead of adding a duplicate chip", async () => {
    render(<Controlled initial={["TypeScript"]} />);
    const input = screen.getByPlaceholderText("Add a skill, press Enter");
    await userEvent.type(input, "TypeScript{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("already on the list");
    expect(screen.getAllByText("TypeScript")).toHaveLength(1);
  });

  describe("suggestions", () => {
    const catalog = ["TypeScript", "Python", "React"];

    it("lists unselected suggestions on focus and hides ones already added", async () => {
      render(<Controlled initial={["Python"]} suggestions={catalog} />);
      await userEvent.click(screen.getByPlaceholderText("Add a skill, press Enter"));
      expect(screen.getByRole("option", { name: "TypeScript" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "React" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Python" })).not.toBeInTheDocument();
    });

    it("filters the list as the user types", async () => {
      render(<Controlled suggestions={catalog} />);
      const input = screen.getByPlaceholderText("Add a skill, press Enter");
      await userEvent.type(input, "scr");
      expect(screen.getByRole("option", { name: "TypeScript" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "React" })).not.toBeInTheDocument();
    });

    it("adds a suggestion on click", async () => {
      render(<Controlled suggestions={catalog} />);
      await userEvent.click(screen.getByPlaceholderText("Add a skill, press Enter"));
      await userEvent.click(screen.getByRole("option", { name: "React" }));
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "React" })).not.toBeInTheDocument();
    });

    it("still accepts a custom value on Enter", async () => {
      render(<Controlled suggestions={catalog} />);
      const input = screen.getByPlaceholderText("Add a skill, press Enter");
      await userEvent.type(input, "GraphQL{Enter}");
      expect(screen.getByText("GraphQL")).toBeInTheDocument();
    });
  });
});

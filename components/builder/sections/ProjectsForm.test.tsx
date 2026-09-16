import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { ProjectsForm } from "./ProjectsForm";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

describe("ProjectsForm", () => {
  it("adds a project and fills its fields", async () => {
    render(<ProjectsForm />);
    await userEvent.click(screen.getByText("+ Add project"));

    await userEvent.type(screen.getByPlaceholderText("Resume Builder"), "My Project");
    await userEvent.type(
      screen.getByPlaceholderText("What it does and what you used to build it."),
      "Does a thing.",
    );
    await userEvent.type(screen.getByPlaceholderText("github.com/you/project"), "github.com/me/project");

    const project = useBuilderStore.getState().sections.projects![0];
    expect(project.name).toBe("My Project");
    expect(project.description).toBe("Does a thing.");
    expect(project.link).toBe("github.com/me/project");
  });

  it("shows an error for a missing name after blur", async () => {
    render(<ProjectsForm />);
    await userEvent.click(screen.getByText("+ Add project"));
    await userEvent.click(screen.getByPlaceholderText("Resume Builder"));
    await userEvent.tab();
    expect(screen.getByText("Enter the project name.")).toBeInTheDocument();
  });

  it("flags a project link that is not a URL", async () => {
    act(() => useBuilderStore.getState().addListItem("projects", { name: "P", description: "D", link: "not a url" }));
    render(<ProjectsForm />);
    await userEvent.click(screen.getByPlaceholderText("github.com/you/project"));
    await userEvent.tab();
    expect(screen.getByText(/Enter a valid project link/)).toBeInTheDocument();
  });

  it("adds technologies via the chip input", async () => {
    act(() => useBuilderStore.getState().addListItem("projects", { name: "P", description: "D" }));
    render(<ProjectsForm />);
    const techInput = screen.getByPlaceholderText("Add a technology, press Enter");
    await userEvent.type(techInput, "React{Enter}");
    expect(useBuilderStore.getState().sections.projects![0].technologies).toEqual(["React"]);
  });

  it("removes a project", async () => {
    act(() => useBuilderStore.getState().addListItem("projects", { name: "P", description: "D" }));
    render(<ProjectsForm />);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(useBuilderStore.getState().sections.projects).toEqual([]);
  });

  it("shows a skipped notice when skipped", () => {
    act(() => useBuilderStore.getState().toggleSkipSection("projects"));
    render(<ProjectsForm />);
    expect(screen.getByText(/Projects is skipped/)).toBeInTheDocument();
  });
});

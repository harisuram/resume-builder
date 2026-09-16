import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { BuilderShell } from "./BuilderShell";

jest.mock("../ads/AdSlot", () => ({
  AdSlot: ({ name }: { name?: string }) => <div>{name}</div>,
}));

beforeEach(() => {
  localStorage.clear();
  useBuilderStore.getState().resetStore();
});

describe("BuilderShell section-footer ads", () => {
  it("shows a preview-column ad above the live résumé, except on export", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(screen.getByText("Builder nav")).toBeInTheDocument();
    expect(screen.getByText("Builder preview top")).toBeInTheDocument();
    expect(screen.getAllByText("Builder preview").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByText("Template & export"));
    expect(screen.queryByText("Builder preview top")).not.toBeInTheDocument();
    expect(screen.getByText("Builder preview")).toBeInTheDocument();
  });

  it("shows the footer ad on the new optional sections, and not on Basic info", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(screen.queryByText(/Section footer —/)).not.toBeInTheDocument();

    const steps: [string, string][] = [
      ["Certifications", "Section footer — certifications"],
      ["Patents", "Section footer — patents"],
      ["Languages", "Section footer — languages"],
      ["Hobbies", "Section footer — hobbies"],
      ["Soft skills", "Section footer — softSkills"],
      ["Additional", "Section footer — additional"],
    ];
    for (const [nav, name] of steps) {
      await userEvent.click(screen.getByText(nav));
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });
});

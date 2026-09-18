import { renderToString } from "react-dom/server";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dismissBuilderTour } from "@/lib/builderTour";
import { useBuilderStore } from "@/lib/store";
import { BuilderShell } from "./BuilderShell";

jest.mock("../ads/AdSlot", () => ({
  AdSlot: ({ name }: { name?: string }) => <div>{name}</div>,
}));

beforeEach(() => {
  localStorage.clear();
  dismissBuilderTour();
  useBuilderStore.getState().resetStore();
});

describe("BuilderShell section-footer ads", () => {
  it("puts every builder ad unit in the first view so AdsBot does not have to click the wizard", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(screen.getByText("Builder nav")).toBeInTheDocument();
    expect(screen.getByText("Builder preview top")).toBeInTheDocument();
    expect(screen.getAllByText("Builder preview").length).toBeGreaterThan(0);
    expect(screen.getByText("Section footer — basicInfo")).toBeInTheDocument();
    expect(screen.getByText("Export page")).toBeInTheDocument();
  });

  it("keeps those units in the pre-hydrate HTML Google's crawler fetches", () => {
    const html = renderToString(<BuilderShell />);
    expect(html).toContain("data-ad-crawler");
    expect(html).toContain("Builder nav");
    expect(html).toContain("Builder preview top");
    expect(html).toContain("Builder preview");
    expect(html).toContain("Section footer");
    expect(html).toContain("Export page");
  });

  it("shows a preview-column ad above the live résumé, except on export", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(screen.getByText("Builder nav")).toBeInTheDocument();
    expect(screen.getByText("Builder preview top")).toBeInTheDocument();
    expect(screen.getAllByText("Builder preview").length).toBeGreaterThan(0);

    await userEvent.click(within(screen.getByRole("navigation", { name: "Resume sections" })).getByText("Preview & download"));
    expect(screen.queryByText("Builder preview top")).not.toBeInTheDocument();
    expect(screen.getByText("Builder preview")).toBeInTheDocument();
  });

  it("keeps the footer ad on Basic info and the optional sections", async () => {
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(screen.getByText("Section footer — basicInfo")).toBeInTheDocument();

    const steps: [string, string][] = [
      ["Certifications", "Section footer — certifications"],
      ["Patents", "Section footer — patents"],
      ["Languages", "Section footer — languages"],
      ["Hobbies", "Section footer — hobbies"],
      ["Soft skills", "Section footer — softSkills"],
      ["Additional", "Section footer — additional"],
    ];
    for (const [nav, name] of steps) {
      await userEvent.click(within(screen.getByRole("navigation", { name: "Resume sections" })).getByText(nav));
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });
});

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { Navbar } from "./Navbar";

beforeEach(() => {
  localStorage.clear();
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

describe("Navbar", () => {
  it("always shows the brand and a 'Start new resume' button", () => {
    render(<Navbar />);
    expect(screen.getByText("Letterform")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start new resume" })).toBeInTheDocument();
  });

  it("asks for confirmation and does nothing until confirmed", async () => {
    localStorage.setItem("resumeData", "{}");
    act(() => {
      useBuilderStore.getState().setHasSavedCopy(true);
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie" });
    });
    render(<Navbar />);

    await userEvent.click(screen.getByRole("button", { name: "Start new resume" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("resumeData")).toBe("{}");
    expect(useBuilderStore.getState().basicInfo.name).toBe("Jamie");
  });

  it("clears storage and resets the store on confirm", async () => {
    localStorage.setItem("resumeData", "{}");
    act(() => {
      useBuilderStore.getState().setHasSavedCopy(true);
    });
    render(<Navbar />);

    await userEvent.click(screen.getByRole("button", { name: "Start new resume" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear and start over" }));

    expect(localStorage.getItem("resumeData")).toBeNull();
    expect(useBuilderStore.getState().basicInfo).toEqual({
      name: "",
      email: "",
      phone: "",
      location: "",
      links: {},
    });
    expect(useBuilderStore.getState().hasSavedCopy).toBe(false);
    expect(screen.getByRole("button", { name: "Start new resume" })).toBeInTheDocument();
  });
});

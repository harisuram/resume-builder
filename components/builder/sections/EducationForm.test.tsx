import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { EducationForm } from "./EducationForm";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

describe("EducationForm", () => {
  it("shows a skipped notice and no fields when the section is skipped", () => {
    act(() => {
      useBuilderStore.getState().toggleSkipSection("education");
    });
    render(<EducationForm />);
    expect(screen.getByText(/Education is skipped/)).toBeInTheDocument();
    expect(screen.queryByText("+ Add education")).not.toBeInTheDocument();
  });

  it("lets Include restore a skipped section from the notice", async () => {
    act(() => useBuilderStore.getState().toggleSkipSection("education"));
    render(<EducationForm />);
    await userEvent.click(screen.getByRole("button", { name: "Include Education" }));
    expect(useBuilderStore.getState().sectionStatus.education).not.toBe("skipped");
    expect(screen.getByText("+ Add education")).toBeInTheDocument();
  });

  it("shows the fields again once un-skipped (e.g. via the section nav's switch)", () => {
    act(() => {
      useBuilderStore.getState().toggleSkipSection("education");
    });
    const { rerender } = render(<EducationForm />);
    expect(screen.queryByText("+ Add education")).not.toBeInTheDocument();

    act(() => useBuilderStore.getState().toggleSkipSection("education"));
    rerender(<EducationForm />);
    expect(useBuilderStore.getState().sectionStatus.education).not.toBe("skipped");
    expect(screen.getByText("+ Add education")).toBeInTheDocument();
  });

  it("adds an entry and lets its fields be edited", async () => {
    render(<EducationForm />);
    await userEvent.click(screen.getByText("+ Add education"));

    await userEvent.type(screen.getByPlaceholderText("University of Texas at Austin"), "MIT");
    await userEvent.type(screen.getByPlaceholderText("B.S. / B.Arch / Pharm.D."), "M.S. CS");

    const education = useBuilderStore.getState().sections.education!;
    expect(education[0].institution).toBe("MIT");
    expect(education[0].degree).toBe("M.S. CS");
    expect(useBuilderStore.getState().sectionStatus.education).toBe("complete");
  });

  it("keeps end date disabled until a start date is set", async () => {
    render(<EducationForm />);
    await userEvent.click(screen.getByText("+ Add education"));
    expect(screen.getByLabelText("End date")).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2020-01" } });
    expect(screen.getByLabelText("End date")).toBeEnabled();
  });

  it("shows required-field errors after blur", async () => {
    render(<EducationForm />);
    await userEvent.click(screen.getByText("+ Add education"));
    await userEvent.click(screen.getByPlaceholderText("University of Texas at Austin"));
    await userEvent.tab();
    expect(screen.getByText("Enter the school or institution.")).toBeInTheDocument();
  });

  it("flags an end date that is before the start date", async () => {
    act(() => {
      useBuilderStore.getState().addListItem("education", {
        institution: "MIT",
        degree: "B.S.",
        startDate: "2022-01",
        endDate: "2021-01",
      });
    });
    render(<EducationForm />);
    await userEvent.click(screen.getByLabelText("End date"));
    await userEvent.tab();
    expect(screen.getByText("End date cannot be before the start date.")).toBeInTheDocument();
  });

  it("removes an entry", async () => {
    act(() => {
      useBuilderStore.getState().addListItem("education", { institution: "MIT", degree: "B.S.", startDate: "2020-01" });
    });
    render(<EducationForm />);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(useBuilderStore.getState().sections.education).toEqual([]);
  });

  it("keeps GPA/coursework collapsed until asked for", async () => {
    act(() => {
      useBuilderStore.getState().addListItem("education", { institution: "MIT", degree: "B.S.", startDate: "2020-01" });
    });
    render(<EducationForm />);
    expect(screen.queryByPlaceholderText("3.8 / 4.0")).not.toBeInTheDocument();
    expect(screen.getByText("+ Add GPA / coursework")).toBeInTheDocument();

    await userEvent.click(screen.getByText("+ Add GPA / coursework"));
    expect(screen.getByPlaceholderText("3.8 / 4.0")).toBeInTheDocument();
  });

  it("offers field-of-study suggestions across industries", async () => {
    act(() => {
      useBuilderStore.getState().addListItem("education", { institution: "MIT", degree: "B.S.", startDate: "2020-01" });
    });
    render(<EducationForm />);
    await userEvent.click(screen.getByPlaceholderText(/Pharmacy, Architecture, Construction/));
    expect(screen.getByRole("option", { name: "Architecture" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Pharmacy" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Construction Management" })).toBeInTheDocument();
  });
});

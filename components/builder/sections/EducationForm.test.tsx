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
    expect(screen.getByText("+ Add grade / coursework")).toBeInTheDocument();

    await userEvent.click(screen.getByText("+ Add grade / coursework"));
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

  describe("grading system", () => {
    function addEntry(extra: Record<string, string> = {}) {
      act(() => {
        useBuilderStore.getState().addListItem("education", { institution: "IIT Delhi", degree: "B.Tech", startDate: "2018-07", ...extra });
      });
    }

    function education() {
      return useBuilderStore.getState().sections.education![0];
    }

    afterEach(() => localStorage.clear());

    it("lets the user pick a scale and saves the grade on it", async () => {
      addEntry();
      render(<EducationForm />);
      await userEvent.click(screen.getByText("+ Add grade / coursework"));
      await userEvent.selectOptions(screen.getByLabelText("Grading system"), "cgpa10");
      await userEvent.type(screen.getByLabelText("Grade (optional)"), "8.6");
      expect(education()).toMatchObject({ gradeType: "cgpa10", gpa: "8.6" });
    });

    it("offers every scale, grouped", async () => {
      addEntry();
      const { container } = render(<EducationForm />);
      await userEvent.click(screen.getByText("+ Add grade / coursework"));
      const groups = Array.from(container.querySelectorAll("optgroup")).map((g) => g.label);
      expect(groups).toEqual(["GPA & CGPA", "Scores & percentages", "National scales", "Classes & honours", "Other"]);
      expect(screen.getByRole("option", { name: "UK degree classification" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "German grade (1.0 best – 5.0)" })).toBeInTheDocument();
    });

    it("switches to a list of labels for classification scales", async () => {
      addEntry();
      render(<EducationForm />);
      await userEvent.click(screen.getByText("+ Add grade / coursework"));
      await userEvent.selectOptions(screen.getByLabelText("Grading system"), "ukClass");
      const grade = screen.getByLabelText("Grade (optional)");
      expect(grade.tagName).toBe("SELECT");
      await userEvent.selectOptions(grade, "Upper Second Class Honours (2:1)");
      expect(education()).toMatchObject({ gradeType: "ukClass", gpa: "Upper Second Class Honours (2:1)" });
    });

    it("clears a label grade that doesn't exist on the newly picked scale", async () => {
      addEntry({ gradeType: "ukClass", gpa: "First Class Honours" });
      render(<EducationForm />);
      await userEvent.selectOptions(screen.getByLabelText("Grading system"), "latinHonors");
      expect(education()).toMatchObject({ gradeType: "latinHonors", gpa: "" });
    });

    it("keeps a numeric grade when moving between numeric scales", async () => {
      addEntry({ gradeType: "cgpa10", gpa: "8.6" });
      render(<EducationForm />);
      await userEvent.selectOptions(screen.getByLabelText("Grading system"), "percentage");
      expect(education()).toMatchObject({ gradeType: "percentage", gpa: "8.6" });
    });

    it("flags a grade outside the scale's range once the field is left", async () => {
      addEntry({ gradeType: "cgpa10" });
      render(<EducationForm />);
      await userEvent.click(screen.getByText("+ Add grade / coursework"));
      await userEvent.type(screen.getByLabelText("Grade (optional)"), "11");
      await userEvent.tab();
      expect(screen.getByText("Enter a number from 0 to 10.")).toBeInTheDocument();
    });

    it("starts new entries on the scale used in the detected country", async () => {
      localStorage.setItem("detectedCountry", "IN");
      addEntry();
      render(<EducationForm />);
      await userEvent.click(screen.getByText("+ Add grade / coursework"));
      expect(screen.getByLabelText("Grading system")).toHaveValue("cgpa10");
      expect(screen.getByPlaceholderText("8.6")).toBeInTheDocument();
    });

    it("keeps a saved grade without a scale on plain GPA, whatever the country", async () => {
      localStorage.setItem("detectedCountry", "IN");
      addEntry({ gpa: "3.9" });
      render(<EducationForm />);
      expect(screen.getByLabelText("Grading system")).toHaveValue("gpa");
    });
  
    it("re-checks the grade at once when the scale changes", async () => {
      addEntry({ gradeType: "percentage", gpa: "85" });
      render(<EducationForm />);
      await userEvent.selectOptions(screen.getByLabelText("Grading system"), "cgpa10");
      expect(screen.getByText("Enter a number from 0 to 10.")).toBeInTheDocument();
    });

    it("shows a saved grade's error without waiting for a blur", () => {
      addEntry({ gradeType: "gpa4", gpa: "9" });
      render(<EducationForm />);
      expect(screen.getByText("Enter a number from 0 to 4.")).toBeInTheDocument();
    });
  });
});

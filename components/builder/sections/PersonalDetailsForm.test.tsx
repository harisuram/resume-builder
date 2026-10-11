import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, PersonalDetailsForm } from "./PersonalDetailsForm";

beforeEach(() => {
  act(() => useBuilderStore.getState().resetStore());
});

function details() {
  return useBuilderStore.getState().sections.personalDetails;
}

describe("PersonalDetailsForm", () => {
  it("shows the four fields, all optional", () => {
    render(<PersonalDetailsForm />);
    expect(screen.getByRole("heading", { name: "Personal details" })).toBeInTheDocument();
    for (const label of ["Date of birth", "Gender", "Marital status", "Nationality"]) {
      expect(screen.getByLabelText(label)).not.toBeRequired();
    }
  });

  it("saves a date of birth from the date picker", () => {
    render(<PersonalDetailsForm />);
    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1998-03-15" } });
    expect(details()).toEqual({ dateOfBirth: "1998-03-15" });
    expect(useBuilderStore.getState().sectionStatus.personalDetails).toBe("complete");
  });

  it("offers gender and marital status as choices, with 'Leave off' to clear", async () => {
    render(<PersonalDetailsForm />);
    const gender = screen.getByLabelText("Gender");
    expect(Array.from((gender as HTMLSelectElement).options).map((o) => o.text)).toEqual(["Leave off", ...GENDER_OPTIONS]);
    await userEvent.selectOptions(gender, "Female");
    await userEvent.selectOptions(screen.getByLabelText("Marital status"), "Married");
    expect(details()).toEqual({ gender: "Female", maritalStatus: "Married" });

    await userEvent.selectOptions(gender, "Leave off");
    expect(details()).toEqual({ maritalStatus: "Married" });
    expect(MARITAL_STATUS_OPTIONS).toContain("Civil partnership");
  });

  it("takes any nationality and suggests common ones", async () => {
    render(<PersonalDetailsForm />);
    await userEvent.type(screen.getByLabelText("Nationality"), "Ind");
    expect(screen.getByRole("option", { name: "Indian" })).toBeInTheDocument();
    expect(details()).toEqual({ nationality: "Ind" });
  });

  it("flags a future birth date once the field is left", () => {
    render(<PersonalDetailsForm />);
    const dob = screen.getByLabelText("Date of birth");
    fireEvent.change(dob, { target: { value: "2999-01-01" } });
    fireEvent.blur(dob);
    expect(screen.getByText("Date of birth can't be in the future.")).toBeInTheDocument();
    expect(useBuilderStore.getState().sectionStatus.personalDetails).toBe("not_started");
  });

  it("shows the skipped notice instead of fields when skipped", () => {
    act(() => useBuilderStore.getState().toggleSkipSection("personalDetails"));
    render(<PersonalDetailsForm />);
    expect(screen.getByText(/Personal details is skipped/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Gender")).not.toBeInTheDocument();
  });
});

describe("PersonalDetailsForm — saved values", () => {
  it("highlights bad values already in the draft without waiting for a blur", () => {
    act(() => {
      useBuilderStore.setState((state) => ({
        sections: { ...state.sections, personalDetails: { gender: "Robot", nationality: "Indian1" } },
      }));
    });
    render(<PersonalDetailsForm />);
    expect(screen.getByText("Choose a gender from the list, or leave it off.")).toBeInTheDocument();
    expect(screen.getByText("Use letters only, like “Indian”.")).toBeInTheDocument();
    // The bad value is shown, so the user can see what to change.
    expect(screen.getByLabelText("Gender")).toHaveValue("Robot");
  });

  it("waits for blur before flagging what the user is typing now", async () => {
    render(<PersonalDetailsForm />);
    await userEvent.type(screen.getByLabelText("Nationality"), "Indian1");
    expect(screen.queryByText("Use letters only, like “Indian”.")).not.toBeInTheDocument();
    fireEvent.blur(screen.getByLabelText("Nationality"));
    expect(screen.getByText("Use letters only, like “Indian”.")).toBeInTheDocument();
  });
});

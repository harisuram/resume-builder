import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { PatentsForm } from "./PatentsForm";
import { LanguagesForm } from "./LanguagesForm";
import { HobbiesForm } from "./HobbiesForm";
import { SoftSkillsForm } from "./SoftSkillsForm";
import { AdditionalForm } from "./AdditionalForm";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

describe("PatentsForm", () => {
  it("adds a patent and fills its title", async () => {
    render(<PatentsForm />);
    await userEvent.click(screen.getByText("+ Add patent"));
    await userEvent.type(screen.getByPlaceholderText("Distributed cache coherency protocol"), "My patent");
    expect(useBuilderStore.getState().sections.patents![0].title).toBe("My patent");
    expect(useBuilderStore.getState().sectionStatus.patents).toBe("complete");
  });

  it("shows a skipped notice when skipped", () => {
    act(() => useBuilderStore.getState().toggleSkipSection("patents"));
    render(<PatentsForm />);
    expect(screen.getByText(/Patents is skipped/)).toBeInTheDocument();
  });
});

describe("LanguagesForm", () => {
  it("adds a language with a proficiency level", async () => {
    render(<LanguagesForm />);
    await userEvent.click(screen.getByText("+ Add language"));
    await userEvent.type(screen.getByPlaceholderText("Spanish"), "French");
    await userEvent.selectOptions(screen.getByLabelText("Proficiency"), "Native");
    expect(useBuilderStore.getState().sections.languages![0]).toEqual({ name: "French", level: "Native" });
  });

  it("shows an error when the language name is left blank", async () => {
    render(<LanguagesForm />);
    await userEvent.click(screen.getByText("+ Add language"));
    await userEvent.click(screen.getByPlaceholderText("Spanish"));
    await userEvent.tab();
    expect(screen.getByText("Enter the language.")).toBeInTheDocument();
  });
});

describe("HobbiesForm", () => {
  it("adds hobbies via the chip input", async () => {
    render(<HobbiesForm />);
    await userEvent.type(screen.getByPlaceholderText("Add a hobby, press Enter"), "Chess{Enter}");
    expect(useBuilderStore.getState().sections.hobbies).toEqual(["Chess"]);
  });
});

describe("SoftSkillsForm", () => {
  it("adds soft skills via the chip input", async () => {
    render(<SoftSkillsForm />);
    await userEvent.type(screen.getByPlaceholderText("Add a soft skill, press Enter"), "Mentoring{Enter}");
    expect(useBuilderStore.getState().sections.softSkills).toEqual(["Mentoring"]);
  });
});

describe("AdditionalForm", () => {
  it("sets a custom heading and adds an entry", async () => {
    render(<AdditionalForm />);
    await userEvent.type(screen.getByLabelText("Section title"), "Volunteer work");
    await userEvent.click(screen.getByText("+ Add entry"));
    await userEvent.type(screen.getByPlaceholderText("Volunteer coordinator"), "Blood drive lead");
    expect(useBuilderStore.getState().sections.additional?.heading).toBe("Volunteer work");
    expect(useBuilderStore.getState().sections.additional?.items[0].title).toBe("Blood drive lead");
    expect(useBuilderStore.getState().sectionStatus.additional).toBe("complete");
  });

  it("shows a skipped notice using the custom heading when one is set", () => {
    act(() => {
      useBuilderStore.getState().setAdditionalHeading("Publications");
      useBuilderStore.getState().toggleSkipSection("additional");
    });
    render(<AdditionalForm />);
    expect(screen.getByText(/Publications is skipped/)).toBeInTheDocument();
  });
});

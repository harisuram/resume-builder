import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { BasicInfoForm } from "./BasicInfoForm";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

describe("BasicInfoForm", () => {
  it("has no skip control — basic info is required", () => {
    render(<BasicInfoForm />);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("updates the store as fields are typed", async () => {
    render(<BasicInfoForm />);
    await userEvent.type(screen.getByLabelText("Full name"), "Jamie Rivera");
    await userEvent.type(screen.getByLabelText("Email"), "jamie@example.com");
    await userEvent.type(screen.getByLabelText("Phone"), "5550100");
    await userEvent.type(screen.getByLabelText("Location"), "Austin, TX");

    const { basicInfo } = useBuilderStore.getState();
    expect(basicInfo.name).toBe("Jamie Rivera");
    expect(basicInfo.email).toBe("jamie@example.com");
    expect(basicInfo.phone).toBe("5550100");
    expect(basicInfo.location).toBe("Austin, TX");
  });

  it("strips anything but digits as the phone is typed", async () => {
    render(<BasicInfoForm />);
    await userEvent.type(screen.getByLabelText("Phone"), "(555) 010-0199");
    expect(useBuilderStore.getState().basicInfo.phone).toBe("5550100199");
  });

  it("defaults the country code to +1 and lets it be changed", async () => {
    render(<BasicInfoForm />);
    await userEvent.click(screen.getByLabelText("Phone country code"));
    await userEvent.click(screen.getByRole("option", { name: /United Kingdom/ }));
    expect(useBuilderStore.getState().basicInfo.phoneCountryCode).toBe("+44");
  });

  it("keeps the country code and phone number in a single split control", () => {
    render(<BasicInfoForm />);
    const trigger = screen.getByLabelText("Phone country code");
    const phone = screen.getByLabelText("Phone");
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.className).toContain("w-[6.25rem]");
    expect(phone.className).toContain("min-w-0");
    expect(phone.className).toContain("flex-1");
  });

  it("opens a seven-row scrollable country list", async () => {
    render(<BasicInfoForm />);
    await userEvent.click(screen.getByLabelText("Phone country code"));
    const list = screen.getByRole("listbox", { name: "Country codes" });
    expect(list.style.maxHeight).toBe("252px");
    expect(list.className).toContain("overflow-y-auto");
    expect(screen.getAllByRole("option").length).toBeGreaterThan(7);
  });

  it("updates links independently of each other", async () => {
    render(<BasicInfoForm />);
    await userEvent.type(screen.getByPlaceholderText("linkedin.com/in/jordan"), "linkedin.com/in/jamie");
    await userEvent.type(screen.getByPlaceholderText("github.com/jordan"), "github.com/jamie");

    const { links } = useBuilderStore.getState().basicInfo;
    expect(links.linkedin).toBe("linkedin.com/in/jamie");
    expect(links.github).toBe("github.com/jamie");
  });

  describe("validation on blur", () => {
    it("shows no errors before a field has been touched", () => {
      render(<BasicInfoForm />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows an error for a required field only after it's blurred", async () => {
      render(<BasicInfoForm />);
      const name = screen.getByLabelText("Full name");
      await userEvent.click(name);
      expect(screen.queryByText("Enter your full name.")).not.toBeInTheDocument();

      await userEvent.tab();
      expect(screen.getByText("Enter your full name.")).toBeInTheDocument();
    });

    it("flags a malformed email once blurred, and clears once fixed", async () => {
      render(<BasicInfoForm />);
      const email = screen.getByLabelText("Email");
      await userEvent.type(email, "not-an-email");
      await userEvent.tab();
      expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();

      await userEvent.type(email, "@example.com");
      expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
    });

    it("raises no error for an empty phone once blurred — it's optional", async () => {
      render(<BasicInfoForm />);
      await userEvent.click(screen.getByLabelText("Phone"));
      await userEvent.tab();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("flags a phone number that's too short once blurred", async () => {
      render(<BasicInfoForm />);
      const phone = screen.getByLabelText("Phone");
      await userEvent.type(phone, "555");
      await userEvent.tab();
      expect(screen.getByText("Enter at least 7 digits.")).toBeInTheDocument();
    });

    it("flags a link that doesn't look like a URL once blurred", async () => {
      render(<BasicInfoForm />);
      const linkedin = screen.getByPlaceholderText("linkedin.com/in/jordan");
      await userEvent.type(linkedin, "not a url");
      await userEvent.tab();
      expect(screen.getByText(/Enter a valid LinkedIn link/)).toBeInTheDocument();
    });
  });
});

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { CertificationsForm } from "./CertificationsForm";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

describe("CertificationsForm", () => {
  it("adds a certification and fills name, issuer, and date", async () => {
    render(<CertificationsForm />);
    await userEvent.click(screen.getByText("+ Add certification"));
    expect(screen.getByPlaceholderText(/AWS Certified Developer, CCNA, PMP/)).toHaveFocus();

    await userEvent.type(screen.getByPlaceholderText(/AWS Certified Developer, CCNA, PMP/), "AWS SAA");
    await userEvent.type(screen.getByPlaceholderText(/Amazon Web Services, Cisco, OSHA/), "AWS");

    const cert = useBuilderStore.getState().sections.certifications![0];
    expect(cert.name).toBe("AWS SAA");
    expect(cert.issuer).toBe("AWS");
  });

  it("removes a certification", async () => {
    act(() =>
      useBuilderStore.getState().addListItem("certifications", { name: "Cert", issuer: "Issuer", date: "2022-01" }),
    );
    render(<CertificationsForm />);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(useBuilderStore.getState().sections.certifications).toEqual([]);
  });

  it("shows a skipped notice when skipped", () => {
    act(() => useBuilderStore.getState().toggleSkipSection("certifications"));
    render(<CertificationsForm />);
    expect(screen.getByText(/Certifications is skipped/)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import DisclaimerPage from "@/app/disclaimer/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import { CONTACT_EMAIL } from "./legal";

/* AdSense reviewers look for a working way to reach the site owner on these
 * pages. A placeholder slipping through would undo the point of them. */
describe("legal and trust pages", () => {
  it("uses a real contact address", () => {
    expect(CONTACT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i);
    expect(CONTACT_EMAIL).not.toMatch(/todo|example/i);
  });

  it.each([
    ["about", AboutPage],
    ["contact", ContactPage],
    ["privacy", PrivacyPage],
    ["terms", TermsPage],
    ["disclaimer", DisclaimerPage],
  ])("%s links the contact email", (_name, Page) => {
    render(<Page />);
    const links = screen.getAllByRole("link", { name: CONTACT_EMAIL });
    expect(links[0]).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
  });

  it("carries Google's required advertising-cookie disclosures in the privacy policy", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/Third-party vendors, including Google, use cookies/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ad Settings" })).toHaveAttribute("href", "https://adssettings.google.com");
  });
});

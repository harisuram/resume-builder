import { render, screen } from "@testing-library/react";
import TemplatesPage from "./page";
import { TEMPLATES } from "@/components/templates/shared/theme";

describe("templates gallery", () => {
  it("lists every template name and sends people to the builder, not a picker", () => {
    render(<TemplatesPage />);
    expect(screen.getByRole("heading", { level: 1, name: /free resume templates/i })).toBeInTheDocument();
    for (const template of TEMPLATES) {
      expect(screen.getByRole("heading", { name: template.name })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /make a resume with these templates/i })).toHaveAttribute("href", "/builder");
  });
});

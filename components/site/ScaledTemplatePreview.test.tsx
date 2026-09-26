import { render } from "@testing-library/react";
import { getTheme } from "@/components/templates/shared/theme";
import { PRINT_LAYOUT_SIM_CLASS } from "@/lib/pagination/printLayout";
import { ScaledTemplatePreview } from "./ScaledTemplatePreview";

function pageEl(container: HTMLElement) {
  return container.querySelector("[data-sample-resume]") as HTMLElement;
}

describe("ScaledTemplatePreview", () => {
  /* Without the print layout model, the sidebar colgroup squeezes the whole
   * sample into the 34% rail column and the tile shows a third of a page
   * beside two thirds of blank paper. */
  it.each(["ember", "aisle", "twin"])(
    "renders %s with the column model print uses",
    (id) => {
      const { container } = render(<ScaledTemplatePreview theme={getTheme(id)} />);
      expect(pageEl(container)).toHaveClass("resume-scale-stage", PRINT_LAYOUT_SIM_CLASS);
    },
  );

  it("leaves single-column templates on the normal screen layout", () => {
    const { container } = render(<ScaledTemplatePreview theme={getTheme("atlas")} />);
    expect(pageEl(container)).not.toHaveClass(PRINT_LAYOUT_SIM_CLASS);
  });
});

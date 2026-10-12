import { act, render, screen } from "@testing-library/react";
import { SectionFooterNav, footerActionsHidden } from "./SectionFooterNav";

const props = {
  canGoBack: true,
  canGoNext: true,
  nextEnabled: true,
  canSkip: true,
  canClear: false,
  clearLabel: "Summary",
  onBack: jest.fn(),
  onNext: jest.fn(),
  onSkip: jest.fn(),
  onClear: jest.fn(),
  onPreview: jest.fn(),
};

describe("footerActionsHidden", () => {
  const phone = { mobile: true, atBottom: false };

  it("hides Skip and Save while scrolling down, and shows them on the way up or at the bottom", () => {
    expect(footerActionsHidden(false, { ...phone, top: 120, delta: 24 })).toBe(true);
    expect(footerActionsHidden(true, { ...phone, top: 80, delta: -12 })).toBe(false);
    expect(footerActionsHidden(true, { mobile: true, top: 900, delta: 30, atBottom: true })).toBe(false);
    expect(footerActionsHidden(false, { mobile: false, top: 200, delta: 40, atBottom: false })).toBe(false);
    expect(footerActionsHidden(false, { ...phone, top: 16, delta: 12 })).toBe(false);
  });
});

describe("SectionFooterNav scroll", () => {
  const original = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 767px)",
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = original;
  });

  async function scrollTo(scroller: HTMLElement, top: number) {
    await act(async () => {
      scroller.scrollTop = top;
      scroller.dispatchEvent(new Event("scroll"));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    });
  }

  it("slides Skip and Save away on the way down and keeps Preview", async () => {
    const { container } = render(
      <div data-builder-scroll="">
        <SectionFooterNav {...props} />
      </div>,
    );
    const scroller = container.querySelector("[data-builder-scroll]") as HTMLElement;
    Object.defineProperty(scroller, "scrollHeight", { value: 2000, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 800, configurable: true });
    const capsule = () => container.querySelector("[data-mtour='capsule']") as HTMLElement;

    expect(capsule().hasAttribute("data-actions-hidden")).toBe(false);
    expect(screen.getByRole("button", { name: "Preview resume" })).toBeInTheDocument();

    await scrollTo(scroller, 200);
    expect(capsule()).toHaveAttribute("data-actions-hidden", "");
    expect(capsule().className).toContain("max-md:max-h-0");
    expect(screen.getByRole("button", { name: "Preview resume" })).toBeInTheDocument();

    await scrollTo(scroller, 120);
    expect(capsule().hasAttribute("data-actions-hidden")).toBe(false);

    await scrollTo(scroller, 200);
    await scrollTo(scroller, 1200);
    expect(capsule().hasAttribute("data-actions-hidden")).toBe(false);
  });
});

import { fragmentRanges, measureFragmentCuts } from "./fragment";

/* jsdom has no layout: no line boxes, and Range carries no geometry. The
 * oracle has to say so rather than throw, because the preview falls back to
 * the arithmetic model on a null and every component test renders there. */
describe("fragment cut oracle", () => {
  function stage(height: number): HTMLElement {
    const el = document.createElement("div");
    el.innerHTML = "<p>a line of resume text</p>";
    Object.defineProperty(el, "offsetWidth", { configurable: true, value: 794 });
    Object.defineProperty(el, "offsetHeight", { configurable: true, value: height });
    el.getBoundingClientRect = () =>
      ({ top: 0, left: 0, width: 794, height }) as DOMRect;
    document.body.appendChild(el);
    return el;
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("declines to measure where there is no layout", () => {
    expect(measureFragmentCuts(stage(3000), { pageBudgetPx: 1010 })).toBeNull();
  });

  it("declines when the page budget is not a usable height", () => {
    expect(measureFragmentCuts(stage(3000), { pageBudgetPx: 0 })).toBeNull();
  });

  it("leaves no probe element behind", () => {
    measureFragmentCuts(stage(3000), { pageBudgetPx: 1010 });
    expect(document.querySelector(".resume-fragment-probe")).toBeNull();
  });

  it("returns no ranges when it cannot measure, so callers fall back", () => {
    expect(fragmentRanges(stage(3000), { pageBudgetPx: 1010 })).toBeNull();
  });
});

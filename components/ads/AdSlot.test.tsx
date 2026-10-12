import { render, waitFor } from "@testing-library/react";
import { AdSlot } from "./AdSlot";
import * as adsLib from "../../lib/ads";

jest.mock("../../lib/ads", () => ({
  __esModule: true,
  ADSENSE_CLIENT_ID: "",
  adsenseClientAttr: (id: string) => (id.startsWith("ca-") ? id : id ? `ca-${id}` : ""),
}));

function setClientId(value: string) {
  (adsLib as { ADSENSE_CLIENT_ID: string }).ADSENSE_CLIENT_ID = value;
}

beforeEach(() => {
  setClientId("");
  delete (window as { adsbygoogle?: unknown[] }).adsbygoogle;
});

describe("AdSlot", () => {
  it("renders nothing when AdSense isn't configured", () => {
    const { container } = render(<AdSlot slot="1234" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when no slot id is given, even if configured", () => {
    setClientId("ca-pub-123");
    const { container } = render(<AdSlot slot="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the ad unit with the right client/slot attributes when configured", () => {
    setClientId("ca-pub-123");
    const { container } = render(<AdSlot slot="9876" />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).toBeInTheDocument();
    expect(ins).toHaveAttribute("data-ad-client", "ca-pub-123");
    expect(ins).toHaveAttribute("data-ad-slot", "9876");
    expect(ins).toHaveAttribute("data-ad-format", "auto");
    expect(ins).toHaveAttribute("data-full-width-responsive", "true");
    expect(ins).toHaveStyle({ display: "block" });
    expect(container.firstElementChild).toHaveClass("h-0", "overflow-hidden");
  });

  it("does not apply display:none when the caller passes Tailwind hidden", async () => {
    setClientId("ca-pub-123");
    const { container, getByText } = render(<AdSlot slot="9876" className="mt-6 hidden flex-col md:flex" />);
    const ins = container.querySelector("ins.adsbygoogle")!;
    ins.setAttribute("data-ad-status", "filled");

    await waitFor(() => expect(getByText("Advertisement")).toBeInTheDocument());
    expect(container.firstElementChild).not.toHaveClass("hidden");
    expect(container.firstElementChild).toHaveClass("mt-6", "flex-col", "md:flex");
    expect(ins).toHaveStyle({ display: "block" });
  });

  it("stays collapsed and unlabeled until Google reports a fill", () => {
    setClientId("ca-pub-123");
    const { container, queryByText } = render(<AdSlot slot="9876" />);
    expect(queryByText("Advertisement")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("h-0", "overflow-hidden");
  });

  it("shows the slot only after Google reports a fill", async () => {
    setClientId("ca-pub-123");
    const { container, getByText } = render(<AdSlot slot="9876" className="mt-6 flex flex-col" />);
    const ins = container.querySelector("ins.adsbygoogle")!;
    ins.setAttribute("data-ad-status", "filled");

    await waitFor(() => expect(getByText("Advertisement")).toBeInTheDocument());
    expect(container.firstElementChild).toHaveClass("mt-6", "flex");
    expect(container.firstElementChild).not.toHaveClass("h-0");
  });

  it("pushes exactly one ad request on mount", () => {
    setClientId("ca-pub-123");
    window.adsbygoogle = [];
    const pushSpy = jest.spyOn(window.adsbygoogle, "push");
    render(<AdSlot slot="9876" />);
    expect(pushSpy).toHaveBeenCalledTimes(1);
  });

  it("does not throw when window.adsbygoogle push itself throws", () => {
    setClientId("ca-pub-123");
    window.adsbygoogle = {
      push: () => {
        throw new Error("blocked");
      },
    } as unknown as unknown[];
    expect(() => render(<AdSlot slot="9876" />)).not.toThrow();
  });

  it("stays collapsed when Google reports no fill, but keeps the ins for crawlers", async () => {
    setClientId("ca-pub-123");
    const { container, queryByText } = render(<AdSlot slot="9876" />);
    const ins = container.querySelector("ins.adsbygoogle")!;
    ins.setAttribute("data-ad-status", "unfilled");

    await waitFor(() => expect(container.firstElementChild).toHaveClass("h-0", "overflow-hidden"));
    expect(queryByText("Advertisement")).not.toBeInTheDocument();
    expect(container.querySelector("ins.adsbygoogle")).toBeInTheDocument();
  });

  it("leaves md:hidden off the element so AdsBot is not looking at display:none", () => {
    setClientId("ca-pub-123");
    window.adsbygoogle = [];
    const pushSpy = jest.spyOn(window.adsbygoogle, "push");
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 48rem)",
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia;

    const { container } = render(<AdSlot slot="9876" className="mt-12 flex md:hidden" />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).toHaveAttribute("data-ad-slot", "9876");
    expect(ins).toHaveStyle({ display: "block" });
    expect(container.firstElementChild).toHaveClass("h-0", "overflow-hidden");
    expect(container.firstElementChild).not.toHaveClass("md:hidden", "hidden", "mt-12");
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it("requests an md:hidden unit once the viewport is below md", () => {
    setClientId("ca-pub-123");
    window.adsbygoogle = [];
    const pushSpy = jest.spyOn(window.adsbygoogle, "push");
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia;

    render(<AdSlot slot="9876" className="mt-12 flex md:hidden" />);
    expect(pushSpy).toHaveBeenCalledTimes(1);
  });

  it("leaves max-lg:hidden off the element and skips the request while below lg", () => {
    setClientId("ca-pub-123");
    window.adsbygoogle = [];
    const pushSpy = jest.spyOn(window.adsbygoogle, "push");
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === "(width < 64rem)",
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia;

    const { container } = render(<AdSlot slot="9876" className="mb-[150px] flex shrink-0 max-lg:hidden" />);
    expect(container.firstElementChild).toHaveClass("h-0", "overflow-hidden");
    expect(container.firstElementChild).not.toHaveClass("max-lg:hidden", "mb-[150px]");
    expect(container.querySelector("ins.adsbygoogle")).toHaveAttribute("data-ad-slot", "9876");
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it("renders the ins and does not request when request is false", () => {
    setClientId("ca-pub-123");
    window.adsbygoogle = [];
    const pushSpy = jest.spyOn(window.adsbygoogle, "push");
    const { container } = render(<AdSlot slot="9876" request={false} />);
    expect(container.querySelector("ins.adsbygoogle")).toHaveAttribute("data-ad-slot", "9876");
    expect(container.querySelector("ins.adsbygoogle")).toHaveStyle({ display: "block" });
    expect(container.firstElementChild).toHaveClass("h-0", "overflow-hidden");
    expect(container.firstElementChild).not.toHaveClass("hidden");
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it("does not request an ad while the unit is display:none, and requests once it is shown", () => {
    setClientId("ca-pub-123");
    window.adsbygoogle = [];
    const pushSpy = jest.spyOn(window.adsbygoogle, "push");
    let onResize: () => void = () => {};
    const OriginalRO = window.ResizeObserver;
    window.ResizeObserver = class {
      constructor(cb: () => void) {
        onResize = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;

    const host = document.createElement("div");
    host.style.display = "none";
    document.body.appendChild(host);
    try {
      render(<AdSlot slot="9876" />, { container: host });
      expect(pushSpy).not.toHaveBeenCalled();

      host.style.display = "block";
      onResize();
      onResize();
      expect(pushSpy).toHaveBeenCalledTimes(1);
    } finally {
      window.ResizeObserver = OriginalRO;
      host.remove();
    }
  });

  it("does not request an ad clipped in a zero-width ancestor, and requests once that ancestor has size", () => {
    setClientId("ca-pub-123");
    window.adsbygoogle = [];
    const pushSpy = jest.spyOn(window.adsbygoogle, "push");
    let onResize: () => void = () => {};
    const OriginalRO = window.ResizeObserver;
    window.ResizeObserver = class {
      constructor(cb: () => void) {
        onResize = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;

    const host = document.createElement("div");
    host.style.overflow = "hidden";
    let width = 0;
    Object.defineProperty(host, "clientWidth", { configurable: true, get: () => width });
    Object.defineProperty(host, "clientHeight", { configurable: true, get: () => 640 });
    document.body.appendChild(host);

    try {
      render(<AdSlot slot="9876" />, { container: host });
      expect(pushSpy).not.toHaveBeenCalled();

      width = 400;
      onResize();
      onResize();
      expect(pushSpy).toHaveBeenCalledTimes(1);
    } finally {
      window.ResizeObserver = OriginalRO;
      host.remove();
    }
  });
});

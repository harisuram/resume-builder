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
});

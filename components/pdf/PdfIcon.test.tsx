import { render } from "@testing-library/react";
import { PdfBullet, PdfIcon } from "./PdfIcon";

jest.mock("@react-pdf/renderer", () => ({
  Canvas: (props: { paint: unknown; style: unknown }) => {
    mockCanvases.push(props);
    return null;
  },
}));

const mockCanvases: { paint: unknown; style: unknown }[] = [];

type Paint = (painter: unknown, width: number, height: number) => null;

/** Records every pdfkit call a paint function makes. */
function fakePainter() {
  const calls: [string, ...unknown[]][] = [];
  const painter: Record<string, (...args: unknown[]) => unknown> = {};
  for (const method of ["save", "restore", "scale", "translate", "opacity", "path", "circle", "rect", "roundedRect", "lineWidth", "lineCap", "lineJoin", "stroke", "fill"]) {
    painter[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return painter;
    };
  }
  return { painter, calls };
}

function lastPaint(): Paint {
  return mockCanvases.at(-1)!.paint as Paint;
}

beforeEach(() => {
  mockCanvases.length = 0;
});

describe("PdfIcon", () => {
  it("scales the icon's 24-unit viewBox to its box and strokes each shape", () => {
    render(<PdfIcon name="mail" size={9} color="#57524a" />);
    expect(mockCanvases.at(-1)!.style).toEqual({ width: 9, height: 9 });
    const { painter, calls } = fakePainter();
    lastPaint()(painter, 9, 9);
    expect(calls).toContainEqual(["scale", 9 / 24, 9 / 24]);
    expect(calls).toContainEqual(["roundedRect", 3, 5.5, 18, 13, 1.5]);
    expect(calls).toContainEqual(["path", "m4 7 8 6 8-6"]);
    expect(calls.filter(([m]) => m === "stroke")).toEqual([
      ["stroke", "#57524a"],
      ["stroke", "#57524a"],
    ]);
    expect(calls).toContainEqual(["lineCap", "round"]);
    expect(calls[0][0]).toBe("save");
    expect(calls.at(-1)![0]).toBe("restore");
  });

  it("fills brand marks instead of stroking them, in their own viewBox", () => {
    render(<PdfIcon name="github" size={12} color="#111111" opacity={0.8} />);
    const { painter, calls } = fakePainter();
    lastPaint()(painter, 12, 12);
    expect(calls).toContainEqual(["scale", 12 / 16, 12 / 16]);
    expect(calls).toContainEqual(["opacity", 0.8]);
    expect(calls).toContainEqual(["fill", "#111111"]);
    expect(calls.some(([m]) => m === "stroke")).toBe(false);
  });

  it("paints nothing into a zero-size box — the page-break case that crashed <Svg>", () => {
    render(<PdfIcon name="pin" size={9} color="#000000" />);
    const { painter, calls } = fakePainter();
    expect(lastPaint()(painter, 9, 0)).toBeNull();
    expect(lastPaint()(painter, 0, 9)).toBeNull();
    expect(calls).toEqual([]);
  });
});

describe("PdfBullet", () => {
  it("strokes line marks with their own weight and round caps", () => {
    render(<PdfBullet kind="arrow" size={6} color="#c9932f" />);
    const { painter, calls } = fakePainter();
    lastPaint()(painter, 6, 6);
    expect(calls).toContainEqual(["scale", 0.6, 0.6]);
    expect(calls).toContainEqual(["lineWidth", 1.4]);
    expect(calls).toContainEqual(["lineJoin", "round"]);
    expect(calls).toContainEqual(["stroke", "#c9932f"]);
  });

  it("fills the solid marks", () => {
    render(<PdfBullet kind="square" size={6} color="#6a4c93" />);
    const { painter, calls } = fakePainter();
    lastPaint()(painter, 6, 6);
    expect(calls).toContainEqual(["roundedRect", 2, 2, 6, 6, 0.6]);
    expect(calls).toContainEqual(["fill", "#6a4c93"]);
  });

  it("leaves the dash's line ends unjoined, as in the HTML", () => {
    render(<PdfBullet kind="dash" size={6} color="#000000" />);
    const { painter, calls } = fakePainter();
    lastPaint()(painter, 6, 6);
    expect(calls.some(([m]) => m === "lineJoin")).toBe(false);
  });
});

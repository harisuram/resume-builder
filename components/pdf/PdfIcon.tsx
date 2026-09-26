import { Canvas } from "@react-pdf/renderer";
import {
  BULLETS,
  ICONS,
  LINE_ICON_STROKE,
  type BulletKind,
  type IconName,
  type IconShape,
} from "@/components/templates/shared/iconShapes";

/* Icons and bullet marks are painted on a react-pdf <Canvas>, not drawn with
 * <Svg>. When a page break falls through the block around an <Svg>, react-pdf
 * can leave a zero-height fragment of it and then divides by that height when
 * fitting the viewBox — "unsupported number: Infinity", and the whole PDF
 * fails to render. A Canvas hands the paint callback its box size instead, so
 * a zero-size fragment simply paints nothing. The shapes are the same shared
 * data the HTML icons use (iconShapes.ts), drawn with pdfkit's path API. */

/** The subset of pdfkit's drawing API the painters use. */
interface Painter {
  save(): Painter;
  restore(): Painter;
  scale(x: number, y: number): Painter;
  translate(x: number, y: number): Painter;
  opacity(value: number): Painter;
  path(d: string): Painter;
  circle(x: number, y: number, r: number): Painter;
  rect(x: number, y: number, w: number, h: number): Painter;
  roundedRect(x: number, y: number, w: number, h: number, r: number): Painter;
  lineWidth(width: number): Painter;
  lineCap(cap: string): Painter;
  lineJoin(join: string): Painter;
  stroke(color: string): Painter;
  fill(color: string): Painter;
}

function traceShape(painter: Painter, shape: IconShape) {
  switch (shape.tag) {
    case "path":
      return painter.path(shape.d);
    case "circle":
      return painter.circle(shape.cx, shape.cy, shape.r);
    case "rect":
      return shape.rx
        ? painter.roundedRect(shape.x, shape.y, shape.width, shape.height, shape.rx)
        : painter.rect(shape.x, shape.y, shape.width, shape.height);
  }
}

type Ink = { fill: string } | { stroke: string; width: number; roundJoin: boolean };

/** Paints `shapes` in a `viewBox` coordinate space scaled to the box. */
function paintShapes(viewBox: string, shapes: IconShape[], ink: Ink, opacity?: number) {
  const [minX, minY, vbWidth, vbHeight] = viewBox.split(/[\s,]+/).map(Number);
  return (raw: unknown, width: number, height: number) => {
    const painter = raw as Painter;
    if (!(width > 0) || !(height > 0)) return null;
    painter.save();
    if (opacity !== undefined) painter.opacity(opacity);
    painter.scale(width / vbWidth, height / vbHeight).translate(-minX, -minY);
    for (const shape of shapes) {
      traceShape(painter, shape);
      if ("fill" in ink) {
        painter.fill(ink.fill);
      } else {
        painter.lineWidth(ink.width).lineCap("round");
        if (ink.roundJoin) painter.lineJoin("round");
        painter.stroke(ink.stroke);
      }
    }
    painter.restore();
    return null;
  };
}

/** A line or brand icon from the shared icon set, painted as PDF vectors. */
export function PdfIcon({ name, size, color, opacity }: { name: IconName; size: number; color: string; opacity?: number }) {
  const def = ICONS[name];
  const ink: Ink = def.filled ? { fill: color } : { stroke: color, width: LINE_ICON_STROKE.width, roundJoin: true };
  return <Canvas style={{ width: size, height: size }} paint={paintShapes(def.viewBox, def.shapes, ink, opacity)} />;
}

/** The template's bullet mark (chevron, square, …) at `size`. */
export function PdfBullet({ kind, size, color }: { kind: BulletKind; size: number; color: string }) {
  const { shape, filled, strokeWidth, roundJoin } = BULLETS[kind];
  const ink: Ink = filled ? { fill: color } : { stroke: color, width: strokeWidth ?? 1.5, roundJoin: Boolean(roundJoin) };
  return <Canvas style={{ width: size, height: size }} paint={paintShapes("0 0 10 10", [shape], ink)} />;
}

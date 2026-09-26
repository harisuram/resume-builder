import { createElement, type ReactNode } from "react";

/**
 * Jest stand-in for @react-pdf/renderer. The real package is ESM-only with a
 * top-level-await layout engine that Jest's CommonJS runtime can't load, so
 * unit tests render the document's element tree to the DOM instead and
 * assert on its structure. Real layout and pagination are covered in
 * e2e/pdf-engine.spec.ts, which renders actual PDFs in Chromium.
 *
 * Usage: jest.mock("@react-pdf/renderer", () => jest.requireActual<typeof import("<relative path>/test-utils/reactPdfMock")>("<relative path>/test-utils/reactPdfMock").reactPdfMock());
 */
export function reactPdfMock() {
  function primitive(tag: string, name: string) {
    function Primitive(props: {
      children?: ReactNode;
      style?: unknown;
      wrap?: boolean;
      fixed?: boolean;
      minPresenceAhead?: number;
      src?: string;
      title?: string;
      d?: string;
      fill?: string;
      stroke?: string;
    }) {
      return createElement(
        tag,
        {
          "data-pdf": name,
          "data-style": props.style === undefined ? undefined : JSON.stringify(props.style),
          // react-pdf reads a *present* wrap prop as-is, so wrap={undefined}
          // means "never split" — flag it distinctly so tests can catch it.
          "data-wrap": props.wrap === false ? "false" : "wrap" in props && props.wrap === undefined ? "undefined" : undefined,
          "data-fixed": props.fixed ? "true" : undefined,
          "data-min-presence": props.minPresenceAhead,
          "data-src": props.src,
          "data-title": props.title,
          "data-d": props.d,
          "data-fill": props.fill,
          "data-stroke": props.stroke,
        },
        props.children,
      );
    }
    Primitive.displayName = name;
    return Primitive;
  }

  return {
    __esModule: true,
    Document: primitive("div", "Document"),
    Page: primitive("div", "Page"),
    View: primitive("div", "View"),
    Text: primitive("span", "Text"),
    Link: primitive("a", "Link"),
    Image: primitive("span", "Image"),
    Svg: primitive("span", "Svg"),
    Path: primitive("span", "Path"),
    Circle: primitive("span", "Circle"),
    Rect: primitive("span", "Rect"),
    Canvas: primitive("span", "Canvas"),
    Font: { register: jest.fn(), registerHyphenationCallback: jest.fn() },
    pdf: jest.fn(() => ({ toBlob: jest.fn(async () => new Blob(["%PDF-mock"], { type: "application/pdf" })) })),
  };
}

/** Parsed `style` prop of a mocked primitive. */
export function pdfStyle(el: Element): Record<string, unknown> {
  const raw = el.getAttribute("data-style");
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

// This setup file runs for every test file, including the handful (route
// handlers) that opt into the Node test environment via a per-file
// `@jest-environment node` docblock — guard everything jsdom-only.
if (typeof window !== "undefined") {
  // jsdom doesn't implement ResizeObserver; ResumePreviewFrame uses it to
  // scale the resume page to fit its container.
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = window.ResizeObserver ?? (MockResizeObserver as unknown as typeof ResizeObserver);

  // jsdom doesn't implement window.print(); ExportSection calls it directly.
  // Always a fresh jest mock (rather than only filling in a missing stub) so
  // call assertions work regardless of jsdom's own behavior here.
  window.print = jest.fn();

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function scrollIntoView() {};
  }
}

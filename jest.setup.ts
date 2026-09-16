import "@testing-library/jest-dom";

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
}

import { showToast, useToastStore } from "./toast";

describe("showToast", () => {
  beforeEach(() => {
    useToastStore.getState().clear();
  });

  afterEach(() => {
    useToastStore.getState().clear();
  });

  it("appends an error toast to the stack", () => {
    showToast("Couldn't restore the saved resume.");
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({ message: "Couldn't restore the saved resume.", tone: "error" }),
    ]);
  });

  it("stacks multiple toasts rather than replacing the previous one", () => {
    showToast("First");
    showToast("Second");
    expect(useToastStore.getState().toasts.map((t) => t.message)).toEqual(["First", "Second"]);
  });

  it("keeps one success toast at a time, replacing the previous one", () => {
    showToast("Experience moved below Internships", "success");
    showToast("Experience moved below Part-time work", "success");
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({ message: "Experience moved below Part-time work", tone: "success" }),
    ]);
  });

  it("leaves error toasts in place when a success toast replaces another", () => {
    showToast("Couldn't build the PDF.");
    showToast("First", "success");
    showToast("Second", "success");
    expect(useToastStore.getState().toasts.map((t) => t.message)).toEqual(["Couldn't build the PDF.", "Second"]);
  });
});

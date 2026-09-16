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
});

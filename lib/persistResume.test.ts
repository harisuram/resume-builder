import { persistCurrentResume } from "./persistResume";
import { useBuilderStore } from "./store";
import { useToastStore } from "./toast";

beforeEach(() => {
  localStorage.clear();
  useBuilderStore.getState().resetStore();
  useToastStore.getState().clear();
});

describe("persistCurrentResume", () => {
  it("writes the current draft and marks it saved", () => {
    useBuilderStore.getState().updateBasicInfo({ name: "Jamie" });
    expect(persistCurrentResume()).toBe(true);
    expect(JSON.parse(localStorage.getItem("resumeData")!).basicInfo.name).toBe("Jamie");
    expect(useBuilderStore.getState().hasSavedCopy).toBe(true);
  });

  it("toasts and returns false when storage is full", () => {
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    expect(persistCurrentResume()).toBe(false);
    expect(useToastStore.getState().toasts[0]?.message).toMatch(/Storage may be full/);
    expect(useBuilderStore.getState().hasSavedCopy).toBe(false);
    spy.mockRestore();
  });
});

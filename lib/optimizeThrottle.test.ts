/**
 * @jest-environment node
 */
import { isThrottled, resetThrottleForTests } from "./optimizeThrottle";

beforeEach(() => {
  resetThrottleForTests();
});

describe("isThrottled", () => {
  it("allows five hits in a minute, then blocks the sixth", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(isThrottled("1.1.1.1", now + i)).toBe(false);
    }
    expect(isThrottled("1.1.1.1", now + 5)).toBe(true);
  });

  it("tracks IPs independently", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      isThrottled("1.1.1.1", now);
    }
    expect(isThrottled("8.8.8.8", now)).toBe(false);
  });
});

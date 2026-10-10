import { metadata } from "./layout";

describe("cover letter builder metadata", () => {
  it("keeps the tool out of the index, like /builder, with its own canonical", () => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe("/cover-letter/builder");
    expect(metadata.title).toBe("Write your cover letter");
    expect(String(metadata.description).length).toBeLessThanOrEqual(160);
  });
});

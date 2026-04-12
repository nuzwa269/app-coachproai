import { describe, expect, it } from "vitest";
import { isValidHttpUrl } from "@/lib/validation/url";

describe("isValidHttpUrl", () => {
  it("accepts valid http and https urls", () => {
    expect(isValidHttpUrl("https://example.com/proof.png")).toBe(true);
    expect(isValidHttpUrl("http://example.com/test")).toBe(true);
  });

  it("rejects non-http schemes and invalid inputs", () => {
    expect(isValidHttpUrl("ftp://example.com/file")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("not-a-url")).toBe(false);
  });
});

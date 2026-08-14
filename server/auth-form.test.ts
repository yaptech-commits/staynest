import { describe, expect, it } from "vitest";
import {
  isValidAuthEmail,
  normalizeAuthEmail,
} from "../client/src/lib/authValidation";

describe("native authentication form validation", () => {
  it("normalizes whitespace and casing before authentication", () => {
    expect(normalizeAuthEmail("  WisdomAsaare41@GMAIL.COM ")).toBe(
      "wisdomasaare41@gmail.com"
    );
  });

  it("accepts the configured superadmin email", () => {
    expect(isValidAuthEmail("wisdomasaare41@gmail.com")).toBe(true);
  });

  it("rejects blank and malformed email values", () => {
    expect(isValidAuthEmail("  ")).toBe(false);
    expect(isValidAuthEmail("wisdomasaare41@gmail")).toBe(false);
    expect(isValidAuthEmail("wisdomasaare41 gmail.com")).toBe(false);
  });
});

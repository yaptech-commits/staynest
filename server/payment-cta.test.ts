import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const stayNestPage = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../client/src/pages/StayNest.tsx"
);

describe("booking payment CTA", () => {
  it("keeps a visible payment action in the booking summary", async () => {
    const source = await readFile(stayNestPage, "utf8");

    expect(source).toContain("Pay now · {formatMoney(total, booking.currency)}");
    expect(source).toContain("onClick={() => step === 1 ? setStep(2) : onPay()}");
    expect(source).toContain("disabled={initialize.isPending}");
    expect(source).toContain("You’ll be redirected to the selected payment processor.");
  });
});

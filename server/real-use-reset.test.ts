import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/StayNest.tsx"),
  "utf8"
);
const routerSource = readFileSync(
  resolve(process.cwd(), "server/routers.ts"),
  "utf8"
);
const staynestSource = readFileSync(
  resolve(process.cwd(), "server/staynest.ts"),
  "utf8"
);

describe("real-use catalog reset", () => {
  it("does not ship the removed hardcoded demo catalog or router fallbacks", () => {
    expect(staynestSource).not.toContain("demoHotels");
    expect(routerSource).not.toContain("demoHotels");
    expect(routerSource).not.toContain("demoSearch");
    expect(routerSource).toContain("if (!dbHotels.length) return [];");
  });

  it("shows an owner onboarding empty state instead of demo properties", () => {
    expect(pageSource).toContain("StayNest is ready for its first listing");
    expect(pageSource).toContain("List a property");
  });

  it("exposes logout in the authenticated mobile navigation", () => {
    expect(pageSource).toContain(">Log out</Button>");
    expect(pageSource).toContain("void logout()");
  });
});

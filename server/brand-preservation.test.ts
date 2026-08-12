import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(process.cwd());
const readProjectFile = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("StayNest logo preservation", () => {
  it("keeps fresh managed asset paths and embedded fallbacks centralized", () => {
    const brand = readProjectFile("client/src/brand.ts");
    expect(brand).toContain('STAYNEST_WORDMARK_SRC = "/manus-storage/staynest-wordmark_f8455850.png"');
    expect(brand).toContain('STAYNEST_EMBLEM_SRC = "/manus-storage/staynest-square_3ac24101.png"');
    expect(brand).toContain("STAYNEST_WORDMARK_FALLBACK_SRC");
    expect(brand).toContain("STAYNEST_EMBLEM_FALLBACK_SRC");
  });

  it("keeps resilient wordmark or emblem usage in every shared guest and authenticated shell", () => {
    for (const file of [
      "client/src/pages/StayNest.tsx",
      "client/src/pages/Onboarding.tsx",
      "client/src/pages/EmailVerification.tsx",
      "client/src/components/DashboardLayout.tsx",
    ]) {
      expect(readProjectFile(file), file).toContain("BrandImage");
    }
    expect(readProjectFile("client/src/components/BrandImage.tsx")).toContain("onError");
  });

  it("keeps favicon and social metadata aligned to the current official assets", () => {
    const index = readProjectFile("client/index.html");
    expect(index).toContain('rel="icon" type="image/png" href="/manus-storage/staynest-square_3ac24101.png"');
    expect(index).toContain('rel="apple-touch-icon" href="/manus-storage/staynest-square_3ac24101.png"');
    expect(index).toContain('property="og:image" content="/manus-storage/staynest-wordmark_f8455850.png"');
  });

  it("does not reintroduce the screenshot hero overlay", () => {
    const home = readProjectFile("client/src/pages/StayNest.tsx");
    expect(home).not.toContain("staynest-hero-overlay");
    expect(home).not.toContain("IMG_3886");
  });
});

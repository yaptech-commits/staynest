import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(process.cwd());
const readProjectFile = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("StayNest logo preservation", () => {
  it("keeps the official asset paths centralized and stable", () => {
    const brand = readProjectFile("client/src/brand.ts");
    expect(brand).toContain('STAYNEST_WORDMARK_SRC = "/manus-storage/staynest-wordmark_36cf8e19.png"');
    expect(brand).toContain('STAYNEST_EMBLEM_SRC = "/manus-storage/staynest-square_4db1a99e.png"');
    expect(brand).toContain('STAYNEST_HERO_OVERLAY_SRC = "/manus-storage/staynest-hero-overlay_0b3d8a6b.png"');
  });

  it("keeps the wordmark in every shared guest and authenticated shell", () => {
    for (const file of [
      "client/src/pages/StayNest.tsx",
      "client/src/pages/Onboarding.tsx",
      "client/src/pages/EmailVerification.tsx",
      "client/src/components/DashboardLayout.tsx",
    ]) {
      expect(readProjectFile(file), file).toContain("STAYNEST_WORDMARK_SRC");
    }
  });

  it("keeps the favicon, touch icon, and social metadata branded", () => {
    const index = readProjectFile("client/index.html");
    expect(index).toContain('rel="icon" type="image/png" href="/manus-storage/staynest-square_4db1a99e.png"');
    expect(index).toContain('rel="apple-touch-icon" href="/manus-storage/staynest-square_4db1a99e.png"');
    expect(index).toContain('property="og:image" content="/manus-storage/staynest-wordmark_36cf8e19.png"');
  });

  it("keeps the uploaded hero overlay wired to the homepage hero", () => {
    expect(readProjectFile("client/src/pages/StayNest.tsx")).toContain("STAYNEST_HERO_OVERLAY_SRC");
  });
});

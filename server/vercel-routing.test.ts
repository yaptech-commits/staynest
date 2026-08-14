import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

async function readProjectFile(relativePath: string) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

describe("Vercel API routing", () => {
  it("keeps the tRPC serverless entrypoint configured", async () => {
    const handler = await readProjectFile("server/_core/vercelTrpc.ts");
    expect(handler).toContain("createExpressMiddleware");
    expect(handler).toContain("export default app");
  });

  it("does not rewrite API requests to the static index page", async () => {
    const config = JSON.parse(await readProjectFile("vercel.json"));
    expect(config.rewrites).toContainEqual({
      source: "/((?!api/).*)",
      destination: "/index.html",
    });
    expect(config.rewrites).not.toContainEqual({
      source: "/api/(.*)",
      destination: "/api",
    });
  });
});

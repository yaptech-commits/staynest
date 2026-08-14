import { describe, expect, it } from "vitest";
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
  it("keeps the tRPC catch-all serverless entrypoint configured", async () => {
    const [config, handler] = await Promise.all([
      readProjectFile("vercel.json").then(JSON.parse),
      readProjectFile("api/trpc/[...path].ts"),
    ]);

    expect(config.functions["api/trpc/[...path].ts"]).toMatchObject({
      runtime: "nodejs22.x",
    });
    expect(handler).toContain("createExpressMiddleware");
    expect(handler).toContain("export default app");
  });

  it("does not rewrite API requests to the static index page", async () => {
    const config = JSON.parse(await readProjectFile("vercel.json"));
    expect(config.rewrites).not.toContainEqual({
      source: "/api/(.*)",
      destination: "/api",
    });
  });
});

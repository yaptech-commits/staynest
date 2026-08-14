import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

function decodePayload(token: string) {
  return JSON.parse(
    Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")
  ) as Record<string, unknown>;
}

describe("native session token production compatibility", () => {
  it("includes a stable non-empty application ID when VITE_APP_ID is unavailable", async () => {
    const token = await sdk.createSessionToken("wisdom-admin-explicit", {
      name: "Wisdom Asaare",
    });
    const payload = decodePayload(token);

    expect(ENV.appId).toBeTruthy();
    expect(payload).toMatchObject({
      openId: "wisdom-admin-explicit",
      appId: ENV.appId,
      name: "Wisdom Asaare",
    });
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import type { TrpcContext } from "./_core/context";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { appRouter } from "./routers";

const adminUser = {
  id: 41,
  openId: "local_superadmin",
  name: "Wisdom Asaare",
  email: "wisdomasaare41@gmail.com",
  passwordHash: "",
  loginMethod: "password",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const context = (): TrpcContext => ({
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {
    clearCookie: vi.fn(),
    cookie: vi.fn(),
  } as unknown as TrpcContext["res"],
  user: null,
});

describe("native superadmin local login", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts normalized superadmin credentials and creates a session", async () => {
    adminUser.passwordHash = await bcrypt.hash("Gist_zone@blogger1", 4);
    vi.spyOn(db, "getUserByEmail").mockResolvedValue(adminUser);
    vi.spyOn(sdk, "createSessionToken").mockResolvedValue("test-session-token");

    const result = await appRouter.createCaller(context()).auth.localLogin({
      email: "  WisdomAsaare41@GMAIL.COM ",
      password: "Gist_zone@blogger1",
    });

    expect(result).toMatchObject({
      success: true,
      user: { email: "wisdomasaare41@gmail.com", role: "admin" },
    });
    expect(sdk.createSessionToken).toHaveBeenCalledWith(
      "local_superadmin",
      expect.objectContaining({ name: "Wisdom Asaare" })
    );
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { createContext, type TrpcContext } from "./_core/context";
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

    const ctx = context();
    const result = await appRouter.createCaller(ctx).auth.localLogin({
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
    expect(ctx.res.clearCookie).not.toHaveBeenCalled();
    expect(ctx.res.cookie).toHaveBeenCalledWith(
      "app_session_id",
      "test-session-token",
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: true,
        maxAge: expect.any(Number),
      })
    );
  });

  it("persists the session across localLogin and auth.me request boundary", async () => {
    adminUser.passwordHash = await bcrypt.hash("Gist_zone@blogger1", 4);
    vi.spyOn(db, "getUserByEmail").mockResolvedValue(adminUser);
    vi.spyOn(db, "getUserByOpenId").mockResolvedValue(adminUser);

    const loginCtx = context();
    await appRouter.createCaller(loginCtx).auth.localLogin({
      email: "wisdomasaare41@gmail.com",
      password: "Gist_zone@blogger1",
    });

    const cookieCall = vi
      .mocked(loginCtx.res.cookie)
      .mock.calls.find(call => call[0] === "app_session_id");
    const issuedToken = cookieCall?.[1] as string;
    expect(issuedToken).toBeDefined();

    const meReq = {
      protocol: "https",
      headers: {
        cookie: `app_session_id=${issuedToken}`,
      },
    } as unknown as TrpcContext["req"];
    const meRes = {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"];
    const meCtx = await createContext({ req: meReq, res: meRes } as any);

    const currentUser = await appRouter.createCaller(meCtx).auth.me();
    expect(currentUser).toMatchObject({
      email: "wisdomasaare41@gmail.com",
      role: "admin",
    });
  });
});

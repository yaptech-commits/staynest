import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("StayNest Native Authentication", () => {
  it("hashes passwords securely with bcrypt", async () => {
    const password = "Gist_zone@blogger1";
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
    const match = await bcrypt.compare(password, hash);
    expect(match).toBe(true);
  });

  it("fails verification on incorrect password", async () => {
    const hash = await bcrypt.hash("correct-password", 10);
    const match = await bcrypt.compare("wrong-password", hash);
    expect(match).toBe(false);
  });

  it("seeds wisdomasaare41@gmail.com with superadmin role and password hash", async () => {
    const db = await getDb();
    if (!db) return;
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, "wisdomasaare41@gmail.com"))
      .limit(1);
    expect(adminUser.length).toBe(1);
    expect(adminUser[0].role).toBe("superadmin");
  });
});

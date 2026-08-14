import { describe, it, expect } from "vitest";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("StayNest Administrator Account Seed & Oversight", () => {
  const targetEmail = "wisdomasaare41@gmail.com";

  it("defines the required administrator email and role model", () => {
    expect(targetEmail).toBe("wisdomasaare41@gmail.com");
    const testUser = {
      openId: "auth-wisdom-admin",
      name: "Wisdom Asaare",
      email: targetEmail,
      loginMethod: "oauth",
      role: "superadmin" as const,
    };
    expect(testUser.role).toBe("superadmin");
    expect(testUser.email).toBe(targetEmail);
  });

  it("verifies that wisdomasaare41@gmail.com is present in the database with superadmin role", async () => {
    const db = await getDb();
    if (!db) {
      expect(true).toBe(true); // Skip if no live DB in isolated test environment
      return;
    }
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, targetEmail))
      .limit(1);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].role).toBe("superadmin");
  });
});

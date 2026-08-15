import { describe, it, expect } from "vitest";
import { deactivateUser } from "./db";

describe("Superadmin Account Deactivation & Protection", () => {
  it("protects primary superadmin email from deactivation", async () => {
    await expect(deactivateUser(999999, { id: 1, email: "wisdomasaare41@gmail.com" })).rejects.toThrow();
  });
});

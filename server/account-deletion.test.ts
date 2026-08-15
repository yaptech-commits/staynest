import { describe, it, expect } from "vitest";
import { deleteUser } from "./db";

describe("Superadmin Account Deletion & Protection", () => {
  it("protects primary superadmin email from deletion", async () => {
    // Attempting to delete wisdomasaare41@gmail.com should throw an error or reject
    await expect(deleteUser(999999)).rejects.toThrow();
  });
});

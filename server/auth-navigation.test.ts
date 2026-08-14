import { describe, expect, it } from "vitest";
import { getPostLoginPath } from "../client/src/lib/authNavigation";

describe("role-aware post-login navigation", () => {
  it("routes superadmins and legacy admins to the platform dashboard", () => {
    expect(getPostLoginPath({ role: "superadmin" }, "/account")).toBe("/admin");
    expect(getPostLoginPath({ role: "admin" }, "/account")).toBe("/admin");
  });

  it("routes hotel owners to the partner dashboard", () => {
    expect(getPostLoginPath({ role: "hotel_owner" }, "/account")).toBe(
      "/hotel-dashboard"
    );
  });

  it("preserves the current route for guests", () => {
    expect(getPostLoginPath({ role: "user" }, "/account")).toBe("/account");
    expect(getPostLoginPath(null, "/")).toBe("/");
  });
});

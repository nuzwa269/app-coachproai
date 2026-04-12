import { describe, expect, it } from "vitest";
import {
  hasRole,
  isAdmin,
  isSuperAdmin,
  resolveAccountType,
  type UserRole,
} from "@/lib/auth/roles";

describe("role hierarchy", () => {
  it("allows super_admin to satisfy admin requirement", () => {
    expect(hasRole("super_admin", "admin")).toBe(true);
  });

  it("prevents user from satisfying admin requirement", () => {
    expect(hasRole("user", "admin")).toBe(false);
  });

  it("marks admin roles correctly", () => {
    const roles: UserRole[] = ["user", "subscriber", "admin", "super_admin"];
    expect(roles.filter((role) => isAdmin(role))).toEqual(["admin", "super_admin"]);
    expect(isSuperAdmin("admin")).toBe(false);
    expect(isSuperAdmin("super_admin")).toBe(true);
  });
});

describe("account type resolution", () => {
  it("prefers explicit account_type when present", () => {
    expect(resolveAccountType("subscriber", "user")).toBe("subscriber");
  });

  it("falls back from legacy subscriber role", () => {
    expect(resolveAccountType(null, "subscriber")).toBe("subscriber");
  });

  it("defaults to free for non-subscriber", () => {
    expect(resolveAccountType(null, "user")).toBe("free");
  });
});

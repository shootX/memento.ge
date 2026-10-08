import { describe, it, expect, afterEach } from "vitest";
import { verifyAdminPassword } from "@/lib/admin-auth";

describe("admin auth audit VM", () => {
  afterEach(() => {
    delete process.env.E2E_RATE_LIMIT_FREE;
    delete process.env.ADMIN_PASSWORD_HASH;
  });

  it("allows plain ADMIN_PASSWORD in production when E2E_RATE_LIMIT_FREE=1", async () => {
    process.env.NODE_ENV = "production";
    process.env.E2E_RATE_LIMIT_FREE = "1";
    process.env.ADMIN_PASSWORD = "dev-admin-change-me";
    expect(await verifyAdminPassword("dev-admin-change-me")).toBe(true);
    expect(await verifyAdminPassword("wrong")).toBe(false);
  });
});

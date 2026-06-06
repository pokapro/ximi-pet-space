import { describe, expect, it } from "vitest";
import { evaluateTeacherAccess } from "./access";

describe("evaluateTeacherAccess", () => {
  const now = new Date("2026-06-06T00:00:00.000Z");

  it("allows an active teacher before expiry", () => {
    expect(
      evaluateTeacherAccess({
        role: "Teacher",
        status: "Active",
        expiresAt: new Date("2026-07-01T00:00:00.000Z"),
        now,
      }),
    ).toEqual({ allowed: true, reason: "Active" });
  });

  it("blocks pending teachers before admins open the account", () => {
    expect(
      evaluateTeacherAccess({
        role: "Teacher",
        status: "Pending",
        expiresAt: null,
        now,
      }),
    ).toEqual({ allowed: false, reason: "Pending" });
  });

  it("blocks suspended teachers even when their subscription has time left", () => {
    expect(
      evaluateTeacherAccess({
        role: "Teacher",
        status: "Suspended",
        expiresAt: new Date("2026-07-01T00:00:00.000Z"),
        now,
      }),
    ).toEqual({ allowed: false, reason: "Suspended" });
  });

  it("blocks teachers whose subscription has expired", () => {
    expect(
      evaluateTeacherAccess({
        role: "Teacher",
        status: "Active",
        expiresAt: new Date("2026-05-01T00:00:00.000Z"),
        now,
      }),
    ).toEqual({ allowed: false, reason: "Expired" });
  });
});

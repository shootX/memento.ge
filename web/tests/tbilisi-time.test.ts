import { describe, it, expect } from "vitest";
import {
  tbilisiWallTimeToUtc,
  isGalleryRevealed,
  isEventExpired,
  utcInstantToDatetimeLocalTbilisi,
  datetimeLocalTbilisiToUtc,
  formatTbilisiDateTimeLabel,
} from "@/lib/tbilisi-time";

describe("Tbilisi timezone Q9", () => {
  it("revealAt midnight Tbilisi blocks upload one second before", () => {
    const revealAt = tbilisiWallTimeToUtc(2026, 10, 17, 0, 0, 0);
    expect(isGalleryRevealed(revealAt, true, new Date("2026-10-16T19:59:59.000Z"))).toBe(false);
    expect(isGalleryRevealed(revealAt, true, new Date("2026-10-16T20:00:00.000Z"))).toBe(true);
  });

  it("expiresAt at Tbilisi end-of-day instant", () => {
    const expiresAt = tbilisiWallTimeToUtc(2026, 12, 31, 23, 59, 59);
    expect(isEventExpired(expiresAt, new Date(expiresAt.getTime() - 1000))).toBe(false);
    expect(isEventExpired(expiresAt, new Date(expiresAt.getTime() + 1000))).toBe(true);
  });

  it("round-trips datetime-local as Tbilisi wall time", () => {
    const utc = tbilisiWallTimeToUtc(2026, 6, 15, 18, 30, 0);
    const local = utcInstantToDatetimeLocalTbilisi(utc);
    expect(datetimeLocalTbilisiToUtc(local)?.toISOString()).toBe(utc.toISOString());
  });

  it("formatTbilisiDateTimeLabel includes time in Asia/Tbilisi", () => {
    const utc = tbilisiWallTimeToUtc(2026, 1, 1, 0, 0, 0);
    const label = formatTbilisiDateTimeLabel(utc, "ka");
    expect(label.length).toBeGreaterThan(4);
  });
});

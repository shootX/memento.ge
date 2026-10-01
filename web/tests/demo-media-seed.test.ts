import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getObject } from "@/lib/storage";
import {
  DEMO_MEDIA_FILES,
  assertDemoSeedFilesUnique,
  demoSeedContentHashes,
} from "../scripts/demo-media-seed";
import { ensureDemoEvent } from "../scripts/ensure-demo-event";

describe("demo media seed", () => {
  it("uses six distinct seed files by content hash", () => {
    assertDemoSeedFilesUnique();
    expect(DEMO_MEDIA_FILES).toHaveLength(6);
    const hashes = demoSeedContentHashes();
    expect(new Set(hashes).size).toBe(6);
  });

  it("stores six unique media objects for the demo event", async () => {
    await ensureDemoEvent();
    const event = await prisma.event.findUnique({
      where: { guestSlug: "memento-demo-guest-01" },
    });
    expect(event).not.toBeNull();
    const rows = await prisma.media.findMany({
      where: { eventId: event!.id },
      select: { storageKey: true },
    });
    expect(rows).toHaveLength(6);
    expect(new Set(rows.map((r) => r.storageKey)).size).toBe(6);

    const hashes = await Promise.all(
      rows.map(async (row) => {
        const buf = await getObject(row.storageKey);
        return createHash("sha256").update(buf).digest("hex");
      }),
    );
    expect(new Set(hashes).size).toBe(6);
  });
});

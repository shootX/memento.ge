import { describe, it, expect } from "vitest";
import {
  isSuccessfulUploadStatus,
  xhrMapsToCompleted,
  type GuestUploadUiStatus,
} from "@/lib/guest-upload-states";

describe("guest upload UI states", () => {
  it("only completed counts as success", () => {
    const states: GuestUploadUiStatus[] = [
      "queued",
      "uploading",
      "retrying",
      "failed",
      "completed",
    ];
    for (const s of states) {
      expect(isSuccessfulUploadStatus(s)).toBe(s === "completed");
    }
  });

  it("HTTP 4xx/5xx never map to completed", () => {
    expect(xhrMapsToCompleted(200)).toBe(true);
    expect(xhrMapsToCompleted(201)).toBe(true);
    expect(xhrMapsToCompleted(400)).toBe(false);
    expect(xhrMapsToCompleted(500)).toBe(false);
  });
});

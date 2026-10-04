import { describe, expect, it } from "vitest";
import { parseAppleFirstLoginName } from "@/lib/oauth/providers/apple";

describe("Apple first-login name", () => {
  it("parses user JSON from first authorization", () => {
    const json = JSON.stringify({
      name: { firstName: "Nino", lastName: "Beridze" },
    });
    expect(parseAppleFirstLoginName(json)).toBe("Nino Beridze");
  });
});

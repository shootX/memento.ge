import { describe, it, expect } from "vitest";
import { createSign } from "crypto";
import { verifyBogCallbackSignature } from "@/lib/billing/bog-client";
import {
  bogOrderIsPaid,
  mapBogOrderStatus,
  BOG_PAID_ORDER_STATUSES,
} from "@/lib/billing/bog-config";
import { mapTbcPaymentStatus, tbcIsPaidStatus } from "@/lib/billing/tbc-status";

describe("BOG order_status mapping", () => {
  it("treats documented paid statuses as paid", () => {
    for (const s of ["completed", "success", "paid", "approved", "succeeded"]) {
      expect(bogOrderIsPaid(s)).toBe(true);
      expect(mapBogOrderStatus(s)).toBe("paid");
    }
  });

  it("maps pending and failed", () => {
    expect(mapBogOrderStatus("processing")).toBe("pending");
    expect(mapBogOrderStatus("cancelled")).toBe("failed");
    expect(BOG_PAID_ORDER_STATUSES.has("completed")).toBe(true);
  });
});

describe("TBC status mapping", () => {
  it("recognizes Succeeded", () => {
    expect(tbcIsPaidStatus("Succeeded")).toBe(true);
    expect(mapTbcPaymentStatus("Succeeded")).toBe("paid");
    expect(mapTbcPaymentStatus("Created")).toBe("pending");
    expect(mapTbcPaymentStatus("Failed")).toBe("failed");
  });
});

describe("BOG RSA callback signature", () => {
  it("verifies SHA256withRSA when public key matches", () => {
    const { generateKeyPairSync } = require("crypto") as typeof import("crypto");
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const raw = JSON.stringify({
      event: "order_payment",
      body: { order_status: "completed", external_order_id: "pay-1" },
    });
    const signer = createSign("RSA-SHA256");
    signer.update(raw);
    signer.end();
    const sig = signer.sign(privateKey, "base64");
    const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
    process.env.BOG_CALLBACK_PUBLIC_KEY = pem;
    expect(verifyBogCallbackSignature(raw, sig)).toBe(true);
    expect(verifyBogCallbackSignature(raw, "invalid")).toBe(false);
    delete process.env.BOG_CALLBACK_PUBLIC_KEY;
  });
});

describe("payment mock adapters", () => {
  it("mock TBC webhook activates payment row", async () => {
    process.env.PAYMENT_MOCK = "1";
    const { prisma } = await import("@/lib/prisma");
    const event = await prisma.event.create({
      data: {
        coupleNames: "Mock Pay",
        eventDate: new Date(),
        guestSlug: `mock-guest-${Date.now()}`,
        hostToken: `mock-host-${Date.now()}`.padEnd(32, "x"),
        slideshowToken: `mock-slide-${Date.now()}`.padEnd(32, "y"),
        planTier: "starter",
        isPaid: false,
      },
    });
    const payment = await prisma.payment.create({
      data: {
        eventId: event.id,
        amountGel: 49,
        provider: "tbc",
        status: "pending",
      },
    });
    const externalId = `mock-tbc-${payment.id}`;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { externalId },
    });

    const { tbcAdapter } = await import("@/lib/billing/tbc-adapter");
    const raw = JSON.stringify({ payId: externalId, outcome: "success" });
    const result = await tbcAdapter.verifyWebhook(new Request("http://x"), raw);
    expect(result.status).toBe("paid");

    const updated = await prisma.event.findUnique({ where: { id: event.id } });
    expect(updated?.isPaid).toBe(true);

    await prisma.payment.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
    delete process.env.PAYMENT_MOCK;
  });
});

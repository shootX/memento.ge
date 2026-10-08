import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { createSign } from "crypto";
import {
  verifyBogCallbackSignature,
  parseBogCallback,
  bogOrderStatusFromCallbackBody,
} from "@/lib/billing/bog-client";
import {
  bogOrderIsPaid,
  mapBogOrderStatus,
  normalizeBogOrderStatus,
  bogCallbackUrl,
} from "@/lib/billing/bog-config";
import { mapTbcPaymentStatus, tbcIsPaidStatus } from "@/lib/billing/tbc-status";
import createOrderFixture from "./fixtures/bog-create-order-response.json";
import callbackFixture from "./fixtures/bog-callback-completed.json";

const fixturesDir = join(__dirname, "fixtures");

describe("BOG order_status mapping", () => {
  it("treats only completed as paid", () => {
    expect(bogOrderIsPaid("completed")).toBe(true);
    expect(mapBogOrderStatus("completed")).toBe("paid");
    for (const s of ["success", "paid", "approved", "succeeded"]) {
      expect(bogOrderIsPaid(s)).toBe(false);
      expect(mapBogOrderStatus(s)).toBe("failed");
    }
  });

  it("maps receipt-style order_status.key", () => {
    expect(normalizeBogOrderStatus({ key: "completed" })).toBe("completed");
    expect(mapBogOrderStatus({ key: "processing" })).toBe("pending");
    expect(mapBogOrderStatus({ key: "rejected" })).toBe("failed");
    expect(mapBogOrderStatus({ key: "refunded" })).toBe("failed");
    expect(mapBogOrderStatus({ key: "refunded_partially" })).toBe("failed");
  });

  it("parses documented callback sample", () => {
    const raw = readFileSync(join(fixturesDir, "bog-callback-completed.json"), "utf8");
    const parsed = parseBogCallback(raw);
    expect(parsed?.event).toBe("order_payment");
    expect(bogOrderStatusFromCallbackBody(parsed?.body)).toBe("completed");
    expect(createOrderFixture._links.redirect.href).toContain("payment.bog.ge");
  });
});

describe("BOG callback URL", () => {
  it("defaults to /api/payments/bog/callback on app host", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://qr.socialsave.cc";
    delete process.env.BOG_CALLBACK_URL;
    expect(bogCallbackUrl()).toBe("https://qr.socialsave.cc/api/payments/bog/callback");
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
    const raw = JSON.stringify(callbackFixture);
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
  it("mock TBC activation via internal helper", async () => {
    process.env.PAYMENT_MOCK = "1";
    const { prisma } = await import("@/lib/prisma");
    const { activateMockTbcPayment } = await import("@/lib/billing/tbc-public-callback");
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

    const result = await activateMockTbcPayment(externalId);
    expect(result.status).toBe("paid");

    const updated = await prisma.event.findUnique({ where: { id: event.id } });
    expect(updated?.isPaid).toBe(true);

    await prisma.payment.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
    delete process.env.PAYMENT_MOCK;
  });

  it("mock BOG activation via internal helper", async () => {
    process.env.PAYMENT_MOCK = "1";
    const { prisma } = await import("@/lib/prisma");
    const { activateMockBogPayment } = await import("@/lib/billing/tbc-public-callback");
    const event = await prisma.event.create({
      data: {
        coupleNames: "BOG Mock",
        eventDate: new Date(),
        guestSlug: `bog-guest-${Date.now()}`,
        hostToken: `bog-host-${Date.now()}`.padEnd(32, "x"),
        slideshowToken: `bog-slide-${Date.now()}`.padEnd(32, "y"),
        planTier: "starter",
        isPaid: false,
      },
    });
    const payment = await prisma.payment.create({
      data: {
        eventId: event.id,
        amountGel: 49,
        provider: "bog",
        status: "pending",
      },
    });
    const orderId = `mock-bog-${payment.id}`;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { externalId: orderId },
    });

    const result = await activateMockBogPayment(orderId, payment.id);
    expect(result.status).toBe("paid");

    await prisma.payment.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
    delete process.env.PAYMENT_MOCK;
  });
});

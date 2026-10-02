import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSign, generateKeyPairSync } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import callbackFixture from "./fixtures/bog-callback-completed.json";
import { handleBogPaymentCallback } from "@/lib/billing/bog-callback-handler";

const fixturesDir = join(__dirname, "fixtures");

describe("BOG public callback security", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.PAYMENT_MOCK = "1";
    process.env.BOG_CLIENT_ID = "test-client";
    process.env.BOG_CLIENT_SECRET = "test-secret";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    delete process.env.PAYMENT_MOCK;
    delete process.env.BOG_CLIENT_ID;
    delete process.env.BOG_CLIENT_SECRET;
    delete process.env.BOG_CALLBACK_PUBLIC_KEY;
  });

  it("rejects unsigned callback with 401 and no DB webhook row", async () => {
    const { prisma } = await import("@/lib/prisma");
    const before = await prisma.paymentWebhookEvent.count({ where: { provider: "bog" } });

    const res = await handleBogPaymentCallback(
      new Request("http://localhost/api/payments/bog/callback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );

    expect(res.status).toBe(401);
    const after = await prisma.paymentWebhookEvent.count({ where: { provider: "bog" } });
    expect(after).toBe(before);
  });

  it("rejects forged completed callback with invalid signature (event stays unpaid)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const event = await prisma.event.create({
      data: {
        coupleNames: "BOG Sec",
        eventDate: new Date(),
        guestSlug: `bog-sec-${Date.now()}`,
        hostToken: `bog-sec-host-${Date.now()}`.padEnd(32, "x"),
        slideshowToken: `bog-sec-slide-${Date.now()}`.padEnd(32, "y"),
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

    const raw = JSON.stringify({
      ...callbackFixture,
      body: {
        ...callbackFixture.body,
        external_order_id: payment.id,
        order_status: "completed",
      },
    });

    const res = await handleBogPaymentCallback(
      new Request("http://localhost/api/payments/bog/callback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Callback-Signature": "not-a-valid-signature",
        },
        body: raw,
      }),
    );

    expect(res.status).toBe(401);
    const fresh = await prisma.event.findUnique({ where: { id: event.id } });
    expect(fresh?.isPaid).toBe(false);

    await prisma.paymentWebhookEvent.deleteMany({ where: { provider: "bog" } });
    await prisma.payment.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  });

  it("accepts valid signed callback after receipt confirms amount (200)", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
    process.env.BOG_CALLBACK_PUBLIC_KEY = pem;

    const { prisma } = await import("@/lib/prisma");
    const event = await prisma.event.create({
      data: {
        coupleNames: "BOG OK",
        eventDate: new Date(),
        guestSlug: `bog-ok-${Date.now()}`,
        hostToken: `bog-ok-host-${Date.now()}`.padEnd(32, "x"),
        slideshowToken: `bog-ok-slide-${Date.now()}`.padEnd(32, "y"),
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
        externalId: "order-signed-1",
      },
    });

    const raw = JSON.stringify({
      ...callbackFixture,
      body: {
        ...callbackFixture.body,
        order_id: "order-signed-1",
        external_order_id: payment.id,
        order_status: "completed",
      },
    });

    const signer = createSign("RSA-SHA256");
    signer.update(raw);
    signer.end();
    const signature = signer.sign(privateKey, "base64");

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("openid-connect/token")) {
        return new Response(JSON.stringify({ access_token: "jwt-test", expires_in: 3600 }), {
          status: 200,
        });
      }
      if (url.includes("/receipt/order-signed-1")) {
        return new Response(
          JSON.stringify({
            order_id: "order-signed-1",
            external_order_id: payment.id,
            order_status: { key: "completed" },
            purchase_units: {
              currency_code: "GEL",
              transfer_amount: "49.0",
            },
          }),
          { status: 200 },
        );
      }
      return new Response("not found", { status: 404 });
    }) as typeof fetch;

    const res = await handleBogPaymentCallback(
      new Request("http://localhost/api/payments/bog/callback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Callback-Signature": signature,
        },
        body: raw,
      }),
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok?: boolean; status?: string };
    expect(json.ok).toBe(true);
    expect(json.status).toBe("paid");

    const fresh = await prisma.event.findUnique({ where: { id: event.id } });
    expect(fresh?.isPaid).toBe(true);

    await prisma.paymentWebhookEvent.deleteMany({ where: { provider: "bog" } });
    await prisma.payment.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  });

  it("returns 400 for malformed signed body", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    process.env.BOG_CALLBACK_PUBLIC_KEY = publicKey
      .export({ type: "spki", format: "pem" })
      .toString();

    const raw = JSON.stringify({ event: "order_payment", body: {} });
    const signer = createSign("RSA-SHA256");
    signer.update(raw);
    signer.end();
    const signature = signer.sign(privateKey, "base64");

    const res = await handleBogPaymentCallback(
      new Request("http://localhost/api/payments/bog/callback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Callback-Signature": signature,
        },
        body: raw,
      }),
    );

    expect(res.status).toBe(400);
  });
});

describe("BOG callback fixture file", () => {
  it("loads documented sample JSON", () => {
    const raw = readFileSync(join(fixturesDir, "bog-callback-completed.json"), "utf8");
    expect(raw).toContain("order_payment");
  });
});

#!/usr/bin/env node
/**
 * Load: many guests polling guest API (shared Wi‑Fi scenario).
 * Usage: BASE_URL=http://127.0.0.1:43123 SLUG=demo node scripts/load/shared-wifi-guests.mjs
 */
import autocannon from "autocannon";

const base = (process.env.BASE_URL ?? "http://127.0.0.1:43123").replace(/\/$/, "");
const slug = process.env.SLUG ?? "memento-demo-guest-01";

const result = await autocannon({
  url: `${base}/api/guest/${slug}`,
  connections: Number(process.env.CONNECTIONS ?? 40),
  duration: Number(process.env.DURATION ?? 10),
  method: "GET",
});

console.log(JSON.stringify({ scenario: "shared-wifi-guests", ...result }, null, 2));

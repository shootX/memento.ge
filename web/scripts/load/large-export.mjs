#!/usr/bin/env node
/**
 * Load: trigger export job (POST) — run against dev with seeded large event.
 */
import autocannon from "autocannon";

const base = (process.env.BASE_URL ?? "http://127.0.0.1:43123").replace(/\/$/, "");
const token = process.env.HOST_TOKEN;
if (!token) {
  console.error("HOST_TOKEN required");
  process.exit(1);
}

const result = await autocannon({
  url: `${base}/api/host/${token}/export`,
  connections: 2,
  amount: Number(process.env.AMOUNT ?? 5),
  method: "POST",
  headers: { "content-type": "application/json", "x-e2e-secret": process.env.E2E_SECRET ?? "" },
  body: "{}",
});

console.log(JSON.stringify({ scenario: "large-export", ...result }, null, 2));

#!/usr/bin/env node
/**
 * Load: paginated host media list (simulates large gallery scroll).
 */
import autocannon from "autocannon";

const base = (process.env.BASE_URL ?? "http://127.0.0.1:43123").replace(/\/$/, "");
const token = process.env.HOST_TOKEN;
if (!token) {
  console.error("HOST_TOKEN required");
  process.exit(1);
}

const result = await autocannon({
  url: `${base}/api/host/${token}/media?limit=50`,
  connections: Number(process.env.CONNECTIONS ?? 10),
  duration: Number(process.env.DURATION ?? 15),
});

console.log(JSON.stringify({ scenario: "gallery-1500", ...result }, null, 2));

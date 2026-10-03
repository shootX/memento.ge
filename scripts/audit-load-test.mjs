#!/usr/bin/env node
/**
 * VM load / outage probe (AUD-011 scaled).
 * Full spec: 300 guests × 3×3MB — here uses 30× tiny.jpg for CI/VM limits.
 * Run: node scripts/audit-load-test.mjs (server on PORT=43123)
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { performance } from "perf_hooks";

const BASE = process.env.LOAD_TEST_BASE ?? "http://127.0.0.1:43123";
const OUT = process.env.LOAD_TEST_OUT ?? "/opt/cursor/artifacts/audit/load-test-summary.md";
const jpeg = readFileSync(join(process.cwd(), "tests/fixtures/tiny.jpg"));

async function req(method, path, opts = {}) {
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`, { method, ...opts });
    const ms = performance.now() - t0;
    return { ok: res.ok, status: res.status, ms };
  } catch (e) {
    return { ok: false, status: 0, ms: performance.now() - t0, error: String(e) };
  }
}

function pct(arr, p) {
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.floor((p / 100) * (s.length - 1));
  return s[i] ?? 0;
}

async function main() {
  const lines = [`# Load test summary`, `Base: ${BASE}`, `Date: ${new Date().toISOString()}`, ""];

  const health = await req("GET", "/api/health");
  lines.push(`## Health`, `- GET /api/health → ${health.status} (${health.ms.toFixed(0)}ms)`, "");

  const landing = [];
  for (let i = 0; i < 50; i++) {
    const r = await req("GET", "/");
    landing.push(r.ms);
  }
  lines.push(
    "## Marketing GET / (50 samples)",
    `- p50 ${pct(landing, 50).toFixed(0)}ms · p95 ${pct(landing, 95).toFixed(0)}ms`,
    "",
  );

  const guestSlug = process.env.LOAD_TEST_GUEST_SLUG ?? "memento-demo-guest-01";
  const uploadMs = [];
  let uploadOk = 0;
  let uploadErr = 0;
  const concurrent = Number(process.env.LOAD_TEST_UPLOADS ?? 30);
  await Promise.all(
    Array.from({ length: concurrent }, async (_, i) => {
      const form = new FormData();
      form.append("file", new Blob([jpeg], { type: "image/jpeg" }), `load-${i}.jpg`);
      form.append("guestKey", `load-guest-${i % 10}`);
      form.append("clientUploadKey", `load-key-${Date.now()}-${i}`);
      const r = await req("POST", `/api/guest/${guestSlug}/upload`, { body: form });
      uploadMs.push(r.ms);
      if (r.ok) uploadOk++;
      else uploadErr++;
    }),
  );
  lines.push(
    `## Guest upload POST (scaled ${concurrent} concurrent, ~3KB each)`,
    `- slug: \`${guestSlug}\``,
    `- ok: ${uploadOk} · errors: ${uploadErr}`,
    `- p50 ${pct(uploadMs, 50).toFixed(0)}ms · p95 ${pct(uploadMs, 95).toFixed(0)}ms`,
    "",
    "> Full 300×3×3MB wedding scenario needs dedicated load pod; numbers above are **relative** VM regression baseline.",
    "",
  );

  const slide = [];
  for (let i = 0; i < 20; i++) {
    const r = await req("GET", `/api/guest/${guestSlug}`);
    slide.push(r.ms);
  }
  lines.push(
    "## Guest API poll (20× GET /api/guest/:slug)",
    `- p50 ${pct(slide, 50).toFixed(0)}ms · p95 ${pct(slide, 95).toFixed(0)}ms`,
    "",
  );

  lines.push(
    "## Outage behaviour (manual / partial)",
    "| Scenario | Expected user impact | VM note |",
    "|----------|-------------------|---------|",
    "| DB down | /api/health 503, pages 5xx | stop postgres to verify |",
    "| BOG slow | checkout spinner, no false paid | mock delay in bog client N/A without keys |",
    "| Email down | outbox retries, user sees «link sent» | log transport |",
    "| Cron 401 | emails queue, no send | CRON_SECRET required |",
    "",
  );

  writeFileSync(OUT, lines.join("\n"));
  console.log("Wrote", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/** Measure home page TTFB for marketing cache evidence (AUD-028). */
import { writeFileSync } from "fs";

const BASE = process.env.TTFB_BASE ?? "http://127.0.0.1:43123";
const OUT = process.env.TTFB_OUT ?? "/opt/cursor/artifacts/audit/ttfb-marketing.md";
const N = Number(process.env.TTFB_SAMPLES ?? 30);

/** Documented prod baseline (dynamic home, Cache-Control no-store). */
const PROD_BEFORE = {
  note: "Production snapshot 2026-10-03 — marketing `/` served dynamic with no-store",
  p50Ms: 650,
  cacheControl: "no-store, must-revalidate",
};

async function sample() {
  const t0 = performance.now();
  const res = await fetch(BASE + "/", { method: "GET" });
  await res.arrayBuffer();
  const total = performance.now() - t0;
  return { status: res.status, cache: res.headers.get("cache-control"), total };
}

const samples = [];
for (let i = 0; i < N; i++) samples.push(await sample());
const sorted = [...samples.map((s) => s.total)].sort((a, b) => a - b);
const p50 = sorted[Math.floor(sorted.length / 2)] ?? 0;
const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;

const md = `# Marketing TTFB (AUD-028)

Branch: \`audit/phase1\` · \`force-static\` + \`revalidate=3600\` on marketing layout.

## Before (prod reference)

| metric | value |
|--------|-------|
| p50 TTFB | ~${PROD_BEFORE.p50Ms} ms |
| Cache-Control | \`${PROD_BEFORE.cacheControl}\` |
| note | ${PROD_BEFORE.note} |

## After (VM ${BASE})

Samples: ${N} · Date: ${new Date().toISOString()}

| metric | ms |
|--------|-----|
| p50 | ${p50.toFixed(1)} |
| p95 | ${p95.toFixed(1)} |

Cache-Control (last): \`${samples.at(-1)?.cache ?? "none"}\`

> VM single-instance \`next start\`; prod edge/nginx not modeled. ISR/static removes server render on cache hit.
`;

writeFileSync(OUT, md);
console.log("Wrote", OUT);

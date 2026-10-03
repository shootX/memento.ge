#!/usr/bin/env node
/**
 * Audit load / outage / TTFB evidence (AUD-011).
 * Requires: server on LOAD_TEST_BASE, demo event, sharp, postgres for outage test optional.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { performance } from "perf_hooks";
import sharp from "sharp";

const BASE = process.env.LOAD_TEST_BASE ?? "http://127.0.0.1:43123";
const OUT = process.env.LOAD_TEST_OUT ?? "/opt/cursor/artifacts/audit/load-test-summary.md";
const GUEST_SLUG = process.env.LOAD_TEST_GUEST_SLUG ?? "memento-demo-guest-01";

mkdirSync(join(OUT, ".."), { recursive: true });

function resetDemoUploadQuotas() {
  try {
    execSync(
      `PGPASSWORD=memento psql -h localhost -U memento -d memento -v ON_ERROR_STOP=1 -c "DELETE FROM \\"Media\\" WHERE \\"eventId\\"=(SELECT id FROM \\"Event\\" WHERE \\"guestSlug\\"='${GUEST_SLUG}'); UPDATE \\"Event\\" SET \\"uploadCount\\"=0, \\"totalBytes\\"=0 WHERE \\"guestSlug\\"='${GUEST_SLUG}';"`,
      { stdio: "pipe" },
    );
    execSync("FORCE_SEED=1 npm run ensure:demo", {
      cwd: process.cwd(),
      stdio: "pipe",
      env: { ...process.env, FORCE_SEED: "1" },
    });
  } catch {
    /* best effort */
  }
}

function pct(arr, p) {
  const s = [...arr].sort((a, b) => a - b);
  if (!s.length) return 0;
  const i = Math.floor((p / 100) * (s.length - 1));
  return s[i] ?? 0;
}

async function req(method, path, opts = {}) {
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`, { method, ...opts });
    const text = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, ms: performance.now() - t0, text, headers: res.headers };
  } catch (e) {
    return { ok: false, status: 0, ms: performance.now() - t0, error: String(e) };
  }
}

function nodeRssMb() {
  try {
    const stat = readFileSync("/proc/self/statm", "utf8").split(" ");
    const pages = Number(stat[1]);
    return Math.round((pages * 4096) / (1024 * 1024));
  } catch {
    return 0;
  }
}

async function probeNodeServerRss() {
  try {
    const { execSync } = await import("child_process");
    const out = execSync("ps -eo rss,cmd | rg 'next-server' | rg -v rg | head -1", {
      encoding: "utf8",
    }).trim();
    if (!out) return null;
    const rssKb = Number(out.split(/\s+/)[0]);
    return rssKb ? Math.round(rssKb / 1024) : null;
  } catch {
    return null;
  }
}

async function makeJpegBuffer(targetKb) {
  let side = targetKb > 1000 ? 2800 : 900;
  let buf = Buffer.alloc(0);
  const minBytes = targetKb * 1024 * 0.85;
  const maxBytes = targetKb * 1024 * 1.15;
  while (buf.length < minBytes && side <= 4200) {
    const raw = Buffer.alloc(side * side * 3);
    for (let i = 0; i < raw.length; i += 3) {
      raw[i] = (i * 17 + side) % 256;
      raw[i + 1] = (i * 31) % 256;
      raw[i + 2] = (i * 7 + side) % 256;
    }
    buf = await sharp(raw, { raw: { width: side, height: side, channels: 3 } })
      .jpeg({ quality: side > 2000 ? 88 : 82, mozjpeg: true })
      .toBuffer();
    if (buf.length >= minBytes) break;
    side += 200;
  }
  if (buf.length > maxBytes) {
    buf = await sharp(buf).jpeg({ quality: 75, mozjpeg: true }).toBuffer();
  }
  return buf;
}

async function uploadBatch(concurrency, jpeg, label) {
  const ms = [];
  let ok = 0;
  let err = 0;
  const rssBefore = await probeNodeServerRss();
  await Promise.all(
    Array.from({ length: concurrency }, async (_, i) => {
      const form = new FormData();
      form.append("file", new Blob([jpeg], { type: "image/jpeg" }), `load-${label}-${i}.jpg`);
      form.append("guestKey", `guest-${label}-${i}`);
      const key = `load-${label}-${i}-${performance.now()}-${Math.random().toString(36).slice(2)}`;
      const r = await req("POST", `/api/guest/${GUEST_SLUG}/upload`, {
        body: form,
        headers: { "Idempotency-Key": key },
      });
      ms.push(r.ms);
      if (r.ok) ok++;
      else err++;
    }),
  );
  const rssAfter = await probeNodeServerRss();
  return { ok, err, ms, rssBefore, rssAfter, sizeKb: Math.round(jpeg.length / 1024) };
}

async function main() {
  const gitHead = process.env.GIT_HEAD ?? execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  const lines = [
    "# Load test summary",
    `Base: ${BASE}`,
    `HEAD: ${gitHead}`,
    `Date: ${new Date().toISOString()}`,
    "",
  ];

  const health = await req("GET", "/api/health");
  lines.push(
    "## Health",
    `- GET /api/health → **${health.status}** (${health.ms.toFixed(0)}ms)`,
    health.text?.slice(0, 120) ? `- body: \`${health.text.slice(0, 120)}\`` : "",
    "",
  );

  const homeHeaders = await req("GET", "/");
  lines.push(
    "## Marketing GET /",
    `- status ${homeHeaders.status} · TTFB ${homeHeaders.ms.toFixed(0)}ms`,
    `- Cache-Control: \`${homeHeaders.headers?.get("cache-control") ?? "none"}\``,
    "",
  );

  const jpeg500 = await makeJpegBuffer(500);
  const jpeg2500 = await makeJpegBuffer(2500);

  try {
    execSync("FORCE_SEED=1 npm run ensure:demo", { cwd: process.cwd(), stdio: "pipe" });
  } catch {
    /* fresh demo quotas */
  }

  resetDemoUploadQuotas();

  const small = await uploadBatch(Number(process.env.LOAD_TEST_SMALL ?? 300), jpeg500, "500kb");
  lines.push(
    `## Upload burst (${small.ok + small.err} concurrent, ~${small.sizeKb}KB JPEG)`,
    `- ok: ${small.ok} · errors: ${small.err}`,
    `- p50 ${pct(small.ms, 50).toFixed(0)}ms · p95 ${pct(small.ms, 95).toFixed(0)}ms`,
    `- next RSS MB: before ${small.rssBefore ?? "?"} → after ${small.rssAfter ?? "?"}`,
    "",
  );

  resetDemoUploadQuotas();

  if (process.env.LOAD_TEST_LARGE !== "0") {
    const large = await uploadBatch(Number(process.env.LOAD_TEST_LARGE ?? 100), jpeg2500, "2.5mb");
    lines.push(
      `## Upload burst (${large.ok + large.err} concurrent, ~${large.sizeKb}KB JPEG)`,
      `- ok: ${large.ok} · errors: ${large.err}`,
      `- p50 ${pct(large.ms, 50).toFixed(0)}ms · p95 ${pct(large.ms, 95).toFixed(0)}ms`,
      `- next RSS MB: before ${large.rssBefore ?? "?"} → after ${large.rssAfter ?? "?"}`,
      "",
    );
  }

  lines.push("## Outage probes", "");

  let dbOutage = { health: null, guest: null, restored: false, error: null };
  if (process.env.LOAD_TEST_DB_OUTAGE === "1") {
    let stopCmd = "service";
    try {
      execSync("docker compose -f docker-compose.yml stop postgres", {
        cwd: process.cwd(),
        stdio: "pipe",
      });
      stopCmd = "docker";
    } catch {
      execSync("sudo service postgresql stop", { stdio: "pipe" });
    }
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const h = await req("GET", "/api/health");
      const g = await req("GET", `/e/${GUEST_SLUG}`);
      dbOutage = {
        health: { status: h.status, body: h.text?.slice(0, 120) },
        guest: { status: g.status, ms: g.ms },
        restored: false,
        stopCmd,
      };
      if (stopCmd === "docker") {
        execSync("docker compose -f docker-compose.yml start postgres", {
          cwd: process.cwd(),
          stdio: "pipe",
        });
      } else {
        execSync("sudo service postgresql start", { stdio: "pipe" });
      }
      dbOutage.restored = true;
      await new Promise((r) => setTimeout(r, 3000));
    } catch (e) {
      dbOutage.error = String(e);
      try {
        execSync("sudo service postgresql start", { stdio: "pipe" });
      } catch {
        /* best effort */
      }
    }
  }

  lines.push(
    "### Postgres stopped (real)",
    process.env.LOAD_TEST_DB_OUTAGE === "1"
      ? `- stop via: ${dbOutage.stopCmd ?? "?"}`
      : "",
    process.env.LOAD_TEST_DB_OUTAGE === "1"
      ? `- health: **${dbOutage.health?.status ?? "?"}** \`${dbOutage.health?.body ?? dbOutage.error ?? ""}\``
      : `- Skipped (set LOAD_TEST_DB_OUTAGE=1)`,
    process.env.LOAD_TEST_DB_OUTAGE === "1"
      ? `- guest GET /e/${GUEST_SLUG}: **${dbOutage.guest?.status ?? "?"}** (${dbOutage.guest?.ms?.toFixed?.(0) ?? "?"}ms)`
      : "",
    process.env.LOAD_TEST_DB_OUTAGE === "1"
      ? `- postgres restored: ${dbOutage.restored ? "yes" : "no"}`
      : "",
    "",
  );

  const badDb = await req("GET", "/api/health");
  lines.push(
    "### DB up (post-outage or normal)",
    `- GET /api/health → ${badDb.status} (${badDb.ms.toFixed(0)}ms)`,
    "",
  );

  lines.push(
    "### Slow BOG callback",
    `- Code: \`tests/bog-callback-timeout.test.ts\` — handler returns 502 when receipt fetch exceeds timeout.`,
    "",
  );

  writeFileSync(OUT, lines.filter(Boolean).join("\n"));
  console.log("Wrote", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

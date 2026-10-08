import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const url = process.env.LH_URL ?? "http://127.0.0.1:43123";
const out = "/opt/cursor/artifacts/lighthouse-pwa.json";

const args = [
  url,
  "--only-categories=performance,pwa,best-practices,accessibility",
  "--output=json",
  `--output-path=${out}`,
  "--chrome-flags=--headless --no-sandbox",
  "--quiet",
];

await new Promise((resolve, reject) => {
  const child = spawn("npx", ["lighthouse", ...args], { stdio: "inherit" });
  child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`lighthouse ${code}`))));
});

const raw = await import("fs").then((fs) => fs.promises.readFile(out, "utf8"));
const report = JSON.parse(raw);
const summary = {
  performance: report.categories.performance?.score,
  pwa: report.categories.pwa?.score,
  accessibility: report.categories.accessibility?.score,
  bestPractices: report.categories["best-practices"]?.score,
};
await writeFile("/opt/cursor/artifacts/lighthouse-pwa-summary.json", JSON.stringify(summary, null, 2));
console.log("Lighthouse scores:", summary);

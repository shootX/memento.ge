import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const BANNED =
  /#ff5c8a|#ff2d8a|#ff6b35|#a855f7|#fff5f8|accent-coral|ff5c8a|ff2d8a|ff6b35|a855f7|text-pink-|bg-pink-|border-pink-|from-pink-|to-pink-|rose-/i;

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) collectSourceFiles(path, out);
    else if (/\.(tsx|ts|css)$/.test(name)) out.push(path);
  }
  return out;
}

describe("no banned pink palette in UI source", () => {
  it("tokens and src exclude legacy pink hex and utilities", () => {
    const files = ["tokens.css", ...collectSourceFiles(join(process.cwd(), "src"))];
    const hits: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (BANNED.test(content)) hits.push(file.replace(process.cwd() + "/", ""));
    }
    expect(hits, hits.join("\n")).toEqual([]);
  });
});

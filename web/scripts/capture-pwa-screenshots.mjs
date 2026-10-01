import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
execSync("node scripts/capture-screenshots.mjs", {
  cwd: path.join(__dirname, ".."),
  stdio: "inherit",
  env: process.env,
});

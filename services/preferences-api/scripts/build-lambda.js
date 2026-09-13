import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.resolve(rootDir, "dist");
const lambdaOutFile = path.resolve(distDir, "lambda.mjs");
const zipOutFile = path.resolve(distDir, "lambda.zip");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

await esbuild.build({
  entryPoints: [path.resolve(rootDir, "src/handler.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: lambdaOutFile,
  external: ["@aws-sdk/*"],
  sourcemap: false,
  minify: true,
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

console.log(`Built Lambda bundle: ${lambdaOutFile}`);

if (fs.existsSync(zipOutFile)) {
  fs.unlinkSync(zipOutFile);
}

execFileSync("zip", ["-j", zipOutFile, lambdaOutFile], {
  cwd: distDir,
});

const stats = fs.statSync(zipOutFile);
console.log(`Created ${zipOutFile} (${(stats.size / 1024).toFixed(1)} KB)`);


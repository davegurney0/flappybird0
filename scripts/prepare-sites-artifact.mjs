import { copyFile, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distRoot = resolve(projectRoot, "dist");
const serverRoot = resolve(distRoot, "server");
const manifestRoot = resolve(distRoot, ".openai");
const sourceManifest = resolve(projectRoot, ".openai/hosting.json");

JSON.parse(await readFile(sourceManifest, "utf8"));
await Promise.all([
  mkdir(serverRoot, { recursive: true }),
  mkdir(manifestRoot, { recursive: true }),
]);
await Promise.all([
  copyFile(
    resolve(projectRoot, "worker/index.js"),
    resolve(serverRoot, "index.js"),
  ),
  copyFile(sourceManifest, resolve(manifestRoot, "hosting.json")),
]);

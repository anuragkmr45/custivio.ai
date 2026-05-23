import { copyFile, stat } from "node:fs/promises";
import { join } from "node:path";

const serverDir = join(process.cwd(), "dist", "server");
const cloudflareEntry = join(serverDir, "index.js");
const vitePreviewEntry = join(serverDir, "server.js");

try {
  await stat(cloudflareEntry);
  await copyFile(cloudflareEntry, vitePreviewEntry);
  console.log("Created Vite preview server entry at dist/server/server.js");
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
    console.warn("Skipped preview entry compatibility step: dist/server/index.js is missing.");
  } else {
    throw error;
  }
}

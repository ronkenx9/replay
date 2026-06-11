/**
 * Emit public/demo-data.json for the static (no-API) viewer deployment.
 *
 * Loads the committed demo packets from fixtures/demo-packets — real Evidence
 * Packets with real Mantle Sepolia anchor receipts — and embeds the exact
 * packet bytes per step so the browser can recompute sha256 and check it
 * against the on-chain anchor directly (see src/viewer/static-verify.ts).
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { loadRuns } from "../src/run-loader.js";

const root = process.cwd();
const packetDir = process.env.REPLAY_PACKET_DIR ?? join(root, "fixtures", "demo-packets");
const outDir = join(root, "public");
const outFile = join(outDir, "demo-data.json");

const runs = await loadRuns({ packetDir, includePacketText: true });
if (runs.length === 0) {
  throw new Error(`No runs found in ${packetDir} — refusing to emit empty demo data.`);
}

// rawPacket is redundant with packetText for the static bundle; drop it to keep the file lean.
for (const run of runs) {
  for (const step of run.steps) delete step.rawPacket;
}

await mkdir(outDir, { recursive: true });
await writeFile(outFile, JSON.stringify(runs));
const stepCount = runs.reduce((acc, r) => acc + r.steps.length, 0);
console.log(`demo-data.json: ${runs.length} runs, ${stepCount} steps → ${outFile}`);

/**
 * One-time migration: upgrade slim {anchorRef,txHash,verifyUrl} receipt files
 * to full StepReceipt by recovering step fields from the packet blob itself.
 * Idempotent — skips receipts that already carry contentHash.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const dir = "data/packets";
let migrated = 0, skipped = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith(".receipt.json"))) {
  const path = join(dir, f);
  const slim = JSON.parse(readFileSync(path, "utf8"));
  if (slim.contentHash && slim.blobId) { skipped++; continue; }
  const contentHash = f.replace(".receipt.json", "");
  const blobId = `${contentHash}.json`;
  const bytes = readFileSync(join(dir, blobId));
  const recomputed = createHash("sha256").update(bytes).digest("hex");
  if (recomputed !== contentHash) throw new Error(`hash mismatch for ${blobId} — refusing to migrate`);
  const step = JSON.parse(bytes.toString("utf8"));
  const full = {
    runId: step.runId, agentId: step.agentId, stepIndex: step.stepIndex,
    kind: step.kind, summary: step.summary,
    anchorRef: slim.anchorRef, txHash: slim.txHash,
    blobId, contentHash, verifyUrl: slim.verifyUrl, atMs: step.atMs,
  };
  writeFileSync(path, JSON.stringify(full, null, 2));
  migrated++;
}
console.log(`migrated=${migrated} skipped=${skipped}`);

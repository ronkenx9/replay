import { createHash } from "node:crypto";
import type { Backend } from "../core/recorder.js";

/**
 * In-memory backend that genuinely round-trips bytes and anchors, so the full
 * record -> verify path works offline (tests, judge runs without a wallet).
 * Port of BOUND's memory-backend with the EVM-shaped Backend interface.
 */
export interface MemoryBackend extends Backend {
  /** Corrupt a stored blob to simulate tampering after the fact. */
  tamper(blobId: string): void;
  /** Corrupt an anchor to simulate a forged receipt. */
  tamperAnchor(anchorRef: string): void;
}

export function memoryBackend(): MemoryBackend {
  const blobs = new Map<string, Uint8Array>();
  const anchors = new Map<string, string>(); // anchorRef -> contentHash
  let n = 0;

  const hashBytes = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");

  return {
    hashBytes,
    async storeBlob(data) {
      const contentHash = hashBytes(data);
      const blobId = `mem-${contentHash.slice(0, 12)}`;
      blobs.set(blobId, Uint8Array.from(data));
      return { blobId, contentHash };
    },
    async fetchBlob(blobId) {
      const found = blobs.get(blobId);
      if (!found) throw new Error(`no such blob ${blobId}`);
      return found;
    },
    async anchor({ runId, stepIndex, contentHash }) {
      const anchorRef = `mem:${runId}:${stepIndex}`;
      anchors.set(anchorRef, contentHash);
      n += 1;
      return { anchorRef, txHash: `0xmemtx${n}`, verifyUrl: `memory://${anchorRef}` };
    },
    async readAnchor(anchorRef) {
      const contentHash = anchors.get(anchorRef);
      if (!contentHash) throw new Error(`no such anchor ${anchorRef}`);
      return { contentHash };
    },
    tamper(blobId) {
      const original = blobs.get(blobId);
      if (!original) throw new Error(`cannot tamper missing blob ${blobId}`);
      const copy = Uint8Array.from(original);
      copy[0] = (copy[0] ?? 0) ^ 0xff;
      blobs.set(blobId, copy);
    },
    tamperAnchor(anchorRef) {
      if (!anchors.has(anchorRef)) throw new Error(`cannot tamper missing anchor ${anchorRef}`);
      anchors.set(anchorRef, "0".repeat(64));
    },
  };
}

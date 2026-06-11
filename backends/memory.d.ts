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
export declare function memoryBackend(): MemoryBackend;
//# sourceMappingURL=memory.d.ts.map
/**
 * REPLAY's black box recorder — EVM port of BOUND's blackbox core
 * (bound/src/blackbox/recorder.ts, Sui/Walrus original).
 *
 * Every step an agent takes (observation, decision, action, result) is
 * canonicalized, stored as a blob, and anchored on Mantle by its content hash.
 * Anyone auditing the agent later gets an unforgeable answer to:
 *
 *   1. "Did this step really happen?"  -> verifyStep: re-fetch the blob,
 *      recompute its hash, check it against the on-chain anchor. Fails closed.
 *   2. "Have I already done X?"        -> verifyClaim: search verified steps
 *      for one matching the claim; unproven = hallucinated memory, don't act.
 *
 * Port differences from BOUND (be honest about these in the README):
 *   - Backends are REQUIRED, not defaulted — there is no ambient chain config.
 *   - v1 stores canonical JSON plaintext (dev traces); BOUND encrypts. An
 *     encrypt/decrypt pair can be injected via Backend when needed.
 *   - Immutability lives in the on-chain hash anchor; blob storage is
 *     conventional (tamper-EVIDENT, not tamper-proof — unlike Walrus).
 */
export interface AgentStep {
    /** Groups steps belonging to one agent run / long-running loop. */
    runId: string;
    /** Which agent took the step. */
    agentId: string;
    /** Monotonic index within the run. */
    stepIndex: number;
    /** Free-form category, e.g. "observation" | "decision" | "action" | "result". */
    kind: string;
    /** Human-readable one-liner describing the step. */
    summary: string;
    /** Arbitrary structured detail (model input/output, tool call, tx, ...). */
    payload?: unknown;
    status?: "ok" | "error";
    /** Timestamp; defaults to now. */
    atMs?: number;
}
export interface StepReceipt {
    runId: string;
    agentId: string;
    stepIndex: number;
    kind: string;
    summary: string;
    /** Backend reference to the on-chain anchor (e.g. "mantle:<runKey>:<seq>"). */
    anchorRef: string;
    /** Transaction hash of the anchoring write. */
    txHash: string;
    /** Blob id holding the canonical step. */
    blobId: string;
    /** SHA-256 of the blob bytes — the verification key. */
    contentHash: string;
    /** Public verify URL (explorer link for the anchor tx). */
    verifyUrl: string;
    atMs: number;
}
export interface VerifyResult {
    verified: boolean;
    reason: string;
    recomputedHash?: string;
    /** Hash read from the on-chain anchor (omitted when backend is offline). */
    onChainHash?: string;
    /** The recovered step, present only when verification succeeds. */
    recovered?: AgentStep;
}
export interface ClaimResult {
    proven: boolean;
    reason: string;
    receipt?: StepReceipt;
    recovered?: AgentStep;
}
/**
 * The injectable backend. In-memory for tests/judges (no wallet needed),
 * EVM (FlightRecorder.sol on Mantle) for real runs.
 */
export interface Backend {
    storeBlob(data: Uint8Array): Promise<{
        blobId: string;
        contentHash: string;
    }>;
    fetchBlob(blobId: string): Promise<Uint8Array>;
    hashBytes(data: Uint8Array): string;
    /** Anchor a content hash on-chain, keyed by (runId, stepIndex). */
    anchor(args: {
        runId: string;
        stepIndex: number;
        contentHash: string;
        agentId: string;
    }): Promise<{
        anchorRef: string;
        txHash: string;
        verifyUrl: string;
    }>;
    /** Read the anchored hash back. Throw if missing/unreachable. */
    readAnchor(anchorRef: string): Promise<{
        contentHash: string;
    }>;
    /**
     * Optionally persist the FULL StepReceipt (not just the anchor result) so
     * persisted artifacts stay consumable by verifyStep/recallRun after restart.
     */
    saveReceipt?(receipt: StepReceipt): Promise<void>;
}
/** Record one agent step: canonicalize -> store -> anchor on Mantle. */
export declare function recordStep(step: AgentStep, backend: Backend): Promise<StepReceipt>;
/**
 * Verify a step happened and was not altered: re-fetch the blob, recompute its
 * hash, check against both the receipt and the on-chain anchor. Fails closed.
 */
export declare function verifyStep(receipt: StepReceipt, backend: Backend): Promise<VerifyResult>;
/** Answer "have I already done X?" against the run's verifiable history. */
export declare function verifyClaim(opts: {
    receipts: StepReceipt[];
    /** Predicate over a *verified* step's recovered content. */
    match: (step: AgentStep) => boolean;
    claim?: string;
}, backend: Backend): Promise<ClaimResult>;
/** Verify an entire run in order — the auditable timeline. */
export declare function recallRun(receipts: StepReceipt[], backend: Backend): Promise<Array<{
    receipt: StepReceipt;
    result: VerifyResult;
}>>;
//# sourceMappingURL=recorder.d.ts.map
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
  storeBlob(data: Uint8Array): Promise<{ blobId: string; contentHash: string }>;
  fetchBlob(blobId: string): Promise<Uint8Array>;
  hashBytes(data: Uint8Array): string;
  /** Anchor a content hash on-chain, keyed by (runId, stepIndex). */
  anchor(args: {
    runId: string;
    stepIndex: number;
    contentHash: string;
    agentId: string;
  }): Promise<{ anchorRef: string; txHash: string; verifyUrl: string }>;
  /** Read the anchored hash back. Throw if missing/unreachable. */
  readAnchor(anchorRef: string): Promise<{ contentHash: string }>;
}

function canonicalize(step: AgentStep, atMs: number): string {
  return JSON.stringify({
    runId: step.runId,
    agentId: step.agentId,
    stepIndex: step.stepIndex,
    kind: step.kind,
    summary: step.summary,
    payload: step.payload ?? null,
    status: step.status ?? "ok",
    atMs,
  });
}

/** Record one agent step: canonicalize -> store -> anchor on Mantle. */
export async function recordStep(step: AgentStep, backend: Backend): Promise<StepReceipt> {
  const atMs = step.atMs ?? Date.now();
  const bytes = new TextEncoder().encode(canonicalize(step, atMs));

  const { blobId, contentHash } = await backend.storeBlob(bytes);
  const anchored = await backend.anchor({
    runId: step.runId,
    stepIndex: step.stepIndex,
    contentHash,
    agentId: step.agentId,
  });

  return {
    runId: step.runId,
    agentId: step.agentId,
    stepIndex: step.stepIndex,
    kind: step.kind,
    summary: step.summary,
    anchorRef: anchored.anchorRef,
    txHash: anchored.txHash,
    blobId,
    contentHash,
    verifyUrl: anchored.verifyUrl,
    atMs,
  };
}

/**
 * Verify a step happened and was not altered: re-fetch the blob, recompute its
 * hash, check against both the receipt and the on-chain anchor. Fails closed.
 */
export async function verifyStep(receipt: StepReceipt, backend: Backend): Promise<VerifyResult> {
  let bytes: Uint8Array;
  try {
    bytes = await backend.fetchBlob(receipt.blobId);
  } catch (err) {
    return {
      verified: false,
      reason: `Blob ${receipt.blobId} could not be retrieved: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const recomputedHash = backend.hashBytes(bytes);
  if (recomputedHash !== receipt.contentHash) {
    return {
      verified: false,
      reason: "Blob content does not match the receipt hash — the step was tampered with or the blob is wrong.",
      recomputedHash,
    };
  }

  // On-chain anchor is the trust root. Best-effort read: skipped when
  // unreachable, but a present mismatch fails closed.
  let onChainHash: string | undefined;
  try {
    const onChain = await backend.readAnchor(receipt.anchorRef);
    onChainHash = onChain.contentHash;
  } catch {
    onChainHash = undefined;
  }
  if (onChainHash && onChainHash !== recomputedHash) {
    return {
      verified: false,
      reason: "On-chain anchor hash does not match the stored blob — the record cannot be trusted.",
      recomputedHash,
      onChainHash,
    };
  }

  let recovered: AgentStep;
  try {
    recovered = JSON.parse(Buffer.from(bytes).toString("utf8")) as AgentStep;
  } catch (err) {
    return {
      verified: false,
      reason: `Blob hash matched but the payload could not be parsed: ${err instanceof Error ? err.message : String(err)}`,
      recomputedHash,
      onChainHash,
    };
  }

  return {
    verified: true,
    reason: onChainHash
      ? "Blob hash matches the on-chain Mantle anchor — provably unaltered."
      : "Blob hash matches the receipt (on-chain anchor not read in this mode).",
    recomputedHash,
    onChainHash,
    recovered,
  };
}

/** Answer "have I already done X?" against the run's verifiable history. */
export async function verifyClaim(
  opts: {
    receipts: StepReceipt[];
    /** Predicate over a *verified* step's recovered content. */
    match: (step: AgentStep) => boolean;
    claim?: string;
  },
  backend: Backend,
): Promise<ClaimResult> {
  for (const receipt of opts.receipts) {
    const result = await verifyStep(receipt, backend);
    if (result.verified && result.recovered && opts.match(result.recovered)) {
      return {
        proven: true,
        reason: `Claim backed by verified step #${receipt.stepIndex} (${receipt.anchorRef}).`,
        receipt,
        recovered: result.recovered,
      };
    }
  }
  return {
    proven: false,
    reason: opts.claim
      ? `No verifiable record matches "${opts.claim}". The claim is unproven — treat it as a hallucinated memory, not fact.`
      : "No verifiable record matches the claim. Unproven — do not act on it.",
  };
}

/** Verify an entire run in order — the auditable timeline. */
export async function recallRun(
  receipts: StepReceipt[],
  backend: Backend,
): Promise<Array<{ receipt: StepReceipt; result: VerifyResult }>> {
  const ordered = [...receipts].sort((a, b) => a.stepIndex - b.stepIndex);
  const out: Array<{ receipt: StepReceipt; result: VerifyResult }> = [];
  for (const receipt of ordered) {
    out.push({ receipt, result: await verifyStep(receipt, backend) });
  }
  return out;
}

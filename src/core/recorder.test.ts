import { describe, expect, it } from "vitest";
import {
  recallRun,
  recordStep,
  verifyClaim,
  verifyStep,
  type AgentStep,
} from "./recorder.js";
import { memoryBackend } from "../backends/memory.js";

function step(overrides: Partial<AgentStep> = {}): AgentStep {
  return {
    runId: "run-1",
    agentId: "meridian-agent",
    stepIndex: 1,
    kind: "decision",
    summary: "selected conservative rebalance",
    payload: { market: "mETH", action: "hold" },
    atMs: 1_765_000_000_000,
    ...overrides,
  };
}

describe("REPLAY recorder core", () => {
  it("records and verifies a step against the in-memory backend", async () => {
    const mem = memoryBackend();
    const receipt = await recordStep(step(), mem);

    expect(receipt.anchorRef).toBe("mem:run-1:1");
    expect(receipt.blobId).toMatch(/^mem-/);
    expect(receipt.contentHash).toMatch(/^[a-f0-9]{64}$/);

    const result = await verifyStep(receipt, mem);

    expect(result.verified).toBe(true);
    expect(result.onChainHash).toBe(receipt.contentHash);
    expect(result.recovered?.summary).toBe("selected conservative rebalance");
    expect(result.recovered?.payload).toEqual({ market: "mETH", action: "hold" });
  });

  it("fails closed when a stored blob is tampered with", async () => {
    const mem = memoryBackend();
    const receipt = await recordStep(step({ summary: "recorded tool output" }), mem);

    mem.tamper(receipt.blobId);
    const result = await verifyStep(receipt, mem);

    expect(result.verified).toBe(false);
    expect(result.reason).toMatch(/tampered|does not match/i);
  });

  it("fails closed when the anchor hash disagrees with the blob hash", async () => {
    const mem = memoryBackend();
    const receipt = await recordStep(step({ summary: "anchored proposal" }), mem);

    mem.tamperAnchor(receipt.anchorRef);
    const result = await verifyStep(receipt, mem);

    expect(result.verified).toBe(false);
    expect(result.reason).toMatch(/anchor hash/i);
    expect(result.onChainHash).toBe("0".repeat(64));
  });

  it("proves true claims and rejects hallucinated claims using only verified steps", async () => {
    const mem = memoryBackend();
    const receipts = [
      await recordStep(step({ stepIndex: 1, summary: "observed pool depth", payload: { pool: "mETH", depthUsd: 2_100_000 } }), mem),
      await recordStep(step({ stepIndex: 2, summary: "proposed hold", payload: { decision: "hold" } }), mem),
    ];

    const proven = await verifyClaim(
      {
        receipts,
        claim: "proposed hold",
        match: (candidate) => (candidate.payload as { decision?: string }).decision === "hold",
      },
      mem,
    );
    expect(proven.proven).toBe(true);
    expect(proven.receipt?.stepIndex).toBe(2);

    const hallucinated = await verifyClaim(
      {
        receipts,
        claim: "executed rebalance",
        match: (candidate) => (candidate.payload as { decision?: string }).decision === "execute",
      },
      mem,
    );
    expect(hallucinated.proven).toBe(false);
    expect(hallucinated.reason).toMatch(/unproven|hallucinated/i);
  });

  it("recalls a run as an ordered verified timeline", async () => {
    const mem = memoryBackend();
    const receipts = [
      await recordStep(step({ stepIndex: 3, summary: "third" }), mem),
      await recordStep(step({ stepIndex: 1, summary: "first" }), mem),
      await recordStep(step({ stepIndex: 2, summary: "second" }), mem),
    ];

    const timeline = await recallRun(receipts, mem);

    expect(timeline.map((item) => item.receipt.stepIndex)).toEqual([1, 2, 3]);
    expect(timeline.every((item) => item.result.verified)).toBe(true);
  });
});

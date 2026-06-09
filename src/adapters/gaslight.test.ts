import { describe, expect, it } from "vitest";
import { memoryBackend } from "../backends/memory.js";
import { recordEvidence, verifyStep } from "../core/evidence.js";
import { gaslightReportToPackets, type GaslightOptimizationReport } from "./gaslight.js";

const report: GaslightOptimizationReport = {
  timestamp: "2026-06-09T20:42:00.000Z",
  tx_id: "gl-0087",
  tx_type: "dex_swap",
  upstream_agent: "meridian-agent",
  original_gas_estimate: "250000",
  optimized_gas_used: "118400",
  gas_saved_percent: 52.6,
  mnt_saved: "0.0012",
  timing: {
    received_at: "2026-06-09T20:41:45.000Z",
    gas_at_receipt: "0.052 gwei",
    submitted_at: "2026-06-09T20:42:00.000Z",
    gas_at_submit: "0.041 gwei",
    wait_seconds: 15,
    recommendation_followed: "wait",
  },
  mev_assessment: {
    risk_score: 22,
    recommendation: "safe",
    reasoning: "Swap amount is below pool risk threshold.",
  },
  batched: false,
  outcome: "confirmed",
  block: 39744123,
  tx_hash: "0x0000000000000000000000000000000000000000000000000000000000001234",
};

describe("GASLIGHT adapter", () => {
  it("converts one optimization report into replayable evidence packets", async () => {
    const packets = gaslightReportToPackets(report);

    expect(packets).toHaveLength(3);
    expect(packets.map((packet) => packet.eventType)).toEqual(["tool_call", "decision", "action_taken"]);
    expect(packets.map((packet) => packet.sequence)).toEqual([1, 2, 3]);
    expect(packets[0]?.sessionId).toBe("gl-0087");
    expect(packets[1]?.agentResponse).toContain("52.6%");

    const backend = memoryBackend();
    const receipts = [];
    for (const packet of packets) receipts.push(await recordEvidence(packet, backend));

    const verified = await verifyStep(receipts[2]!, backend);
    expect(verified.verified).toBe(true);
    expect(verified.recovered?.summary).toContain("confirmed");
  });
});

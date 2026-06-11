import { describe, expect, it } from "vitest";
import { memoryBackend } from "../backends/memory.js";
import { recordEvidence, verifyStep } from "../core/evidence.js";
import { meridianDecisionToPackets } from "./meridian.js";
const decision = {
    timestamp: "2026-06-09T20:12:00.000Z",
    cycle_id: "merid-0042",
    agent_address: "0x000000000000000000000000000000000000bEEF",
    erc8004_token_id: "17",
    signals: {
        wallet_idle: 0,
        aave_usdy: 4.2,
        merchant_moe_meth_usdy: 9.8,
    },
    bybit_signals: {
        mnt: { fundingApr: 2.1 },
        eth: { fundingApr: -0.4 },
    },
    portfolio_before: {
        wallet_idle: 2_500,
        aave_usdy: 8_000,
    },
    risk_assessment: {
        passed: true,
        checks: [{ rule: "rebalance_cooldown", status: "pass", detail: "cooldown elapsed" }],
    },
    proposal: {
        action: "MOVE",
        reasoning: "merchant moe spread clears the risk threshold",
        from: { venue: "wallet_idle", amount: "2000" },
        to: { venue: "merchant_moe_meth_usdy", expected_apy: 9.8 },
    },
    execution: {
        tx_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        gas_used: "0.00014 MNT",
        status: "simulated",
        block: 0,
    },
};
describe("MERIDIAN adapter", () => {
    it("converts one decrypted decision log into replayable evidence packets", async () => {
        const packets = meridianDecisionToPackets(decision);
        expect(packets).toHaveLength(4);
        expect(packets.map((packet) => packet.eventType)).toEqual([
            "tool_call",
            "decision",
            "decision",
            "action_taken",
        ]);
        expect(packets.map((packet) => packet.sequence)).toEqual([1, 2, 3, 4]);
        expect(packets[0]?.sessionId).toBe("merid-0042");
        expect(packets[2]?.agentResponse).toContain("merchant moe spread");
        const backend = memoryBackend();
        const receipts = [];
        for (const packet of packets) {
            receipts.push(await recordEvidence(packet, backend));
        }
        expect(receipts).toHaveLength(4);
        const verified = await verifyStep(receipts[3], backend);
        expect(verified.verified).toBe(true);
        expect(verified.recovered?.summary).toContain("simulated");
    });
});
//# sourceMappingURL=meridian.test.js.map
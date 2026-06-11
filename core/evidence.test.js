import { describe, expect, it } from "vitest";
import { memoryBackend } from "../backends/memory.js";
import { proveCommitment, recordEvidence } from "./evidence.js";
function packet(overrides = {}) {
    return {
        agentId: "gaslight-agent",
        sessionId: "audit-run-1",
        eventType: "commitment_made",
        userMessage: "Only optimize when the simulated savings exceed gas.",
        agentResponse: "I will only submit when estimated savings exceed gas.",
        commitment: {
            type: "optimization_guard",
            terms: ["estimated savings exceed gas"],
            riskLevel: "high",
        },
        sequence: 1,
        atMs: 1_765_000_000_000,
        ...overrides,
    };
}
describe("REPLAY evidence packets", () => {
    it("records a commitment packet and proves only verified commitments", async () => {
        const mem = memoryBackend();
        const receipt = await recordEvidence(packet(), mem);
        expect(receipt.sessionId).toBe("audit-run-1");
        expect(receipt.eventType).toBe("commitment_made");
        const proven = await proveCommitment({
            receipts: [receipt],
            claim: "estimated savings exceed gas",
            match: (candidate) => candidate.commitment?.terms.some((term) => term.includes("savings exceed gas")) ?? false,
        }, mem);
        expect(proven.proven).toBe(true);
        expect(proven.packet?.agentId).toBe("gaslight-agent");
        const falseClaim = await proveCommitment({
            receipts: [receipt],
            claim: "always submit every opportunity",
            match: (candidate) => candidate.commitment?.terms.some((term) => term.includes("always submit")) ?? false,
        }, mem);
        expect(falseClaim.proven).toBe(false);
        mem.tamper(receipt.blobId);
        const afterTamper = await proveCommitment({
            receipts: [receipt],
            claim: "estimated savings exceed gas",
            match: (candidate) => candidate.commitment?.terms.some((term) => term.includes("savings exceed gas")) ?? false,
        }, mem);
        expect(afterTamper.proven).toBe(false);
    });
});
//# sourceMappingURL=evidence.test.js.map
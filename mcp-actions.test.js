import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { forkDecision, listReplayRuns, recallReplayRun, verifyReplayPacket } from "./mcp-actions.js";
function hash(data) {
    return createHash("sha256").update(new TextEncoder().encode(data)).digest("hex");
}
async function writePacket(packetDir, stepIndex, summary) {
    const body = JSON.stringify({
        runId: "run-a",
        agentId: "agent-a",
        stepIndex,
        kind: stepIndex === 1 ? "tool_call" : "decision",
        summary,
        payload: { decision: stepIndex === 2 ? "PASS" : undefined },
        status: "ok",
        atMs: 1781037000000 + stepIndex,
    });
    const contentHash = hash(body);
    await writeFile(join(packetDir, `${contentHash}.json`), body);
    await writeFile(join(packetDir, `${contentHash}.receipt.json`), JSON.stringify({
        runId: "run-a",
        agentId: "agent-a",
        stepIndex,
        kind: stepIndex === 1 ? "tool_call" : "decision",
        summary,
        anchorRef: `mem:run-a:${stepIndex}`,
        txHash: `0x${String(stepIndex).repeat(64)}`,
        blobId: `${contentHash}.json`,
        contentHash,
        verifyUrl: `memory://run-a/${stepIndex}`,
        atMs: 1781037000000 + stepIndex,
    }));
    return contentHash;
}
describe("MCP actions", () => {
    it("lists, recalls, and verifies local replay packets", async () => {
        const packetDir = await mkdtemp(join(tmpdir(), "replay-mcp-"));
        const firstHash = await writePacket(packetDir, 1, "Signals captured.");
        await writePacket(packetDir, 2, "Risk check passed.");
        const runs = await listReplayRuns({ packetDir });
        expect(runs).toEqual([{ runId: "run-a", agentId: "agent-a", steps: 2, verifiedReceipts: 2 }]);
        const recall = await recallReplayRun({ packetDir, runId: "run-a" });
        expect(recall.steps.map((step) => step.summary)).toEqual(["Signals captured.", "Risk check passed."]);
        const verified = await verifyReplayPacket({ packetDir, contentHash: firstHash });
        expect(verified.verified).toBe(true);
        expect(verified.localMatch).toBe(true);
        expect(verified.anchorMatch).toBe(true);
    });
    it("forks deterministic decisions without claiming LLM or eth_call replay", () => {
        expect(forkDecision({ riskThreshold: 0.42, walletIdle: 2_000 }).decision).toBe("PASS");
        const forked = forkDecision({ riskThreshold: 0.7, walletIdle: 2_000 });
        expect(forked.decision).toBe("FAIL");
        expect(forked.mode).toBe("deterministic");
        expect(forked.limits).toContain("no LLM re-run");
    });
});
//# sourceMappingURL=mcp-actions.test.js.map
import { describe, expect, it } from "vitest";
import { memoryBackend } from "./backends/memory.js";
import { createReplay } from "./sdk.js";
describe("capture SDK", () => {
    it("records evidence packets with a small caller-facing API", async () => {
        const backend = memoryBackend();
        const replay = createReplay({ agentId: "toy-agent", runId: "demo-run", backend });
        const receipt = await replay.record({
            eventType: "decision",
            agentResponse: "Hold position; liquidity is thin.",
            memorySnapshot: { poolDepthUsd: 250_000 },
        });
        expect(receipt.sessionId).toBe("demo-run");
        expect(receipt.eventType).toBe("decision");
        expect(receipt.stepIndex).toBe(1);
        expect(receipt.verifyUrl).toContain("memory://");
    });
    it("wraps async LLM calls and records their input/output", async () => {
        const backend = memoryBackend();
        const replay = createReplay({ agentId: "toy-agent", runId: "demo-run", backend });
        const ask = replay.wrap("risk-check", async (prompt) => `answer:${prompt}`);
        const output = await ask("should rebalance?");
        expect(output).toBe("answer:should rebalance?");
        const timeline = await replay.recall();
        expect(timeline).toHaveLength(1);
        expect(timeline[0]?.result.verified).toBe(true);
        expect(timeline[0]?.result.recovered?.kind).toBe("decision");
        expect(timeline[0]?.result.recovered?.payload).toMatchObject({
            userMessage: "should rebalance?",
            agentResponse: "answer:should rebalance?",
            toolCalls: [{ tool: "llm", action: "risk-check" }],
        });
    });
});
//# sourceMappingURL=sdk.test.js.map
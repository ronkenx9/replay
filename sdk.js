import { recallRun, } from "./core/recorder.js";
import { recordEvidence, } from "./core/evidence.js";
function stringifyForEvidence(value) {
    if (typeof value === "string")
        return value;
    return JSON.stringify(value);
}
export function createReplay(options) {
    const receipts = [];
    let nextSequence = 1;
    async function record(input) {
        const packet = {
            agentId: options.agentId,
            sessionId: options.runId,
            eventType: input.eventType,
            userMessage: input.userMessage,
            agentResponse: input.agentResponse,
            memorySnapshot: {
                ...(input.memorySnapshot ?? {}),
                ...(input.payload ? { payload: input.payload } : {}),
            },
            toolCalls: input.toolCalls,
            sequence: nextSequence,
        };
        nextSequence += 1;
        const receipt = await recordEvidence(packet, options.backend);
        receipts.push(receipt);
        return receipt;
    }
    function wrap(label, fn) {
        return async (input) => {
            const output = await fn(input);
            await record({
                eventType: "decision",
                userMessage: stringifyForEvidence(input),
                agentResponse: stringifyForEvidence(output),
                toolCalls: [{ tool: "llm", action: label }],
            });
            return output;
        };
    }
    return {
        get receipts() {
            return receipts;
        },
        record,
        wrap,
        recall() {
            return recallRun(receipts, options.backend);
        },
    };
}
//# sourceMappingURL=sdk.js.map
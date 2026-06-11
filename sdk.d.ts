import { recallRun, type Backend } from "./core/recorder.js";
import { type AgentEventType, type AgentToolCall, type EvidenceReceipt } from "./core/evidence.js";
export interface ReplayRecordInput {
    eventType: AgentEventType;
    userMessage?: string;
    agentResponse?: string;
    memorySnapshot?: Record<string, unknown>;
    toolCalls?: AgentToolCall[];
    payload?: Record<string, unknown>;
}
export interface ReplayClient {
    readonly receipts: readonly EvidenceReceipt[];
    record(input: ReplayRecordInput): Promise<EvidenceReceipt>;
    wrap<Input, Output>(label: string, fn: (input: Input) => Promise<Output>): (input: Input) => Promise<Output>;
    recall(): ReturnType<typeof recallRun>;
}
export interface CreateReplayOptions {
    agentId: string;
    runId: string;
    backend: Backend;
}
export declare function createReplay(options: CreateReplayOptions): ReplayClient;
//# sourceMappingURL=sdk.d.ts.map
import { recallRun, verifyStep, type AgentStep, type Backend, type StepReceipt } from "./recorder.js";
export type AgentEventType = "commitment_made" | "action_taken" | "tool_call" | "decision" | "escalation" | "message_sent";
export interface AgentCommitment {
    type: string;
    terms: string[];
    riskLevel?: "low" | "medium" | "high";
}
export interface AgentToolCall {
    tool: string;
    action: string;
    args?: Record<string, unknown>;
}
export interface EvidencePacket {
    agentId: string;
    sessionId: string;
    eventType: AgentEventType;
    userMessage?: string;
    agentResponse?: string;
    commitment?: AgentCommitment;
    memorySnapshot?: Record<string, unknown>;
    toolCalls?: AgentToolCall[];
    sequence?: number;
    atMs?: number;
}
export interface EvidenceReceipt extends StepReceipt {
    sessionId: string;
    eventType: AgentEventType;
}
export declare function recordEvidence(packet: EvidencePacket, backend: Backend): Promise<EvidenceReceipt>;
export declare function packetFromStep(step: AgentStep): EvidencePacket | null;
export declare function proveCommitment(opts: {
    receipts: StepReceipt[];
    match: (packet: EvidencePacket) => boolean;
    claim?: string;
}, backend: Backend): Promise<{
    proven: boolean;
    reason: string;
    packet?: EvidencePacket;
    receipt?: StepReceipt;
}>;
export { recallRun, verifyStep };
//# sourceMappingURL=evidence.d.ts.map
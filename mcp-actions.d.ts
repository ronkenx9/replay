import type { StepReceipt } from "./core/recorder.js";
import { type VerifyPacketAnchorResult } from "./server-verifier.js";
export interface PacketActionOptions {
    packetDir?: string;
}
export interface RunSummary {
    runId: string;
    agentId: string;
    steps: number;
    verifiedReceipts: number;
}
export interface RecallResult {
    runId: string;
    steps: Array<{
        receipt: StepReceipt;
        summary: string;
        kind: string;
        payload?: unknown;
    }>;
}
export interface ForkDecisionInput {
    riskThreshold: number;
    walletIdle: number;
}
export interface ForkDecisionResult {
    mode: "deterministic";
    decision: "PASS" | "FAIL" | "HOLD";
    reason: string;
    limits: string;
}
export declare function listReplayRuns(options?: PacketActionOptions): Promise<RunSummary[]>;
export declare function recallReplayRun(options: PacketActionOptions & {
    runId: string;
}): Promise<RecallResult>;
export declare function verifyReplayPacket(options: PacketActionOptions & {
    contentHash: string;
    readAnchor?: (anchorRef: string) => Promise<string>;
}): Promise<VerifyPacketAnchorResult>;
export declare function forkDecision(input: ForkDecisionInput): ForkDecisionResult;
//# sourceMappingURL=mcp-actions.d.ts.map
import {
  recallRun,
  recordStep,
  verifyClaim,
  verifyStep,
  type AgentStep,
  type Backend,
  type StepReceipt,
} from "./recorder.js";

export type AgentEventType =
  | "commitment_made"
  | "action_taken"
  | "tool_call"
  | "decision"
  | "escalation"
  | "message_sent";

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

function summarize(packet: EvidencePacket): string {
  if (packet.commitment) return `commitment: ${packet.commitment.terms.join("; ")}`;
  if (packet.agentResponse) return packet.agentResponse;
  if (packet.userMessage) return packet.userMessage;
  return packet.eventType;
}

export async function recordEvidence(packet: EvidencePacket, backend: Backend): Promise<EvidenceReceipt> {
  const receipt = await recordStep(
    {
      runId: packet.sessionId,
      agentId: packet.agentId,
      stepIndex: packet.sequence ?? 0,
      kind: packet.eventType,
      summary: summarize(packet),
      payload: packet,
      status: "ok",
      atMs: packet.atMs,
    },
    backend,
  );

  return { ...receipt, sessionId: packet.sessionId, eventType: packet.eventType };
}

export function packetFromStep(step: AgentStep): EvidencePacket | null {
  const payload = step.payload;
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Partial<EvidencePacket>;
  if (!candidate.agentId || !candidate.sessionId || !candidate.eventType) return null;
  return candidate as EvidencePacket;
}

export async function proveCommitment(
  opts: {
    receipts: StepReceipt[];
    match: (packet: EvidencePacket) => boolean;
    claim?: string;
  },
  backend: Backend,
): Promise<{ proven: boolean; reason: string; packet?: EvidencePacket; receipt?: StepReceipt }> {
  const result = await verifyClaim(
    {
      receipts: opts.receipts,
      claim: opts.claim,
      match: (step) => {
        const packet = packetFromStep(step);
        return packet ? opts.match(packet) : false;
      },
    },
    backend,
  );

  return {
    proven: result.proven,
    reason: result.reason,
    receipt: result.receipt,
    packet: result.recovered ? packetFromStep(result.recovered) ?? undefined : undefined,
  };
}

export { recallRun, verifyStep };

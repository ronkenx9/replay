import type { EvidencePacket } from "../core/evidence.js";

export interface MeridianDecisionLog {
  timestamp: string;
  cycle_id: string;
  agent_address: string;
  erc8004_token_id: string;
  signals: Record<string, unknown>;
  bybit_signals?: Record<string, unknown>;
  portfolio_before: Record<string, unknown>;
  risk_assessment: {
    passed?: boolean;
    checks?: unknown[];
    [key: string]: unknown;
  };
  proposal: {
    action?: string;
    reasoning?: string;
    from?: unknown;
    to?: unknown;
    [key: string]: unknown;
  };
  execution: {
    tx_hash?: string;
    gas_used?: string;
    status?: string;
    block?: number;
    [key: string]: unknown;
  };
}

function sentence(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function meridianDecisionToPackets(decision: MeridianDecisionLog): EvidencePacket[] {
  const base = {
    agentId: decision.agent_address,
    sessionId: decision.cycle_id,
    atMs: Date.parse(decision.timestamp),
  };

  return [
    {
      ...base,
      eventType: "tool_call",
      userMessage: "MERIDIAN scanned Mantle yield venues and market signals.",
      agentResponse: `Signals captured for ${Object.keys(decision.signals).length} venues.`,
      memorySnapshot: {
        signals: decision.signals,
        bybit_signals: decision.bybit_signals ?? null,
        portfolio_before: decision.portfolio_before,
      },
      toolCalls: [{ tool: "meridian.scan", action: "signals" }],
      sequence: 1,
    },
    {
      ...base,
      eventType: "decision",
      userMessage: "MERIDIAN evaluated policy and risk constraints.",
      agentResponse: decision.risk_assessment.passed ? "Risk policy passed." : "Risk policy failed.",
      memorySnapshot: {
        risk_assessment: decision.risk_assessment,
      },
      toolCalls: [{ tool: "meridian.risk", action: "assess" }],
      sequence: 2,
    },
    {
      ...base,
      eventType: "decision",
      userMessage: "MERIDIAN proposed the rebalance action.",
      agentResponse: sentence(decision.proposal.reasoning ?? decision.proposal.action ?? "proposal recorded"),
      memorySnapshot: {
        proposal: decision.proposal,
      },
      toolCalls: [{ tool: "meridian.allocator", action: String(decision.proposal.action ?? "propose") }],
      sequence: 3,
    },
    {
      ...base,
      eventType: "action_taken",
      userMessage: "MERIDIAN produced the execution receipt.",
      agentResponse: `${decision.execution.status ?? "unknown"} execution: ${decision.execution.tx_hash ?? "no tx hash"}`,
      memorySnapshot: {
        execution: decision.execution,
        erc8004_token_id: decision.erc8004_token_id,
      },
      toolCalls: [{ tool: "meridian.executor", action: String(decision.execution.status ?? "receipt") }],
      sequence: 4,
    },
  ];
}


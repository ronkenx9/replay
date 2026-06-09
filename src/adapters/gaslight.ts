import type { EvidencePacket } from "../core/evidence.js";

export interface GaslightOptimizationReport {
  timestamp: string;
  tx_id: string;
  tx_type: string;
  upstream_agent: string;
  original_gas_estimate: string;
  optimized_gas_used: string;
  gas_saved_percent: number;
  mnt_saved: string;
  timing: {
    received_at: string;
    gas_at_receipt: string;
    submitted_at: string;
    gas_at_submit: string;
    wait_seconds: number;
    recommendation_followed: string;
  };
  mev_assessment: {
    risk_score: number;
    recommendation: string;
    reasoning: string;
  };
  batched: boolean;
  outcome: string;
  block: number;
  tx_hash: string;
}

export function gaslightReportToPackets(report: GaslightOptimizationReport): EvidencePacket[] {
  const base = {
    agentId: report.upstream_agent,
    sessionId: report.tx_id,
    atMs: Date.parse(report.timestamp),
  };

  return [
    {
      ...base,
      eventType: "tool_call",
      userMessage: `GASLIGHT intercepted ${report.tx_type} from ${report.upstream_agent}.`,
      agentResponse: `Original estimate ${report.original_gas_estimate}; optimized gas ${report.optimized_gas_used}.`,
      memorySnapshot: {
        tx_type: report.tx_type,
        original_gas_estimate: report.original_gas_estimate,
        optimized_gas_used: report.optimized_gas_used,
        batched: report.batched,
      },
      toolCalls: [{ tool: "gaslight.interceptor", action: report.tx_type }],
      sequence: 1,
    },
    {
      ...base,
      eventType: "decision",
      userMessage: "GASLIGHT selected gas timing and MEV routing.",
      agentResponse: `Saved ${report.gas_saved_percent}% gas; MEV recommendation ${report.mev_assessment.recommendation}.`,
      memorySnapshot: {
        timing: report.timing,
        mev_assessment: report.mev_assessment,
        mnt_saved: report.mnt_saved,
      },
      toolCalls: [
        { tool: "gaslight.gas-oracle", action: report.timing.recommendation_followed },
        { tool: "gaslight.mev-detector", action: report.mev_assessment.recommendation },
      ],
      sequence: 2,
    },
    {
      ...base,
      eventType: "action_taken",
      userMessage: "GASLIGHT submitted or simulated the optimized transaction.",
      agentResponse: `${report.outcome} transaction ${report.tx_hash}`,
      memorySnapshot: {
        outcome: report.outcome,
        block: report.block,
        tx_hash: report.tx_hash,
      },
      toolCalls: [{ tool: "gaslight.submitter", action: report.outcome }],
      sequence: 3,
    },
  ];
}


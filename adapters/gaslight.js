export function gaslightReportToPackets(report) {
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
//# sourceMappingURL=gaslight.js.map
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
export declare function gaslightReportToPackets(report: GaslightOptimizationReport): EvidencePacket[];
//# sourceMappingURL=gaslight.d.ts.map
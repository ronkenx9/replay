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
export declare function meridianDecisionToPackets(decision: MeridianDecisionLog): EvidencePacket[];
//# sourceMappingURL=meridian.d.ts.map
export interface StepData {
    index: number;
    kind: string;
    title: string;
    summary: string;
    payload: string[];
    txHash: string;
    verifyUrl: string;
    status: string;
    ascii: string[];
    contentHash: string;
    anchorRef?: string;
    rawPacket?: any;
    /** Exact on-disk packet bytes (utf8). Only emitted when includePacketText is set —
     * used by the static viewer to recompute the sha256 in the browser. */
    packetText?: string;
}
export interface RunData {
    id: string;
    name: string;
    agent: string;
    theme: string;
    subtitle: string;
    contract: string;
    steps: StepData[];
}
export interface LoadRunsOptions {
    packetDir: string;
    /** Embed the exact packet bytes per step (static/no-API deployments). */
    includePacketText?: boolean;
}
export declare function loadRuns(options: LoadRunsOptions): Promise<RunData[]>;
//# sourceMappingURL=run-loader.d.ts.map
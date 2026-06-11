export type ReplayStep = {
    index: number;
    kind: "tool_call" | "decision" | "action_taken";
    title: string;
    summary: string;
    payload: string[];
    txHash: string;
    verifyUrl: string;
    status: "verified" | "tampered";
    ascii: string[];
    contentHash?: string;
    /** evm:<chainId>:<contract>:<recorder>:<runIdHash>:<seq> — present on real anchored packets */
    anchorRef?: string;
    /** Exact packet bytes (utf8) — present in the static demo-data bundle so the
     * browser can recompute the hash and live-verify without an API. */
    packetText?: string;
};
export type ReplayRun = {
    id: string;
    name: string;
    agent: string;
    theme: string;
    subtitle: string;
    contract: string;
    steps: ReplayStep[];
};
export declare const flightRecorderAddress = "0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062";
export declare const replayRuns: ReplayRun[];
export declare const tamperedDemo: {
    title: string;
    before: string;
    after: string;
};
//# sourceMappingURL=viewer-data.d.ts.map
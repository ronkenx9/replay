/**
 * Browser-side packet verification for static (no-API) deployments.
 *
 * Mirrors the semantics of src/server-verifier.ts + server readMantleAnchor:
 *   1. sha256(packet bytes) must equal the packet's content hash (local match)
 *   2. FlightRecorder.getAnchorFor(recorder, runIdHash, seq) on Mantle Sepolia
 *      must return the same hash (anchor match)
 * No backend involved — the RPC call goes straight from the browser.
 */
export interface StaticVerifyResult {
    verified: boolean;
    localMatch: boolean;
    anchorMatch: boolean;
    computedHash: string;
    onChainHash?: string;
    reason: string;
}
interface ParsedAnchorRef {
    chainId: number;
    contractAddress: string;
    recorder: string;
    runIdHash: string;
    seq: bigint;
}
export declare function parseAnchorRef(ref: string): ParsedAnchorRef;
export interface StaticVerifyInput {
    contentHash: string;
    packetText: string;
    anchorRef?: string;
    tamper?: boolean;
}
export declare function verifyPacketStatic(input: StaticVerifyInput): Promise<StaticVerifyResult>;
export {};
//# sourceMappingURL=static-verify.d.ts.map
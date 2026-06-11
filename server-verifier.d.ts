export interface VerifyPacketAnchorInput {
    contentHash: string;
    packetBytes: Uint8Array;
    anchorRef?: string;
    readAnchor?: (anchorRef: string) => Promise<string>;
}
export interface VerifyPacketAnchorResult {
    verified: boolean;
    localMatch: boolean;
    anchorMatch: boolean;
    computedHash: string;
    onChainHash?: string;
    reason: string;
}
export declare function verifyPacketAnchor(input: VerifyPacketAnchorInput): Promise<VerifyPacketAnchorResult>;
//# sourceMappingURL=server-verifier.d.ts.map
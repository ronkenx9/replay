import { createHash } from "node:crypto";
function sha256Hex(data) {
    return createHash("sha256").update(data).digest("hex");
}
function normalizeHash(hash) {
    return hash.startsWith("0x") ? hash.slice(2).toLowerCase() : hash.toLowerCase();
}
export async function verifyPacketAnchor(input) {
    const expectedHash = normalizeHash(input.contentHash);
    const computedHash = sha256Hex(input.packetBytes);
    const localMatch = computedHash === expectedHash;
    if (!input.anchorRef || !input.readAnchor) {
        return {
            verified: localMatch,
            localMatch,
            anchorMatch: false,
            computedHash,
            reason: localMatch
                ? "Local packet hash matches, but no on-chain anchor was available."
                : "Local packet hash mismatch.",
        };
    }
    const onChainHash = normalizeHash(await input.readAnchor(input.anchorRef));
    const anchorMatch = onChainHash === expectedHash;
    const verified = localMatch && anchorMatch;
    const reasons = [];
    if (!localMatch)
        reasons.push("Local packet hash mismatch");
    if (!anchorMatch)
        reasons.push("On-chain anchor mismatch");
    if (verified)
        reasons.push("Local packet hash matches the on-chain Mantle anchor");
    return {
        verified,
        localMatch,
        anchorMatch,
        computedHash,
        onChainHash,
        reason: reasons.join("; "),
    };
}
//# sourceMappingURL=server-verifier.js.map
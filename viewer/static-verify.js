/**
 * Browser-side packet verification for static (no-API) deployments.
 *
 * Mirrors the semantics of src/server-verifier.ts + server readMantleAnchor:
 *   1. sha256(packet bytes) must equal the packet's content hash (local match)
 *   2. FlightRecorder.getAnchorFor(recorder, runIdHash, seq) on Mantle Sepolia
 *      must return the same hash (anchor match)
 * No backend involved — the RPC call goes straight from the browser.
 */
const MANTLE_SEPOLIA_RPC_URL = "https://rpc.sepolia.mantle.xyz";
// cast sig "getAnchorFor(address,bytes32,uint256)"
const GET_ANCHOR_FOR_SELECTOR = "0xe7d6b7c1";
function normalizeHash(hash) {
    return hash.startsWith("0x") ? hash.slice(2).toLowerCase() : hash.toLowerCase();
}
async function sha256Hex(data) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}
export function parseAnchorRef(ref) {
    const [kind, chain, contractAddress, recorder, runIdHash, seq] = ref.split(":");
    if (kind !== "evm" || !chain || !contractAddress || !recorder || !runIdHash || !seq) {
        throw new Error(`Invalid EVM anchor ref: ${ref}`);
    }
    return {
        chainId: Number(chain),
        contractAddress,
        recorder,
        runIdHash,
        seq: BigInt(seq),
    };
}
function pad32(hexNoPrefix) {
    return hexNoPrefix.padStart(64, "0");
}
/** abi.encodeWithSelector(getAnchorFor, recorder, runIdHash, seq) by hand — three static words. */
function encodeGetAnchorFor(recorder, runIdHash, seq) {
    return (GET_ANCHOR_FOR_SELECTOR +
        pad32(recorder.replace(/^0x/, "").toLowerCase()) +
        pad32(runIdHash.replace(/^0x/, "").toLowerCase()) +
        pad32(seq.toString(16)));
}
async function readMantleAnchor(anchorRef) {
    const parsed = parseAnchorRef(anchorRef);
    if (parsed.chainId !== 5003) {
        throw new Error(`Unsupported chain id ${parsed.chainId}; expected Mantle Sepolia 5003.`);
    }
    const response = await fetch(MANTLE_SEPOLIA_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_call",
            params: [
                { to: parsed.contractAddress, data: encodeGetAnchorFor(parsed.recorder, parsed.runIdHash, parsed.seq) },
                "latest",
            ],
        }),
    });
    const json = await response.json();
    if (json.error)
        throw new Error(`RPC error: ${json.error.message ?? JSON.stringify(json.error)}`);
    const result = json.result;
    if (!result || result === "0x" || result.length < 66) {
        throw new Error(`Empty anchor read for ${anchorRef}`);
    }
    // returns (bytes32 contentHash, uint64 atBlock) — first word is the hash
    return `0x${result.slice(2, 66)}`;
}
export async function verifyPacketStatic(input) {
    const expectedHash = normalizeHash(input.contentHash);
    // Mirror the server's tamper demo: append bytes to the original packet.
    const text = input.tamper ? `${input.packetText}\n// tampered` : input.packetText;
    const computedHash = await sha256Hex(new TextEncoder().encode(text));
    const localMatch = computedHash === expectedHash;
    if (!input.anchorRef) {
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
    const onChainHash = normalizeHash(await readMantleAnchor(input.anchorRef));
    const anchorMatch = onChainHash === expectedHash;
    const verified = localMatch && anchorMatch;
    const reasons = [];
    if (!localMatch)
        reasons.push("Local packet hash mismatch");
    if (!anchorMatch)
        reasons.push("On-chain anchor mismatch");
    if (verified)
        reasons.push("Browser recomputed the packet hash and matched it against the live Mantle anchor");
    return { verified, localMatch, anchorMatch, computedHash, onChainHash, reason: reasons.join("; ") };
}
//# sourceMappingURL=static-verify.js.map
import { createHash } from "node:crypto";
export function memoryBackend() {
    const blobs = new Map();
    const anchors = new Map(); // anchorRef -> contentHash
    let n = 0;
    const hashBytes = (data) => createHash("sha256").update(data).digest("hex");
    return {
        hashBytes,
        async storeBlob(data) {
            const contentHash = hashBytes(data);
            const blobId = `mem-${contentHash.slice(0, 12)}`;
            blobs.set(blobId, Uint8Array.from(data));
            return { blobId, contentHash };
        },
        async fetchBlob(blobId) {
            const found = blobs.get(blobId);
            if (!found)
                throw new Error(`no such blob ${blobId}`);
            return found;
        },
        async anchor({ runId, stepIndex, contentHash }) {
            const anchorRef = `mem:${runId}:${stepIndex}`;
            anchors.set(anchorRef, contentHash);
            n += 1;
            return { anchorRef, txHash: `0xmemtx${n}`, verifyUrl: `memory://${anchorRef}` };
        },
        async readAnchor(anchorRef) {
            const contentHash = anchors.get(anchorRef);
            if (!contentHash)
                throw new Error(`no such anchor ${anchorRef}`);
            return { contentHash };
        },
        tamper(blobId) {
            const original = blobs.get(blobId);
            if (!original)
                throw new Error(`cannot tamper missing blob ${blobId}`);
            const copy = Uint8Array.from(original);
            copy[0] = (copy[0] ?? 0) ^ 0xff;
            blobs.set(blobId, copy);
        },
        tamperAnchor(anchorRef) {
            if (!anchors.has(anchorRef))
                throw new Error(`cannot tamper missing anchor ${anchorRef}`);
            anchors.set(anchorRef, "0".repeat(64));
        },
    };
}
//# sourceMappingURL=memory.js.map
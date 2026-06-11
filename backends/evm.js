import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
const FLIGHT_RECORDER_ABI = [
    {
        type: "function",
        name: "anchor",
        stateMutability: "nonpayable",
        inputs: [
            { name: "runId", type: "bytes32" },
            { name: "seq", type: "uint256" },
            { name: "packetHash", type: "bytes32" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "getAnchorFor",
        stateMutability: "view",
        inputs: [
            { name: "recorder", type: "address" },
            { name: "runId", type: "bytes32" },
            { name: "seq", type: "uint256" },
        ],
        outputs: [
            { name: "contentHash", type: "bytes32" },
            { name: "atBlock", type: "uint64" },
        ],
    },
];
function sha256Hex(data) {
    return createHash("sha256").update(data).digest("hex");
}
function prefixed(hex) {
    return hex.startsWith("0x") ? hex : `0x${hex}`;
}
function unprefixed(hex) {
    return hex.slice(2).toLowerCase();
}
function runIdToBytes32(runId) {
    return prefixed(createHash("sha256").update(runId).digest("hex"));
}
function chainId(publicClient) {
    const id = publicClient.chain?.id;
    if (!id)
        throw new Error("EVM backend requires a public client with a chain id.");
    return id;
}
function recorderAddress(walletClient) {
    const address = walletClient.account?.address;
    if (!address)
        throw new Error("EVM backend requires a wallet client account address.");
    return address;
}
function anchorRef(parts) {
    return [
        "evm",
        String(parts.chainId),
        parts.contractAddress,
        parts.recorder,
        parts.runIdHash,
        String(parts.seq),
    ].join(":");
}
function parseAnchorRef(ref) {
    const [kind, chain, contractAddress, recorder, runIdHash, seq] = ref.split(":");
    if (kind !== "evm" || !chain || !contractAddress || !recorder || !runIdHash || !seq) {
        throw new Error(`Invalid EVM anchor ref: ${ref}`);
    }
    return {
        chainId: Number(chain),
        contractAddress: contractAddress,
        recorder: recorder,
        runIdHash: runIdHash,
        seq: BigInt(seq),
    };
}
function txUrl(publicClient, txHash) {
    const base = publicClient.chain?.blockExplorers?.default?.url;
    return base ? `${base.replace(/\/$/, "")}/tx/${txHash}` : txHash;
}
export function createEvmBackend(options) {
    const { contractAddress, packetDir, publicClient, walletClient } = options;
    return {
        hashBytes: sha256Hex,
        async storeBlob(data) {
            const contentHash = sha256Hex(data);
            await mkdir(packetDir, { recursive: true });
            await writeFile(join(packetDir, `${contentHash}.json`), data);
            return { blobId: `${contentHash}.json`, contentHash };
        },
        async fetchBlob(blobId) {
            return readFile(join(packetDir, blobId));
        },
        async anchor({ runId, stepIndex, contentHash }) {
            const runIdHash = runIdToBytes32(runId);
            const seq = BigInt(stepIndex);
            const txHash = await walletClient.writeContract({
                address: contractAddress,
                abi: FLIGHT_RECORDER_ABI,
                functionName: "anchor",
                args: [runIdHash, seq, prefixed(contentHash)],
            });
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
            const anchorResult = {
                anchorRef: anchorRef({
                    chainId: chainId(publicClient),
                    contractAddress,
                    recorder: recorderAddress(walletClient),
                    runIdHash,
                    seq,
                }),
                txHash: receipt.transactionHash,
                verifyUrl: txUrl(publicClient, receipt.transactionHash),
            };
            return anchorResult;
        },
        async readAnchor(ref) {
            const parsed = parseAnchorRef(ref);
            const [contentHash] = await publicClient.readContract({
                address: parsed.contractAddress,
                abi: FLIGHT_RECORDER_ABI,
                functionName: "getAnchorFor",
                args: [parsed.recorder, parsed.runIdHash, parsed.seq],
            });
            return { contentHash: unprefixed(contentHash) };
        },
        // Persist the FULL StepReceipt so on-disk artifacts remain consumable by
        // core verifyStep/recallRun after restart (fixes slim-receipt drift).
        async saveReceipt(receipt) {
            const receiptPath = join(packetDir, `${receipt.contentHash}.receipt.json`);
            await writeFile(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
        },
    };
}
//# sourceMappingURL=evm.js.map
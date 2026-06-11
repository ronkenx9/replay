import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createPublicClient, http } from "viem";
import { verifyPacketAnchor } from "./server-verifier.js";
import { loadRuns } from "./run-loader.js";
const PORT = process.env.PORT ? Number(process.env.PORT) : 4174;
const PACKET_DIR = process.env.REPLAY_PACKET_DIR ?? join(process.cwd(), "data", "packets");
const MANTLE_SEPOLIA_RPC_URL = process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz";
const FLIGHT_RECORDER_ABI = [
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
const mantleSepolia = {
    id: 5003,
    name: "Mantle Sepolia",
    nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
    rpcUrls: { default: { http: [MANTLE_SEPOLIA_RPC_URL] } },
};
const publicClient = createPublicClient({
    chain: mantleSepolia,
    transport: http(MANTLE_SEPOLIA_RPC_URL),
});
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
async function readMantleAnchor(anchorRef) {
    const parsed = parseAnchorRef(anchorRef);
    if (parsed.chainId !== 5003) {
        throw new Error(`Unsupported chain id ${parsed.chainId}; expected Mantle Sepolia 5003.`);
    }
    const [contentHash] = await publicClient.readContract({
        address: parsed.contractAddress,
        abi: FLIGHT_RECORDER_ABI,
        functionName: "getAnchorFor",
        args: [parsed.recorder, parsed.runIdHash, parsed.seq],
    });
    return contentHash;
}
const server = createServer(async (req, res) => {
    // CORS Headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }
    if (req.url === "/api/runs" && req.method === "GET") {
        try {
            const runs = await loadRuns({ packetDir: PACKET_DIR });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(runs));
        }
        catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }
    if (req.url === "/api/verify" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk;
        });
        req.on("end", async () => {
            try {
                const { contentHash, tamper } = JSON.parse(body);
                if (!contentHash) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Missing contentHash" }));
                    return;
                }
                const packetPath = join(PACKET_DIR, `${contentHash}.json`);
                const receiptPath = join(PACKET_DIR, `${contentHash}.receipt.json`);
                const rawData = await readFile(packetPath);
                const receiptData = await readFile(receiptPath).catch(() => null);
                const receipt = receiptData ? JSON.parse(receiptData.toString("utf8")) : null;
                const packetBytes = tamper ? Buffer.concat([rawData, Buffer.from("\n// tampered")]) : rawData;
                const verification = await verifyPacketAnchor({
                    contentHash,
                    packetBytes,
                    anchorRef: receipt?.anchorRef,
                    readAnchor: receipt?.anchorRef ? readMantleAnchor : undefined,
                });
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ...verification, anchorRef: receipt?.anchorRef, tamperDemo: Boolean(tamper) }));
            }
            catch (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
});
server.listen(PORT, () => {
    console.log(`[REPLAY API] Server listening on port ${PORT}`);
});
// SCF web-function entry: importing this module starts the listener (Tencent
// web functions proxy API Gateway traffic to the server on PORT, default 9000
// in serverless.yml). The export exists so `handler: dist/server.handler`
// resolves; it is not invoked per-request.
export const handler = server;
//# sourceMappingURL=server.js.map
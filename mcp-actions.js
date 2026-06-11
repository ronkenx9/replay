import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { verifyPacketAnchor } from "./server-verifier.js";
function defaultPacketDir() {
    return join(process.cwd(), "data", "packets");
}
async function readReceiptFiles(packetDir) {
    const files = await readdir(packetDir).catch(() => []);
    const receipts = [];
    for (const file of files.filter((item) => item.endsWith(".receipt.json"))) {
        const raw = await readFile(join(packetDir, file), "utf8");
        receipts.push(JSON.parse(raw));
    }
    return receipts;
}
export async function listReplayRuns(options = {}) {
    const packetDir = options.packetDir ?? defaultPacketDir();
    const receipts = await readReceiptFiles(packetDir);
    const runs = new Map();
    for (const receipt of receipts) {
        const existing = runs.get(receipt.runId) ?? {
            runId: receipt.runId,
            agentId: receipt.agentId,
            steps: 0,
            verifiedReceipts: 0,
        };
        existing.steps += 1;
        existing.verifiedReceipts += receipt.contentHash && receipt.blobId ? 1 : 0;
        runs.set(receipt.runId, existing);
    }
    return [...runs.values()].sort((a, b) => a.runId.localeCompare(b.runId));
}
export async function recallReplayRun(options) {
    const packetDir = options.packetDir ?? defaultPacketDir();
    const receipts = (await readReceiptFiles(packetDir))
        .filter((receipt) => receipt.runId === options.runId)
        .sort((a, b) => a.stepIndex - b.stepIndex);
    const steps = [];
    for (const receipt of receipts) {
        const raw = await readFile(join(packetDir, receipt.blobId), "utf8");
        const packet = JSON.parse(raw);
        steps.push({
            receipt,
            summary: packet.summary,
            kind: packet.kind,
            payload: packet.payload,
        });
    }
    return { runId: options.runId, steps };
}
export async function verifyReplayPacket(options) {
    const packetDir = options.packetDir ?? defaultPacketDir();
    const rawData = await readFile(join(packetDir, `${options.contentHash}.json`));
    const receiptData = await readFile(join(packetDir, `${options.contentHash}.receipt.json`), "utf8");
    const receipt = JSON.parse(receiptData);
    return verifyPacketAnchor({
        contentHash: options.contentHash,
        packetBytes: rawData,
        anchorRef: receipt.anchorRef,
        readAnchor: options.readAnchor ?? (async () => receipt.contentHash),
    });
}
export function forkDecision(input) {
    if (input.walletIdle <= 10) {
        return {
            mode: "deterministic",
            decision: "HOLD",
            reason: `Wallet idle capital $${input.walletIdle.toFixed(2)} is below the rebalance threshold.`,
            limits: "deterministic local replay only; no LLM re-run and no historical eth_call",
        };
    }
    const decision = input.riskThreshold <= 0.48 ? "PASS" : "FAIL";
    return {
        mode: "deterministic",
        decision,
        reason: decision === "PASS"
            ? `Risk threshold ${input.riskThreshold} allows the recorded rebalance path.`
            : `Risk threshold ${input.riskThreshold} blocks the recorded rebalance path.`,
        limits: "deterministic local replay only; no LLM re-run and no historical eth_call",
    };
}
//# sourceMappingURL=mcp-actions.js.map
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { recordStep, verifyStep } from "../core/recorder.js";
import { createEvmBackend } from "./evm.js";
const contractAddress = "0x0000000000000000000000000000000000001234";
const recorderAddress = "0x000000000000000000000000000000000000bEEF";
function step(overrides = {}) {
    return {
        runId: "demo-run",
        agentId: "meridian-agent",
        stepIndex: 7,
        kind: "decision",
        summary: "selected hold decision",
        payload: { decision: "hold", confidence: 0.74 },
        atMs: 1_765_000_000_000,
        ...overrides,
    };
}
function clients() {
    const anchors = new Map();
    const writes = [];
    const walletClient = {
        account: { address: recorderAddress },
        async writeContract(request) {
            writes.push({ functionName: request.functionName, args: request.args });
            const [runId, seq, packetHash] = request.args;
            anchors.set(`${recorderAddress}:${String(runId)}:${String(seq)}`, packetHash);
            return "0x0000000000000000000000000000000000000000000000000000000000009999";
        },
    };
    const publicClient = {
        chain: { id: 5003, blockExplorers: { default: { url: "https://explorer.sepolia.mantle.xyz" } } },
        async waitForTransactionReceipt({ hash }) {
            return { transactionHash: hash };
        },
        async readContract(request) {
            const [recorder, runId, seq] = request.args;
            const found = anchors.get(`${String(recorder)}:${String(runId)}:${String(seq)}`);
            if (!found)
                throw new Error("not found");
            return [found, 123n];
        },
    };
    return { publicClient, walletClient, anchors, writes };
}
describe("EVM backend", () => {
    it("records and verifies through disk blobs and the FlightRecorder contract boundary", async () => {
        const packetDir = await mkdtemp(join(tmpdir(), "replay-evm-"));
        const { publicClient, walletClient, writes } = clients();
        const backend = createEvmBackend({ contractAddress, packetDir, publicClient, walletClient });
        const receipt = await recordStep(step(), backend);
        const result = await verifyStep(receipt, backend);
        expect(result.verified).toBe(true);
        expect(result.onChainHash).toBe(receipt.contentHash);
        expect(result.recovered?.payload).toEqual({ decision: "hold", confidence: 0.74 });
        expect(receipt.anchorRef).toContain("evm:5003:");
        expect(receipt.verifyUrl).toContain("/tx/0x0000000000000000000000000000000000000000000000000000000000009999");
        expect(writes[0]?.functionName).toBe("anchor");
    });
    it("fails verification when the local blob is tampered after anchoring", async () => {
        const packetDir = await mkdtemp(join(tmpdir(), "replay-evm-"));
        const { publicClient, walletClient } = clients();
        const backend = createEvmBackend({ contractAddress, packetDir, publicClient, walletClient });
        const receipt = await recordStep(step(), backend);
        const original = await readFile(join(packetDir, `${receipt.contentHash}.json`), "utf8");
        await writeFile(join(packetDir, `${receipt.contentHash}.json`), original.replace("hold", "execute"));
        const result = await verifyStep(receipt, backend);
        expect(result.verified).toBe(false);
        expect(result.reason).toMatch(/tampered|does not match/i);
    });
});
//# sourceMappingURL=evm.test.js.map
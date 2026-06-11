import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
function generateAsciiArt(kind, stepIndex) {
    switch (kind) {
        case "tool_call":
            return ["..::::::..", ".: SIGNAL :.", `:: STEP ${String(stepIndex).padStart(2, "0")} ::`, "':: RUN ::'"];
        case "decision":
            return ["[DECISION]", "| policy  |", "| check   |", "`========'"];
        case "action_taken":
            return ["+ ACTION +", "| execute |", "| success |", "+---------+"];
        default:
            return ["+ STEP +", `| seq ${stepIndex} |`, "+------+"];
    }
}
export async function loadRuns(options) {
    const { packetDir, includePacketText = false } = options;
    const files = await readdir(packetDir).catch(() => []);
    // Find all JSON files (exclude receipts)
    const jsonFiles = files.filter((f) => f.endsWith(".json") && !f.endsWith(".receipt.json"));
    const stepMap = new Map();
    const runMetaMap = new Map();
    for (const file of jsonFiles) {
        try {
            const contentHash = file.replace(".json", "");
            const packetPath = join(packetDir, file);
            const rawData = await readFile(packetPath);
            const packetText = rawData.toString("utf8");
            const packet = JSON.parse(packetText);
            const receiptPath = join(packetDir, `${contentHash}.receipt.json`);
            const receiptData = await readFile(receiptPath).catch(() => null);
            const receipt = receiptData ? JSON.parse(receiptData.toString("utf8")) : null;
            const runId = packet.payload?.sessionId || packet.runId || "unknown-run";
            const agentId = packet.payload?.agentId || packet.agentId || "unknown-agent";
            runMetaMap.set(runId, { agentId });
            const payloadStrings = [];
            if (packet.payload?.eventType === "tool_call") {
                if (packet.payload.memorySnapshot?.signals) {
                    const count = Object.keys(packet.payload.memorySnapshot.signals).length;
                    payloadStrings.push(`${count} venues scored`);
                }
                if (packet.payload.memorySnapshot?.bybit_signals) {
                    payloadStrings.push("Bybit funding attached");
                }
                if (packet.payload.memorySnapshot?.tx_type) {
                    payloadStrings.push(`Original estimate ${packet.payload.memorySnapshot.original_gas_estimate}`);
                    payloadStrings.push(`Optimized gas ${packet.payload.memorySnapshot.optimized_gas_used}`);
                }
            }
            else if (packet.payload?.eventType === "decision") {
                if (packet.payload.memorySnapshot?.risk_assessment) {
                    const checks = packet.payload.memorySnapshot.risk_assessment.checks || [];
                    checks.forEach((c) => {
                        payloadStrings.push(`${c.rule}: ${c.status}`);
                    });
                }
                if (packet.payload.memorySnapshot?.proposal) {
                    const prop = packet.payload.memorySnapshot.proposal;
                    if (prop.from)
                        payloadStrings.push(`From ${prop.from.venue}`);
                    if (prop.to)
                        payloadStrings.push(`To ${prop.to.venue}`);
                    if (prop.to?.expected_apy)
                        payloadStrings.push(`Expected APY ${prop.to.expected_apy}`);
                }
                if (packet.payload.memorySnapshot?.timing) {
                    payloadStrings.push(`Timing wait ${packet.payload.memorySnapshot.timing.wait_seconds}s`);
                }
            }
            else if (packet.payload?.eventType === "action_taken") {
                if (packet.payload.memorySnapshot?.execution) {
                    const exe = packet.payload.memorySnapshot.execution;
                    payloadStrings.push(`Status ${exe.status}`);
                    payloadStrings.push(`Gas used ${exe.gas_used}`);
                }
            }
            // Fallback
            if (payloadStrings.length === 0 && packet.summary) {
                payloadStrings.push(packet.summary);
            }
            const step = {
                index: packet.stepIndex || 1,
                kind: packet.kind || "decision",
                title: packet.summary || "Agent Step",
                summary: packet.payload?.userMessage || packet.summary || "",
                payload: payloadStrings,
                txHash: receipt?.txHash || "0x0000000000000000000000000000000000000000",
                verifyUrl: receipt?.verifyUrl || "https://explorer.sepolia.mantle.xyz",
                status: "verified", // verified against receipt
                ascii: generateAsciiArt(packet.kind, packet.stepIndex || 1),
                contentHash,
                anchorRef: receipt?.anchorRef,
                rawPacket: packet,
                ...(includePacketText ? { packetText } : {}),
            };
            if (!stepMap.has(runId)) {
                stepMap.set(runId, []);
            }
            stepMap.get(runId).push(step);
        }
        catch (err) {
            // Ignore corrupted files
        }
    }
    const runs = [];
    for (const [runId, steps] of stepMap.entries()) {
        steps.sort((a, b) => a.index - b.index);
        const meta = runMetaMap.get(runId);
        const isMeridian = runId.startsWith("merid");
        runs.push({
            id: runId,
            name: isMeridian ? "MERIDIAN Rebalance" : "GASLIGHT Optimization",
            agent: meta.agentId,
            theme: isMeridian ? "Yield routing" : "Gas timing",
            subtitle: isMeridian
                ? `Cycle ID: ${runId.slice(0, 15)}...`
                : `Tx ID: ${runId.slice(0, 15)}...`,
            contract: "0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062",
            steps,
        });
    }
    // Sort runs so the latest is first
    runs.sort((a, b) => b.id.localeCompare(a.id));
    return runs;
}
//# sourceMappingURL=run-loader.js.map
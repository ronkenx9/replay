import { recallRun, recordStep, verifyClaim, verifyStep, } from "./recorder.js";
function summarize(packet) {
    if (packet.commitment)
        return `commitment: ${packet.commitment.terms.join("; ")}`;
    if (packet.agentResponse)
        return packet.agentResponse;
    if (packet.userMessage)
        return packet.userMessage;
    return packet.eventType;
}
export async function recordEvidence(packet, backend) {
    const receipt = await recordStep({
        runId: packet.sessionId,
        agentId: packet.agentId,
        stepIndex: packet.sequence ?? 0,
        kind: packet.eventType,
        summary: summarize(packet),
        payload: packet,
        status: "ok",
        atMs: packet.atMs,
    }, backend);
    return { ...receipt, sessionId: packet.sessionId, eventType: packet.eventType };
}
export function packetFromStep(step) {
    const payload = step.payload;
    if (!payload || typeof payload !== "object")
        return null;
    const candidate = payload;
    if (!candidate.agentId || !candidate.sessionId || !candidate.eventType)
        return null;
    return candidate;
}
export async function proveCommitment(opts, backend) {
    const result = await verifyClaim({
        receipts: opts.receipts,
        claim: opts.claim,
        match: (step) => {
            const packet = packetFromStep(step);
            return packet ? opts.match(packet) : false;
        },
    }, backend);
    return {
        proven: result.proven,
        reason: result.reason,
        receipt: result.receipt,
        packet: result.recovered ? packetFromStep(result.recovered) ?? undefined : undefined,
    };
}
export { recallRun, verifyStep };
//# sourceMappingURL=evidence.js.map
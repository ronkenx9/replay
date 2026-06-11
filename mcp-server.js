import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { forkDecision, listReplayRuns, recallReplayRun, verifyReplayPacket } from "./mcp-actions.js";
function jsonText(value) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(value, null, 2),
            },
        ],
    };
}
export function createReplayMcpServer() {
    const server = new McpServer({
        name: "replay",
        version: "0.1.0",
    });
    server.registerTool("REPLAY_RECALL", {
        title: "Recall a REPLAY run",
        description: "Return the verified local packet timeline for a recorded REPLAY run.",
        inputSchema: {
            runId: z.string().describe("Run id to recall. Use REPLAY_RECORD with listOnly=true to discover runs."),
            packetDir: z.string().optional().describe("Optional packet directory; defaults to data/packets."),
        },
    }, async ({ runId, packetDir }) => jsonText(await recallReplayRun({ runId, packetDir })));
    server.registerTool("REPLAY_RECORD", {
        title: "List recorded REPLAY runs",
        description: "List locally recorded REPLAY runs. v1 recording still happens through the SDK; this MCP tool exposes the recorded blackbox artifacts.",
        inputSchema: {
            packetDir: z.string().optional().describe("Optional packet directory; defaults to data/packets."),
        },
    }, async ({ packetDir }) => jsonText({
        mode: "list-recorded-runs",
        note: "Recording new agent steps is done through the REPLAY SDK in v1; MCP exposes recorded artifacts for recall/verify/fork.",
        runs: await listReplayRuns({ packetDir }),
    }));
    server.registerTool("REPLAY_VERIFY", {
        title: "Verify a REPLAY packet",
        description: "Verify a packet hash against the local blob and its persisted receipt anchor.",
        inputSchema: {
            contentHash: z.string().describe("64-character packet content hash."),
            packetDir: z.string().optional().describe("Optional packet directory; defaults to data/packets."),
        },
    }, async ({ contentHash, packetDir }) => jsonText(await verifyReplayPacket({ contentHash, packetDir })));
    server.registerTool("REPLAY_FORK", {
        title: "Fork a REPLAY decision",
        description: "Run the deterministic v1 fork model for a changed risk threshold and wallet idle amount. This does not claim LLM or eth_call replay.",
        inputSchema: {
            riskThreshold: z.number().describe("Risk threshold to test."),
            walletIdle: z.number().describe("Idle wallet capital to test."),
        },
    }, async ({ riskThreshold, walletIdle }) => jsonText(forkDecision({ riskThreshold, walletIdle })));
    return server;
}
export async function runReplayMcpServer() {
    const server = createReplayMcpServer();
    await server.connect(new StdioServerTransport());
}
if (import.meta.url === `file://${process.argv[1]}`) {
    runReplayMcpServer().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
//# sourceMappingURL=mcp-server.js.map
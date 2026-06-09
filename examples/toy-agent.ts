import { memoryBackend } from "../src/backends/memory.js";
import { createReplay } from "../src/sdk.js";

const replay = createReplay({ agentId: "toy-agent", runId: "demo-run", backend: memoryBackend() });
const ask = replay.wrap("risk-check", async (prompt: string) => `hold: ${prompt}`);
await ask("should rebalance mETH?");
console.log(replay.receipts[0]?.verifyUrl);

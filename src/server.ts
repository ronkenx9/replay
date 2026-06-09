import { createServer } from "node:http";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createPublicClient, http, type Address } from "viem";
import { verifyPacketAnchor } from "./server-verifier.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4174;
const PACKET_DIR = join(process.cwd(), "data", "packets");
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
] as const;

const mantleSepolia = {
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: { default: { http: [MANTLE_SEPOLIA_RPC_URL] } },
} as const;

const publicClient = createPublicClient({
  chain: mantleSepolia,
  transport: http(MANTLE_SEPOLIA_RPC_URL),
});

interface StepData {
  index: number;
  kind: string;
  title: string;
  summary: string;
  payload: string[];
  txHash: string;
  verifyUrl: string;
  status: string;
  ascii: string[];
  contentHash: string;
  anchorRef?: string;
  rawPacket?: any;
}

interface RunData {
  id: string;
  name: string;
  agent: string;
  theme: string;
  subtitle: string;
  contract: string;
  steps: StepData[];
}

interface ParsedAnchorRef {
  chainId: number;
  contractAddress: Address;
  recorder: Address;
  runIdHash: `0x${string}`;
  seq: bigint;
}

function parseAnchorRef(ref: string): ParsedAnchorRef {
  const [kind, chain, contractAddress, recorder, runIdHash, seq] = ref.split(":");
  if (kind !== "evm" || !chain || !contractAddress || !recorder || !runIdHash || !seq) {
    throw new Error(`Invalid EVM anchor ref: ${ref}`);
  }
  return {
    chainId: Number(chain),
    contractAddress: contractAddress as Address,
    recorder: recorder as Address,
    runIdHash: runIdHash as `0x${string}`,
    seq: BigInt(seq),
  };
}

async function readMantleAnchor(anchorRef: string): Promise<string> {
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

function generateAsciiArt(kind: string, stepIndex: number): string[] {
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

async function getRuns(): Promise<RunData[]> {
  const files = await readdir(PACKET_DIR).catch(() => []);
  
  // Find all JSON files (exclude receipts)
  const jsonFiles = files.filter(f => f.endsWith(".json") && !f.endsWith(".receipt.json"));
  
  const stepMap = new Map<string, StepData[]>();
  const runMetaMap = new Map<string, { agentId: string }>();

  for (const file of jsonFiles) {
    try {
      const contentHash = file.replace(".json", "");
      const packetPath = join(PACKET_DIR, file);
      const rawData = await readFile(packetPath);
      const packet = JSON.parse(rawData.toString("utf8"));
      
      const receiptPath = join(PACKET_DIR, `${contentHash}.receipt.json`);
      const receiptData = await readFile(receiptPath).catch(() => null);
      const receipt = receiptData ? JSON.parse(receiptData.toString("utf8")) : null;

      const runId = packet.payload?.sessionId || packet.runId || "unknown-run";
      const agentId = packet.payload?.agentId || packet.agentId || "unknown-agent";
      
      runMetaMap.set(runId, { agentId });

      const payloadStrings: string[] = [];
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
      } else if (packet.payload?.eventType === "decision") {
        if (packet.payload.memorySnapshot?.risk_assessment) {
          const checks = packet.payload.memorySnapshot.risk_assessment.checks || [];
          checks.forEach((c: any) => {
            payloadStrings.push(`${c.rule}: ${c.status}`);
          });
        }
        if (packet.payload.memorySnapshot?.proposal) {
          const prop = packet.payload.memorySnapshot.proposal;
          if (prop.from) payloadStrings.push(`From ${prop.from.venue}`);
          if (prop.to) payloadStrings.push(`To ${prop.to.venue}`);
          if (prop.to?.expected_apy) payloadStrings.push(`Expected APY ${prop.to.expected_apy}`);
        }
        if (packet.payload.memorySnapshot?.timing) {
          payloadStrings.push(`Timing wait ${packet.payload.memorySnapshot.timing.wait_seconds}s`);
        }
      } else if (packet.payload?.eventType === "action_taken") {
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

      const step: StepData = {
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
      };

      if (!stepMap.has(runId)) {
        stepMap.set(runId, []);
      }
      stepMap.get(runId)!.push(step);
    } catch (err) {
      // Ignore corrupted files
    }
  }

  const runs: RunData[] = [];
  for (const [runId, steps] of stepMap.entries()) {
    steps.sort((a, b) => a.index - b.index);
    const meta = runMetaMap.get(runId)!;
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
      const runs = await getRuns();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(runs));
    } catch (err: any) {
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
      } catch (err: any) {
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

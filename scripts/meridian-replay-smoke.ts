import "dotenv/config";
import { mkdir, readFile } from "node:fs/promises";
import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mantleSepolia } from "../src/chains.js";
import { createEvmBackend } from "../src/backends/evm.js";
import { recordEvidence, verifyStep } from "../src/core/evidence.js";
import { meridianDecisionToPackets, type MeridianDecisionLog } from "../src/adapters/meridian.js";

const fixturePath = process.argv[2] ?? "fixtures/meridian-dry-run-decision.json";
const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
const privateKey = process.env.MANTLE_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
const contractAddress = process.env.FLIGHT_RECORDER_ADDRESS as Address | undefined;

if (!privateKey) throw new Error("Missing MANTLE_PRIVATE_KEY or PRIVATE_KEY.");
if (!contractAddress) throw new Error("Missing FLIGHT_RECORDER_ADDRESS.");

const decision = JSON.parse(await readFile(fixturePath, "utf8")) as MeridianDecisionLog;
decision.cycle_id = `${decision.cycle_id}-${Date.now()}`;
const packets = meridianDecisionToPackets(decision);
if (packets.length < 4) throw new Error(`Expected at least 4 packets, got ${packets.length}.`);

const account = privateKeyToAccount(privateKey as `0x${string}`);
const publicClient = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain: mantleSepolia, transport: http(rpcUrl) });
const packetDir = "data/packets";
await mkdir(packetDir, { recursive: true });

const backend = createEvmBackend({ contractAddress, packetDir, publicClient, walletClient });
const receipts = [];
for (const packet of packets) {
  receipts.push(await recordEvidence(packet, backend));
}

const verifications = [];
for (const receipt of receipts) {
  const result = await verifyStep(receipt, backend);
  if (!result.verified) throw new Error(`Step ${receipt.stepIndex} failed verification: ${result.reason}`);
  verifications.push({ stepIndex: receipt.stepIndex, txHash: receipt.txHash, verifyUrl: receipt.verifyUrl });
}

console.log(JSON.stringify({
  cycleId: decision.cycle_id,
  packetCount: packets.length,
  verifiedCount: verifications.length,
  steps: verifications,
}, null, 2));

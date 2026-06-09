import "dotenv/config";
import { mkdir, readFile } from "node:fs/promises";
import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mantleSepolia } from "../src/chains.js";
import { createEvmBackend } from "../src/backends/evm.js";
import { recordEvidence, verifyStep } from "../src/core/evidence.js";
import { gaslightReportToPackets, type GaslightOptimizationReport } from "../src/adapters/gaslight.js";

const fixturePath = process.argv[2] ?? "fixtures/gaslight-optimization-report.json";
const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
const privateKey = process.env.MANTLE_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
const contractAddress = process.env.FLIGHT_RECORDER_ADDRESS as Address | undefined;

if (!privateKey) throw new Error("Missing MANTLE_PRIVATE_KEY or PRIVATE_KEY.");
if (!contractAddress) throw new Error("Missing FLIGHT_RECORDER_ADDRESS.");

const report = JSON.parse(await readFile(fixturePath, "utf8")) as GaslightOptimizationReport;
const packets = gaslightReportToPackets(report);

const account = privateKeyToAccount(privateKey as `0x${string}`);
const publicClient = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain: mantleSepolia, transport: http(rpcUrl) });
const packetDir = "data/packets";
await mkdir(packetDir, { recursive: true });

const backend = createEvmBackend({ contractAddress, packetDir, publicClient, walletClient });
const steps = [];
for (const packet of packets) {
  const receipt = await recordEvidence(packet, backend);
  const result = await verifyStep(receipt, backend);
  if (!result.verified) throw new Error(`Step ${receipt.stepIndex} failed verification: ${result.reason}`);
  steps.push({ stepIndex: receipt.stepIndex, txHash: receipt.txHash, verifyUrl: receipt.verifyUrl });
}

console.log(JSON.stringify({
  txId: report.tx_id,
  packetCount: packets.length,
  verifiedCount: steps.length,
  steps,
}, null, 2));

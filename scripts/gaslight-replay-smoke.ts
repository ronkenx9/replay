import "dotenv/config";
import { mkdir, readFile } from "node:fs/promises";
import { createPublicClient, http, type Address } from "viem";
import { mantleSepolia } from "../src/chains.js";
import { createEvmBackend } from "../src/backends/evm.js";
import { recordEvidence, verifyStep } from "../src/core/evidence.js";
import { gaslightReportToPackets, type GaslightOptimizationReport } from "../src/adapters/gaslight.js";
import { createAnchorWalletClient } from "../src/signing/anchor-wallet.js";

const fixturePath = process.argv[2] ?? "fixtures/gaslight-optimization-report.json";
const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
const contractAddress = process.env.FLIGHT_RECORDER_ADDRESS as Address | undefined;

if (!contractAddress) throw new Error("Missing FLIGHT_RECORDER_ADDRESS.");

const report = JSON.parse(await readFile(fixturePath, "utf8")) as GaslightOptimizationReport;
report.tx_id = `${report.tx_id}-${Date.now()}`;
const packets = gaslightReportToPackets(report);

const publicClient = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });
const signer = createAnchorWalletClient({ chain: mantleSepolia, rpcUrl });
const walletClient = signer.walletClient;
const packetDir = "data/packets";
await mkdir(packetDir, { recursive: true });
if (signer.warning) console.warn(`[REPLAY] ${signer.warning}`);

const backend = createEvmBackend({ contractAddress, packetDir, publicClient, walletClient });
const steps = [];
for (const packet of packets) {
  const receipt = await recordEvidence(packet, backend);
  const result = await verifyStep(receipt, backend);
  if (!result.verified) throw new Error(`Step ${receipt.stepIndex} failed verification: ${result.reason}`);
  steps.push({ stepIndex: receipt.stepIndex, txHash: receipt.txHash, verifyUrl: receipt.verifyUrl });
}

console.log(JSON.stringify({
  signerMode: signer.mode,
  signerAddress: signer.address,
  txId: report.tx_id,
  packetCount: packets.length,
  verifiedCount: steps.length,
  steps,
}, null, 2));

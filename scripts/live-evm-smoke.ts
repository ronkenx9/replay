import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createPublicClient, http, type Address } from "viem";
import { mantleSepolia } from "../src/chains.js";
import { createEvmBackend } from "../src/backends/evm.js";
import { recordStep, verifyStep } from "../src/core/recorder.js";
import { createAnchorWalletClient } from "../src/signing/anchor-wallet.js";

const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
const contractAddress = process.env.FLIGHT_RECORDER_ADDRESS as Address | undefined;

if (!contractAddress) throw new Error("Missing FLIGHT_RECORDER_ADDRESS.");

const publicClient = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });
const signer = createAnchorWalletClient({ chain: mantleSepolia, rpcUrl });
const walletClient = signer.walletClient;
const packetDir = "data/packets";
await mkdir(packetDir, { recursive: true });
if (signer.warning) console.warn(`[REPLAY] ${signer.warning}`);

const backend = createEvmBackend({ contractAddress, packetDir, publicClient, walletClient });
const receipt = await recordStep(
  {
    runId: `live-smoke-${Date.now()}`,
    agentId: "replay-live-smoke",
    stepIndex: 1,
    kind: "decision",
    summary: "live EVM smoke packet",
    payload: { chainId: mantleSepolia.id, contractAddress },
  },
  backend,
);

const green = await verifyStep(receipt, backend);
if (!green.verified) throw new Error(`Expected live verification to pass: ${green.reason}`);

const blobPath = join(packetDir, receipt.blobId);
const original = await readFile(blobPath, "utf8");
await writeFile(blobPath, original.replace("live EVM smoke packet", "tampered EVM smoke packet"));
const red = await verifyStep(receipt, backend);
if (red.verified) throw new Error("Expected tampered verification to fail.");

console.log(JSON.stringify({
  signerMode: signer.mode,
  signerAddress: signer.address,
  anchorRef: receipt.anchorRef,
  txHash: receipt.txHash,
  verifyUrl: receipt.verifyUrl,
  green: green.verified,
  red: red.verified,
  redReason: red.reason,
}, null, 2));

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { Address, Hash } from "viem";
import type { Backend } from "../core/recorder.js";

const FLIGHT_RECORDER_ABI = [
  {
    type: "function",
    name: "anchor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "runId", type: "bytes32" },
      { name: "seq", type: "uint256" },
      { name: "packetHash", type: "bytes32" },
    ],
    outputs: [],
  },
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

export interface EvmWalletClient {
  account?: { address: Address };
  writeContract(request: {
    address: Address;
    abi: typeof FLIGHT_RECORDER_ABI;
    functionName: "anchor";
    args: readonly [`0x${string}`, bigint, `0x${string}`];
  }): Promise<Hash>;
}

export interface EvmPublicClient {
  chain?: {
    id?: number;
    blockExplorers?: { default?: { url?: string } };
  };
  waitForTransactionReceipt(args: { hash: Hash }): Promise<{ transactionHash: Hash }>;
  readContract(request: {
    address: Address;
    abi: typeof FLIGHT_RECORDER_ABI;
    functionName: "getAnchorFor";
    args: readonly [Address, `0x${string}`, bigint];
  }): Promise<readonly [`0x${string}`, bigint] | readonly [`0x${string}`, number]>;
}

export interface EvmBackendOptions {
  contractAddress: Address;
  packetDir: string;
  publicClient: EvmPublicClient;
  walletClient: EvmWalletClient;
}

interface ParsedAnchorRef {
  chainId: number;
  contractAddress: Address;
  recorder: Address;
  runIdHash: `0x${string}`;
  seq: bigint;
}

function sha256Hex(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function prefixed(hex: string): `0x${string}` {
  return hex.startsWith("0x") ? (hex as `0x${string}`) : `0x${hex}`;
}

function unprefixed(hex: `0x${string}`): string {
  return hex.slice(2).toLowerCase();
}

function runIdToBytes32(runId: string): `0x${string}` {
  return prefixed(createHash("sha256").update(runId).digest("hex"));
}

function chainId(publicClient: EvmPublicClient): number {
  const id = publicClient.chain?.id;
  if (!id) throw new Error("EVM backend requires a public client with a chain id.");
  return id;
}

function recorderAddress(walletClient: EvmWalletClient): Address {
  const address = walletClient.account?.address;
  if (!address) throw new Error("EVM backend requires a wallet client account address.");
  return address;
}

function anchorRef(parts: ParsedAnchorRef): string {
  return [
    "evm",
    String(parts.chainId),
    parts.contractAddress,
    parts.recorder,
    parts.runIdHash,
    String(parts.seq),
  ].join(":");
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

function txUrl(publicClient: EvmPublicClient, txHash: Hash): string {
  const base = publicClient.chain?.blockExplorers?.default?.url;
  return base ? `${base.replace(/\/$/, "")}/tx/${txHash}` : txHash;
}

export function createEvmBackend(options: EvmBackendOptions): Backend {
  const { contractAddress, packetDir, publicClient, walletClient } = options;

  return {
    hashBytes: sha256Hex,

    async storeBlob(data) {
      const contentHash = sha256Hex(data);
      await mkdir(packetDir, { recursive: true });
      await writeFile(join(packetDir, `${contentHash}.json`), data);
      return { blobId: `${contentHash}.json`, contentHash };
    },

    async fetchBlob(blobId) {
      return readFile(join(packetDir, blobId));
    },

    async anchor({ runId, stepIndex, contentHash }) {
      const runIdHash = runIdToBytes32(runId);
      const seq = BigInt(stepIndex);
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: FLIGHT_RECORDER_ABI,
        functionName: "anchor",
        args: [runIdHash, seq, prefixed(contentHash)],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      const anchorResult = {
        anchorRef: anchorRef({
          chainId: chainId(publicClient),
          contractAddress,
          recorder: recorderAddress(walletClient),
          runIdHash,
          seq,
        }),
        txHash: receipt.transactionHash,
        verifyUrl: txUrl(publicClient, receipt.transactionHash),
      };

      try {
        const receiptPath = join(packetDir, `${contentHash}.receipt.json`);
        await writeFile(receiptPath, JSON.stringify(anchorResult, null, 2), "utf8");
      } catch (err) {
        // ignore write failures
      }

      return anchorResult;
    },

    async readAnchor(ref) {
      const parsed = parseAnchorRef(ref);
      const [contentHash] = await publicClient.readContract({
        address: parsed.contractAddress,
        abi: FLIGHT_RECORDER_ABI,
        functionName: "getAnchorFor",
        args: [parsed.recorder, parsed.runIdHash, parsed.seq],
      });

      return { contentHash: unprefixed(contentHash) };
    },
  };
}


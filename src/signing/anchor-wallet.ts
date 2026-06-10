import { createWalletClient, http, type Chain, type Transport, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createTencentKmsAccount } from "./tencent-kms.js";

export type AnchorSignerMode = "private-key" | "tencent-kms" | "tencent-kms-mock";

export interface AnchorWalletResult {
  walletClient: WalletClient<Transport, Chain>;
  mode: AnchorSignerMode;
  address: `0x${string}`;
  warning?: string;
}

export interface AnchorWalletEnv {
  REPLAY_SIGNER_MODE?: string;
  MANTLE_PRIVATE_KEY?: string;
  PRIVATE_KEY?: string;
  TENCENT_KMS_KEY_ID?: string;
  TENCENT_KMS_REGION?: string;
  TENCENT_SECRET_ID?: string;
  TENCENT_SECRET_KEY?: string;
  TENCENT_KMS_ADDRESS?: string;
}

export function createAnchorWalletClient(args: {
  env?: AnchorWalletEnv;
  chain: Chain;
  rpcUrl: string;
}): AnchorWalletResult {
  const env = args.env ?? process.env;
  const requestedMode = env.REPLAY_SIGNER_MODE ?? "private-key";

  if (requestedMode === "tencent-kms") {
    const kms = createTencentKmsAccount({
      keyId: env.TENCENT_KMS_KEY_ID,
      region: env.TENCENT_KMS_REGION,
      secretId: env.TENCENT_SECRET_ID,
      secretKey: env.TENCENT_SECRET_KEY,
      mockAddress: env.TENCENT_KMS_ADDRESS as `0x${string}` | undefined,
    });
    return {
      walletClient: createWalletClient({ account: kms.account, chain: args.chain, transport: http(args.rpcUrl) }),
      mode: kms.mode,
      address: kms.account.address,
      warning: kms.warning,
    };
  }

  if (requestedMode !== "private-key") {
    throw new Error(`Unsupported REPLAY_SIGNER_MODE "${requestedMode}". Use "private-key" or "tencent-kms".`);
  }

  const privateKey = env.MANTLE_PRIVATE_KEY ?? env.PRIVATE_KEY;
  if (!privateKey) throw new Error("Missing MANTLE_PRIVATE_KEY or PRIVATE_KEY.");

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return {
    walletClient: createWalletClient({ account, chain: args.chain, transport: http(args.rpcUrl) }),
    mode: "private-key",
    address: account.address,
  };
}

import { type Chain, type Transport, type WalletClient } from "viem";
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
export declare function createAnchorWalletClient(args: {
    env?: AnchorWalletEnv;
    chain: Chain;
    rpcUrl: string;
}): AnchorWalletResult;
//# sourceMappingURL=anchor-wallet.d.ts.map
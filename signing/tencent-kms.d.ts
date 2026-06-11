import { type Address, type Hex } from "viem";
import { toAccount } from "viem/accounts";
export interface TencentKmsConfig {
    keyId?: string;
    region?: string;
    secretId?: string;
    secretKey?: string;
    mockAddress?: Address;
}
export interface TencentKmsAccount {
    account: ReturnType<typeof toAccount>;
    mode: "tencent-kms" | "tencent-kms-mock";
    warning?: string;
}
export declare function parseDerSignature(der: Uint8Array): {
    r: Hex;
    s: Hex;
};
export declare function determineRecoveryId(hash: Hex, r: Hex, s: Hex, expectedAddress: Address): Promise<27 | 28>;
export declare function createTencentKmsAccount(config: TencentKmsConfig): TencentKmsAccount;
interface TencentHeaderConfig {
    secretId: string;
    secretKey: string;
    region: string;
    service: string;
    action: string;
    version: string;
    host: string;
    payload: string;
    timestamp: number;
    date: string;
}
export declare function buildTencentCloudHeaders(cfg: TencentHeaderConfig): Record<string, string>;
export {};
//# sourceMappingURL=tencent-kms.d.ts.map
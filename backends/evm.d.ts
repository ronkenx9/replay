import type { Address, Hash } from "viem";
import type { Backend } from "../core/recorder.js";
declare const FLIGHT_RECORDER_ABI: readonly [{
    readonly type: "function";
    readonly name: "anchor";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "runId";
        readonly type: "bytes32";
    }, {
        readonly name: "seq";
        readonly type: "uint256";
    }, {
        readonly name: "packetHash";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "getAnchorFor";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "recorder";
        readonly type: "address";
    }, {
        readonly name: "runId";
        readonly type: "bytes32";
    }, {
        readonly name: "seq";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "contentHash";
        readonly type: "bytes32";
    }, {
        readonly name: "atBlock";
        readonly type: "uint64";
    }];
}];
export interface EvmWalletClient {
    account?: {
        address: Address;
    };
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
        blockExplorers?: {
            default?: {
                url?: string;
            };
        };
    };
    waitForTransactionReceipt(args: {
        hash: Hash;
    }): Promise<{
        transactionHash: Hash;
    }>;
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
export declare function createEvmBackend(options: EvmBackendOptions): Backend;
export {};
//# sourceMappingURL=evm.d.ts.map
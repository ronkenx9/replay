export declare const mantle: {
    blockExplorers: {
        readonly default: {
            readonly name: "MantleScan";
            readonly url: "https://mantlescan.xyz";
        };
    };
    blockTime?: number | undefined | undefined;
    contracts?: {
        [x: string]: import("viem").ChainContract | {
            [sourceId: number]: import("viem").ChainContract | undefined;
        } | undefined;
        ensRegistry?: import("viem").ChainContract | undefined;
        ensUniversalResolver?: import("viem").ChainContract | undefined;
        multicall3?: import("viem").ChainContract | undefined;
        erc6492Verifier?: import("viem").ChainContract | undefined;
    } | undefined;
    ensTlds?: readonly string[] | undefined;
    id: 5000;
    name: "Mantle";
    nativeCurrency: {
        readonly decimals: 18;
        readonly name: "Mantle";
        readonly symbol: "MNT";
    };
    experimental_preconfirmationTime?: number | undefined | undefined;
    rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://rpc.mantle.xyz"];
        };
    };
    sourceId?: number | undefined | undefined;
    testnet?: boolean | undefined | undefined;
    custom?: Record<string, unknown> | undefined;
    extendSchema?: Record<string, unknown> | undefined;
    fees?: import("viem").ChainFees<undefined> | undefined;
    formatters?: undefined;
    prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
        client: import("viem").Client;
        phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
    }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
        client: import("viem").Client;
        phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
    }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
        runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
    }] | undefined;
    serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
    verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
};
export declare const mantleSepolia: {
    blockExplorers: {
        readonly default: {
            readonly name: "MantleScan Sepolia";
            readonly url: "https://explorer.sepolia.mantle.xyz";
        };
    };
    blockTime?: number | undefined | undefined;
    contracts?: {
        [x: string]: import("viem").ChainContract | {
            [sourceId: number]: import("viem").ChainContract | undefined;
        } | undefined;
        ensRegistry?: import("viem").ChainContract | undefined;
        ensUniversalResolver?: import("viem").ChainContract | undefined;
        multicall3?: import("viem").ChainContract | undefined;
        erc6492Verifier?: import("viem").ChainContract | undefined;
    } | undefined;
    ensTlds?: readonly string[] | undefined;
    id: 5003;
    name: "Mantle Sepolia";
    nativeCurrency: {
        readonly decimals: 18;
        readonly name: "Mantle";
        readonly symbol: "MNT";
    };
    experimental_preconfirmationTime?: number | undefined | undefined;
    rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://rpc.sepolia.mantle.xyz"];
        };
    };
    sourceId?: number | undefined | undefined;
    testnet?: boolean | undefined | undefined;
    custom?: Record<string, unknown> | undefined;
    extendSchema?: Record<string, unknown> | undefined;
    fees?: import("viem").ChainFees<undefined> | undefined;
    formatters?: undefined;
    prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
        client: import("viem").Client;
        phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
    }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
        client: import("viem").Client;
        phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
    }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
        runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
    }] | undefined;
    serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
    verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
};
export declare const CONTRACT_ADDRESSES: {
    readonly 5000: {
        readonly mETH: "0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa";
        readonly USDY: "0x5bE26527e817998A7206475496fDE1E68957c5A6";
        readonly USDC: "0x09Bc77796E694E4E6d0690aCC5dB5cfc30Ca27b5";
        readonly USDT: "0x201EBa5d93698b3b6478951152Cc577265eEaC00";
        readonly multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11";
        readonly moeRouter: "0x013e138EF6008ae5FDFDE29700e3f2Bc61d21E3a";
        readonly moeFactory: "0xa6630671775c4EA2743840F9A5016dCf2A104054";
        readonly agniRouter: "0xDD49e8979e2617f694F90d0b00a35e9545465C58";
        readonly aavePool: "0xCF111DF3dC764125f46BFC6471eE2e7c4f1cE5C8";
        readonly identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e";
        readonly agniPositionManager: "0x43867623910c5d258172eee0258fec0f84f4b88e0";
    };
    readonly 5003: {
        readonly mETH: "0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa";
        readonly USDY: "0x5bE26527e817998A7206475496fDE1E68957c5A6";
        readonly USDC: "0x8085B079738A2F250Bf05C5E644781CDD317D4a0";
        readonly USDT: "0x8085B079738A2F250Bf05C5E644781CDD317D4a0";
        readonly multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11";
        readonly moeRouter: "0x013e138EF6008ae5FDFDE29700e3f2Bc61d21E3a";
        readonly moeFactory: "0xa6630671775c4EA2743840F9A5016dCf2A104054";
        readonly agniRouter: "0xDD49e8979e2617f694F90d0b00a35e9545465C58";
        readonly aavePool: "0xCF111DF3dC764125f46BFC6471eE2e7c4f1cE5C8";
        readonly identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e";
        readonly agniPositionManager: "0x43867623910c5d258172eee0258fec0f84f4b88e0";
    };
};
export declare function getAddresses(chainId: number): {
    readonly mETH: "0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa";
    readonly USDY: "0x5bE26527e817998A7206475496fDE1E68957c5A6";
    readonly USDC: "0x09Bc77796E694E4E6d0690aCC5dB5cfc30Ca27b5";
    readonly USDT: "0x201EBa5d93698b3b6478951152Cc577265eEaC00";
    readonly multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11";
    readonly moeRouter: "0x013e138EF6008ae5FDFDE29700e3f2Bc61d21E3a";
    readonly moeFactory: "0xa6630671775c4EA2743840F9A5016dCf2A104054";
    readonly agniRouter: "0xDD49e8979e2617f694F90d0b00a35e9545465C58";
    readonly aavePool: "0xCF111DF3dC764125f46BFC6471eE2e7c4f1cE5C8";
    readonly identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e";
    readonly agniPositionManager: "0x43867623910c5d258172eee0258fec0f84f4b88e0";
} | {
    readonly mETH: "0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa";
    readonly USDY: "0x5bE26527e817998A7206475496fDE1E68957c5A6";
    readonly USDC: "0x8085B079738A2F250Bf05C5E644781CDD317D4a0";
    readonly USDT: "0x8085B079738A2F250Bf05C5E644781CDD317D4a0";
    readonly multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11";
    readonly moeRouter: "0x013e138EF6008ae5FDFDE29700e3f2Bc61d21E3a";
    readonly moeFactory: "0xa6630671775c4EA2743840F9A5016dCf2A104054";
    readonly agniRouter: "0xDD49e8979e2617f694F90d0b00a35e9545465C58";
    readonly aavePool: "0xCF111DF3dC764125f46BFC6471eE2e7c4f1cE5C8";
    readonly identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e";
    readonly agniPositionManager: "0x43867623910c5d258172eee0258fec0f84f4b88e0";
};
//# sourceMappingURL=chains.d.ts.map
import { describe, expect, it } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mantleSepolia } from "../chains.js";
import { createAnchorWalletClient } from "./anchor-wallet.js";
describe("anchor wallet selection", () => {
    it("uses the existing private-key signer by default", () => {
        const privateKey = generatePrivateKey();
        const expected = privateKeyToAccount(privateKey);
        const signer = createAnchorWalletClient({
            chain: mantleSepolia,
            rpcUrl: "http://127.0.0.1:8545",
            env: { MANTLE_PRIVATE_KEY: privateKey },
        });
        expect(signer.mode).toBe("private-key");
        expect(signer.address.toLowerCase()).toBe(expected.address.toLowerCase());
    });
    it("selects explicitly labeled Tencent KMS mock mode when credentials are absent", () => {
        const signer = createAnchorWalletClient({
            chain: mantleSepolia,
            rpcUrl: "http://127.0.0.1:8545",
            env: { REPLAY_SIGNER_MODE: "tencent-kms" },
        });
        expect(signer.mode).toBe("tencent-kms-mock");
        expect(signer.warning).toMatch(/mock signer/i);
    });
    it("requires a known address for live Tencent KMS mode", () => {
        expect(() => createAnchorWalletClient({
            chain: mantleSepolia,
            rpcUrl: "http://127.0.0.1:8545",
            env: {
                REPLAY_SIGNER_MODE: "tencent-kms",
                TENCENT_KMS_KEY_ID: "kms-key",
                TENCENT_SECRET_ID: "secret-id",
                TENCENT_SECRET_KEY: "secret-key",
            },
        })).toThrow(/TENCENT_KMS_ADDRESS/);
    });
});
//# sourceMappingURL=anchor-wallet.test.js.map
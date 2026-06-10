import { afterEach, describe, expect, it, vi } from "vitest";
import { hashMessage, recoverAddress, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createTencentKmsAccount, determineRecoveryId, parseDerSignature } from "./tencent-kms.js";

interface TestSignMessageAccount {
  address: Hex;
  signMessage(args: { message: string }): Promise<Hex>;
}

function encodeDerSignature(r: string, s: string): Buffer {
  let rBytes = Buffer.from(r.slice(2), "hex");
  let sBytes = Buffer.from(s.slice(2), "hex");

  if (rBytes[0] !== undefined && rBytes[0] & 0x80) rBytes = Buffer.concat([Buffer.from([0x00]), rBytes]);
  if (sBytes[0] !== undefined && sBytes[0] & 0x80) sBytes = Buffer.concat([Buffer.from([0x00]), sBytes]);

  const rPart = Buffer.concat([Buffer.from([0x02, rBytes.length]), rBytes]);
  const sPart = Buffer.concat([Buffer.from([0x02, sBytes.length]), sBytes]);
  return Buffer.concat([Buffer.from([0x30, rPart.length + sPart.length]), rPart, sPart]);
}

describe("Tencent KMS signer", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("parses DER signatures into 32-byte r/s values", () => {
    const der = Buffer.from(
      "3045022100e791e2b582ff977c61d5db283921762c4c81a28a2a2e7c61d5db283921762c4c02202c4c81a28a2a2e7c61d5db283921762c4c81a28a2a2e7c61d5db283921762c4c",
      "hex",
    );

    const parsed = parseDerSignature(der);

    expect(parsed.r).toMatch(/^0x[0-9a-f]{64}$/);
    expect(parsed.s).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("labels missing credentials as mock mode and signs recoverable messages", async () => {
    const signer = createTencentKmsAccount({});

    const account = signer.account as TestSignMessageAccount;
    const signature = await account.signMessage({ message: "mock kms signer" });
    const recovered = await recoverAddress({ hash: hashMessage("mock kms signer"), signature });

    expect(signer.mode).toBe("tencent-kms-mock");
    expect(signer.warning).toMatch(/mock signer/i);
    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });

  it("determines the recovery id for a real secp256k1 signature", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const message = "recover me";
    const signature = await account.signMessage({ message });

    const v = await determineRecoveryId(
      hashMessage(message),
      `0x${signature.slice(2, 66)}`,
      `0x${signature.slice(66, 130)}`,
      account.address,
    );

    expect([27, 28]).toContain(v);
  });

  it("calls Tencent Cloud KMS with the expected AsymmetricSign payload", async () => {
    const backingAccount = privateKeyToAccount(generatePrivateKey());
    const message = "sign via kms api";
    const signature = await backingAccount.signMessage({ message });
    const der = encodeDerSignature(`0x${signature.slice(2, 66)}`, `0x${signature.slice(66, 130)}`);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Response: { Signature: der.toString("base64"), KeyId: "kms-key" } }),
    } as Response);

    const signer = createTencentKmsAccount({
      keyId: "kms-key",
      region: "ap-guangzhou",
      secretId: "secret-id",
      secretKey: "secret-key",
      mockAddress: backingAccount.address,
    });

    const kmsSignature = await (signer.account as TestSignMessageAccount).signMessage({ message });
    const recovered = await recoverAddress({ hash: hashMessage(message), signature: kmsSignature });
    const call = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(call?.[1]?.body as string) as Record<string, string>;

    expect(signer.mode).toBe("tencent-kms");
    expect(call?.[0]).toBe("https://kms.tencentcloudapi.com");
    expect(body).toMatchObject({
      KeyId: "kms-key",
      Algorithm: "ECC_SECP256K1",
      Message: hashMessage(message).slice(2),
      MessageType: "RAW",
    });
    expect(recovered.toLowerCase()).toBe(backingAccount.address.toLowerCase());
  });
});

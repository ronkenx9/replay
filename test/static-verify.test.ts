import { afterEach, describe, expect, it, vi } from "vitest";
import { parseAnchorRef, verifyPacketStatic } from "../src/viewer/static-verify.js";

// sha256("hello")
const HELLO_HASH = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";
const ANCHOR_REF =
  "evm:5003:0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062:0x5a1b8F72e3D280eAEdC28aDb5909d3358e9a5B4C:0x2f2887c18f0fb11d99a8b2d4c9231c970ee0e6951ce063caf72f4e130d416093:2";

function rpcResponseWithHash(hash: string) {
  return {
    ok: true,
    json: async () => ({ jsonrpc: "2.0", id: 1, result: `0x${hash}${"0".repeat(64)}` }),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("static-verify (browser-side, no API)", () => {
  it("parses an EVM anchor ref", () => {
    const parsed = parseAnchorRef(ANCHOR_REF);
    expect(parsed.chainId).toBe(5003);
    expect(parsed.seq).toBe(2n);
    expect(parsed.contractAddress).toBe("0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062");
  });

  it("rejects a malformed anchor ref", () => {
    expect(() => parseAnchorRef("sui:1:0xabc")).toThrow(/Invalid EVM anchor ref/);
  });

  it("verifies when local hash and on-chain anchor both match", async () => {
    const fetchMock = vi.fn().mockResolvedValue(rpcResponseWithHash(HELLO_HASH));
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyPacketStatic({
      contentHash: HELLO_HASH,
      packetText: "hello",
      anchorRef: ANCHOR_REF,
    });

    expect(result.verified).toBe(true);
    expect(result.localMatch).toBe(true);
    expect(result.anchorMatch).toBe(true);
    expect(result.onChainHash).toBe(HELLO_HASH);
    // The eth_call payload must carry the hand-encoded selector + 3 words
    const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(body.params[0].data).toMatch(/^0xe7d6b7c1[0-9a-f]{192}$/);
  });

  it("flips red on tamper (appended bytes change the local hash)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(rpcResponseWithHash(HELLO_HASH)));

    const result = await verifyPacketStatic({
      contentHash: HELLO_HASH,
      packetText: "hello",
      anchorRef: ANCHOR_REF,
      tamper: true,
    });

    expect(result.verified).toBe(false);
    expect(result.localMatch).toBe(false);
    expect(result.anchorMatch).toBe(true);
    expect(result.reason).toMatch(/Local packet hash mismatch/);
  });

  it("flips red when the on-chain anchor disagrees", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(rpcResponseWithHash("ab".repeat(32))));

    const result = await verifyPacketStatic({
      contentHash: HELLO_HASH,
      packetText: "hello",
      anchorRef: ANCHOR_REF,
    });

    expect(result.verified).toBe(false);
    expect(result.anchorMatch).toBe(false);
    expect(result.reason).toMatch(/On-chain anchor mismatch/);
  });

  it("never silently verifies on an unexpected chain id", async () => {
    await expect(
      verifyPacketStatic({
        contentHash: HELLO_HASH,
        packetText: "hello",
        anchorRef: ANCHOR_REF.replace("evm:5003", "evm:5001"),
      }),
    ).rejects.toThrow(/expected Mantle Sepolia 5003/);
  });
});

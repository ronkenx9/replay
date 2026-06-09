import { describe, expect, it } from "vitest";
import { verifyPacketAnchor } from "./server-verifier.js";

const packetBytes = new TextEncoder().encode(JSON.stringify({ run: "replay", step: 1 }));

describe("verifyPacketAnchor", () => {
  it("requires both the local packet hash and on-chain anchor hash to match", async () => {
    const contentHash = "6e63bb64269474f09031357eb4091a207f373f5aee97c8c9fe9c118a59e7fcab";

    const result = await verifyPacketAnchor({
      contentHash,
      packetBytes,
      anchorRef: "evm:5003:0x0000000000000000000000000000000000000001:0x0000000000000000000000000000000000000002:0xabc:1",
      readAnchor: async () => contentHash,
    });

    expect(result.verified).toBe(true);
    expect(result.localMatch).toBe(true);
    expect(result.anchorMatch).toBe(true);
    expect(result.computedHash).toBe(contentHash);
    expect(result.onChainHash).toBe(contentHash);
  });

  it("marks local packet mutations as tampered even when the anchor still matches the original hash", async () => {
    const result = await verifyPacketAnchor({
      contentHash: "0".repeat(64),
      packetBytes,
      anchorRef: "evm:5003:0x0000000000000000000000000000000000000001:0x0000000000000000000000000000000000000002:0xabc:1",
      readAnchor: async () => "0".repeat(64),
    });

    expect(result.verified).toBe(false);
    expect(result.localMatch).toBe(false);
    expect(result.anchorMatch).toBe(true);
    expect(result.reason).toContain("Local packet hash mismatch");
  });

  it("marks anchor mismatches as tampered when the chain returns a different hash", async () => {
    const contentHash = "6e63bb64269474f09031357eb4091a207f373f5aee97c8c9fe9c118a59e7fcab";

    const result = await verifyPacketAnchor({
      contentHash,
      packetBytes,
      anchorRef: "evm:5003:0x0000000000000000000000000000000000000001:0x0000000000000000000000000000000000000002:0xabc:1",
      readAnchor: async () => "f".repeat(64),
    });

    expect(result.verified).toBe(false);
    expect(result.localMatch).toBe(true);
    expect(result.anchorMatch).toBe(false);
    expect(result.reason).toContain("On-chain anchor mismatch");
  });
});

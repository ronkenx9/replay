import { describe, expect, it } from "vitest";
import { getAddresses, mantleSepolia } from "./chains.js";

describe("Mantle chain configuration", () => {
  it("pins Mantle Sepolia to chain id 5003", () => {
    expect(mantleSepolia.id).toBe(5003);
  });

  it("throws on unknown chain ids instead of silently falling back to mainnet", () => {
    expect(() => getAddresses(5001)).toThrow(/unsupported chain/i);
  });
});

/**
 * derive-kms-address.ts — one-time setup helper for Tencent KMS signing.
 *
 * Calls Tencent Cloud KMS `GetPublicKey` for the configured asymmetric key,
 * decodes the secp256k1 public key, and derives the EVM address. Put the
 * printed address in .env as TENCENT_KMS_ADDRESS, then fund it with Sepolia
 * MNT so it can pay anchor gas.
 *
 * Usage:
 *   TENCENT_SECRET_ID=... TENCENT_SECRET_KEY=... TENCENT_KMS_KEY_ID=... \
 *     npx tsx scripts/derive-kms-address.ts
 * (or fill .env first and just run it — dotenv is loaded.)
 */
import "dotenv/config";
import { keccak256, toHex } from "viem";
import { buildTencentCloudHeaders } from "../src/signing/tencent-kms.js";

const secretId = process.env.TENCENT_SECRET_ID;
const secretKey = process.env.TENCENT_SECRET_KEY;
const keyId = process.env.TENCENT_KMS_KEY_ID;
const region = process.env.TENCENT_KMS_REGION ?? "ap-guangzhou";

if (!secretId || !secretKey || !keyId) {
  console.error(
    "Missing credentials. Set TENCENT_SECRET_ID, TENCENT_SECRET_KEY, and TENCENT_KMS_KEY_ID " +
      "(in the environment or .env) before running this script.",
  );
  process.exit(1);
}

const service = "kms";
const host = `${service}.tencentcloudapi.com`;
const timestamp = Math.floor(Date.now() / 1000);
const payload = JSON.stringify({ KeyId: keyId });

const headers = buildTencentCloudHeaders({
  secretId,
  secretKey,
  region,
  service,
  action: "GetPublicKey",
  version: "2019-01-18",
  host,
  payload,
  timestamp,
  date: new Date(timestamp * 1000).toISOString().split("T")[0]!,
});

const response = await fetch(`https://${host}`, { method: "POST", headers, body: payload });
if (!response.ok) {
  console.error(`KMS request failed (${response.status}): ${await response.text()}`);
  process.exit(1);
}

const data = (await response.json()) as {
  Response?: { Error?: { Code?: string; Message?: string }; PublicKey?: string };
};
if (data.Response?.Error) {
  console.error(`KMS API error [${data.Response.Error.Code}]: ${data.Response.Error.Message}`);
  console.error(
    "Hint: the key must be an ASYMMETRIC signing key on the secp256k1 curve, " +
      "created in the same region as TENCENT_KMS_REGION.",
  );
  process.exit(1);
}
if (!data.Response?.PublicKey) {
  console.error("KMS returned no public key.");
  process.exit(1);
}

// PublicKey is base64 DER (SubjectPublicKeyInfo). The uncompressed secp256k1
// point is the trailing 65 bytes: 0x04 || X(32) || Y(32).
const der = Buffer.from(data.Response.PublicKey, "base64");
const marker = der.lastIndexOf(0x04);
const point = der.subarray(marker);
if (point.length !== 65 || point[0] !== 0x04) {
  console.error(
    `Could not locate an uncompressed secp256k1 point in the DER public key ` +
      `(got ${point.length} bytes from marker). Is the key really secp256k1?`,
  );
  process.exit(1);
}

const address = `0x${keccak256(toHex(point.subarray(1))).slice(-40)}`;

console.log("KMS key id     :", keyId);
console.log("Region         :", region);
console.log("EVM address    :", address);
console.log("");
console.log("Next steps:");
console.log(`  1. Add to .env:  TENCENT_KMS_ADDRESS=${address}`);
console.log("  2. Fund it with Sepolia MNT (it pays anchor gas).");
console.log("  3. Verify live:  REPLAY_SIGNER_MODE=tencent-kms npm run smoke:evm");
console.log("     Expect signerMode=tencent-kms (NOT tencent-kms-mock).");

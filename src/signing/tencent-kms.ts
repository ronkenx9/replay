import { createHash, createHmac } from "node:crypto";
import {
  hashMessage,
  hashTypedData,
  keccak256,
  recoverAddress,
  serializeSignature,
  serializeTransaction,
  type Address,
  type Hex,
  type Signature,
} from "viem";
import { generatePrivateKey, privateKeyToAccount, toAccount } from "viem/accounts";

export interface TencentKmsConfig {
  keyId?: string;
  region?: string;
  secretId?: string;
  secretKey?: string;
  mockAddress?: Address;
  endpointHost?: string;
  algorithm?: string;
}

export interface TencentKmsAccount {
  account: ReturnType<typeof toAccount>;
  mode: "tencent-kms" | "tencent-kms-mock";
  warning?: string;
}

export function parseDerSignature(der: Uint8Array): { r: Hex; s: Hex } {
  if (der[0] !== 0x30) throw new Error("Invalid DER signature header");

  let pos = 2;
  const lengthByte = der[1];
  if (lengthByte === undefined) throw new Error("Invalid DER signature length");
  if (lengthByte & 0x80) pos += lengthByte & 0x7f;

  if (der[pos] !== 0x02) throw new Error("Invalid R header in DER");
  const lenR = der[pos + 1];
  if (lenR === undefined) throw new Error("Invalid R length in DER");
  let rBytes = der.slice(pos + 2, pos + 2 + lenR);
  if (rBytes[0] === 0x00) rBytes = rBytes.slice(1);

  pos = pos + 2 + lenR;
  if (der[pos] !== 0x02) throw new Error("Invalid S header in DER");
  const lenS = der[pos + 1];
  if (lenS === undefined) throw new Error("Invalid S length in DER");
  let sBytes = der.slice(pos + 2, pos + 2 + lenS);
  if (sBytes[0] === 0x00) sBytes = sBytes.slice(1);

  return {
    r: `0x${Buffer.from(rBytes).toString("hex").padStart(64, "0")}`,
    s: `0x${Buffer.from(sBytes).toString("hex").padStart(64, "0")}`,
  };
}

export async function determineRecoveryId(hash: Hex, r: Hex, s: Hex, expectedAddress: Address): Promise<27 | 28> {
  for (const v of [27, 28] as const) {
    try {
      const recovered = await recoverAddress({ hash, signature: serializeSignature({ r, s, v: BigInt(v) }) });
      if (recovered.toLowerCase() === expectedAddress.toLowerCase()) return v;
    } catch {
      // Try the other recovery id.
    }
  }

  throw new Error("Failed to determine ECDSA recovery parameter from KMS signature");
}

export function createTencentKmsAccount(config: TencentKmsConfig): TencentKmsAccount {
  const missingCredentials = !config.secretId || !config.secretKey || !config.keyId;

  if (missingCredentials) {
    const fallbackAccount = privateKeyToAccount(generatePrivateKey());
    const account = toAccount({
      address: config.mockAddress ?? fallbackAccount.address,
      signMessage: ({ message }) => fallbackAccount.signMessage({ message }),
      signTransaction: (transaction, options = {}) => fallbackAccount.signTransaction(transaction, options),
      signTypedData: (typedData) => fallbackAccount.signTypedData(typedData),
    });

    return {
      account,
      mode: "tencent-kms-mock",
      warning: "Tencent KMS credentials are incomplete; using an ephemeral local mock signer.",
    };
  }

  const address = config.mockAddress;
  if (!address) {
    throw new Error("TENCENT_KMS_ADDRESS is required for live Tencent KMS signing.");
  }

  return {
    account: toAccount({
      address,
      async signMessage({ message }) {
        const signature = await signHashWithKms(hashMessage(message), address, config);
        return serializeSignature(signature);
      },
      async signTransaction(transaction, { serializer = serializeTransaction } = {}) {
        const serialized = await serializer(transaction);
        const signature = await signHashWithKms(keccak256(serialized), address, config);
        return serializer(transaction, signature);
      },
      async signTypedData(typedData) {
        const signature = await signHashWithKms(hashTypedData(typedData), address, config);
        return serializeSignature(signature);
      },
    }),
    mode: "tencent-kms",
  };
}

async function signHashWithKms(hash: Hex, expectedAddress: Address, config: TencentKmsConfig): Promise<Signature> {
  const {
    keyId,
    region = "ap-guangzhou",
    secretId,
    secretKey,
    endpointHost = "kms.intl.tencentcloudapi.com",
    algorithm = "ECC_SECP256K1",
  } = config;
  if (!keyId || !secretId || !secretKey) throw new Error("Tencent KMS credentials are incomplete.");

  const action = "SignByAsymmetricKey";
  const service = "kms";
  const version = "2019-01-18";
  const host = endpointHost;
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().split("T")[0]!;
  const payload = JSON.stringify({
    KeyId: keyId,
    Algorithm: algorithm,
    Message: Buffer.from(hash.slice(2), "hex").toString("base64"),
    MessageType: "DIGEST",
  });

  const headers = buildTencentCloudHeaders({
    secretId,
    secretKey,
    region,
    service,
    action,
    version,
    host,
    payload,
    timestamp,
    date,
  });

  const response = await fetch(`https://${host}`, { method: "POST", headers, body: payload });
  if (!response.ok) {
    throw new Error(`Tencent Cloud KMS request failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { Response?: { Error?: { Message?: string }; Signature?: string } };
  if (data.Response?.Error) throw new Error(`Tencent Cloud KMS API Error: ${data.Response.Error.Message}`);
  if (!data.Response?.Signature) throw new Error("Tencent Cloud KMS returned no signature.");

  const { r, s } = parseDerSignature(Buffer.from(data.Response.Signature, "base64"));
  const v = await determineRecoveryId(hash, r, s, expectedAddress);
  return { r, s, v: BigInt(v) };
}

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

export function buildTencentCloudHeaders(cfg: TencentHeaderConfig): Record<string, string> {
  const canonicalHeaders = `content-type:application/json\nhost:${cfg.host}\n`;
  const signedHeaders = "content-type;host";
  const hashedRequestPayload = sha256Hex(cfg.payload);
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;
  const credentialScope = `${cfg.date}/${cfg.service}/tc3_request`;
  const stringToSign = [
    "TC3-HMAC-SHA256",
    String(cfg.timestamp),
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const secretDate = hmac(`TC3${cfg.secretKey}`, cfg.date);
  const secretService = hmac(secretDate, cfg.service);
  const secretSigning = hmac(secretService, "tc3_request");
  const signature = createHmac("sha256", secretSigning).update(stringToSign).digest("hex");

  return {
    Authorization: `TC3-HMAC-SHA256 Credential=${cfg.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "Content-Type": "application/json",
    Host: cfg.host,
    "X-TC-Action": cfg.action,
    "X-TC-Version": cfg.version,
    "X-TC-Region": cfg.region,
    "X-TC-Timestamp": String(cfg.timestamp),
  };
}

function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

function hmac(key: string | Buffer, message: string): Buffer {
  return createHmac("sha256", key).update(message).digest();
}

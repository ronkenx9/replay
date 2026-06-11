# REPLAY

Flight recorder + time-travel debugger for on-chain AI agents on Mantle. Every agent decision
becomes a hash-anchored Evidence Packet; the viewer replays the run step by step, live-verifies
each packet against the on-chain anchor, and proves tampering in one click.

**Mantle Turing Test 2026 — AI DevTools track (Tencent Cloud)**

**Live:** [Time-travel viewer](https://ronkenx9.github.io/replay/) · [FlightRecorder on Explorer](https://explorer.sepolia.mantle.xyz/address/0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062)

> Agents fail silently. REPLAY is the black box you bolt on before takeoff: record → anchor →
> replay → verify.

## Quick start

```bash
git clone https://github.com/ronkenx9/replay && cd replay
npm install
npm test            # 36 tests (core, backends, SDK, MCP actions, viewer, static verify)
npm run build       # tsc clean
npm run demo:toy    # record a toy agent run end-to-end (in-memory backend, no wallet needed)
npm run dev         # API server :4174 (runs list + live /api/verify)
npm run dev:web     # Vite viewer :5173
```

Judges need **no wallet**: the in-memory backend covers the full record→verify loop, and the
public viewer ships with committed demo packets carrying real Mantle Sepolia anchor receipts.

## What it does

1. **Record.** The capture SDK (`createReplay({agentId, runId, backend})`) wraps an agent's
   steps. Each step is serialized into a canonical Evidence Packet; `sha256(packet)` is the
   content hash.
2. **Anchor.** `FlightRecorder.sol` stores the hash on Mantle Sepolia — write-once per
   `(sender, runId, seq)`. The packet body stays local/storage; the chain holds the proof.
3. **Replay.** The viewer renders the run as a timeline: every step, its tool calls, memory
   snapshot, and anchor tx.
4. **Verify.** One click recomputes the packet hash and reads `getAnchorFor` on Mantle —
   green when they match. The tamper check appends bytes to the packet and shows the proof
   flip red, non-destructively.
5. **Fork.** Change a recorded decision's inputs (risk threshold, wallet idle) and re-run the
   **deterministic decision logic** to see the decision split — original vs fork, side by side.

## Deployed (Mantle Sepolia — chain 5003)

| Item | Value |
|---|---|
| FlightRecorder.sol | [`0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062`](https://explorer.sepolia.mantle.xyz/address/0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062) |
| Verification | Sourcify exact_match (creation + runtime) |
| Deploy tx | `0xd7cfa4fdf53a8ebd450c4a5596331c66ba6e5ae3e4142974b4ff45d248b206b9` |
| Demo packets | `fixtures/demo-packets/` — real packets, real Sepolia anchor txs |

The public viewer is fully static: the browser itself recomputes sha256 and calls
`getAnchorFor` on Mantle RPC (`src/viewer/static-verify.ts`) — no REPLAY backend required
to verify a packet. That is the point: the proof doesn't need us.

## Architecture

```
 agent steps          Evidence Packets             Mantle Sepolia
┌───────────┐  SDK   ┌──────────────────┐  anchor ┌──────────────────┐
│ tool_call │ ─────▶ │ canonical JSON   │ ──────▶ │ FlightRecorder   │
│ decision  │        │ sha256 content   │         │ (sender,runId,   │
│ action    │        │ hash + receipt   │         │  seq) → hash     │
└───────────┘        └────────┬─────────┘         └────────┬─────────┘
                              ▼                            │
                     ┌──────────────────┐    verify        │
                     │ viewer: timeline │ ◀─────────────────┘
                     │ live-verify ·    │  (API server, or the
                     │ tamper proof ·   │   browser directly via
                     │ fork & diff      │   static-verify)
                     └──────────────────┘
```

- Core: `src/core/{recorder,evidence}.ts` (port of BOUND's black-box engine — see Provenance)
- Backends: `src/backends/{memory,evm}.ts` (dependency-injected)
- SDK: `src/sdk.ts` · adapters: `src/adapters/{meridian,gaslight}.ts` (two real demo clients)
- MCP: `REPLAY_RECORD` / `REPLAY_RECALL` / `REPLAY_VERIFY` / `REPLAY_FORK` (`npm run mcp`)
- Signing: local key or **Tencent Cloud KMS** (`REPLAY_SIGNER_MODE=tencent-kms`,
  `src/signing/tencent-kms.ts` — AsymmetricSign; reports `tencent-kms-mock` without creds)
- Serverless: `serverless.yml` — Tencent SCF web function serving the demo packet API

## Provenance

The recorder/evidence core is an EVM port of **BOUND**'s black-box engine (same author),
originally built for Sui/Walrus. REPLAY is the Mantle-native cut: EVM anchor contract,
Mantle-pointed backends, and the time-travel viewer built for this hackathon.

## Honest limitations

- **Fork & replay re-executes the agent's deterministic decision logic.** There is no LLM
  re-run and no historical `eth_call`/state forking — that's roadmap, and it's why forks are
  reproducible.
- **Blob storage is tamper-EVIDENT, not tamper-proof.** The chain proves a packet changed;
  it cannot recover the original bytes if you lose them.
- **Anchors are testnet** (Mantle Sepolia 5003). Mainnet is a config change, not a code change.
- **Tencent KMS live mode needs credentials** (`TENCENT_SECRET_ID/KEY`, `TENCENT_KMS_KEY_ID`,
  `TENCENT_KMS_ADDRESS`); without them the smoke deliberately reports `tencent-kms-mock`.

## Commands

```bash
npm test                 # vitest (36)
npm run contract:test    # foundry tests for FlightRecorder.sol
npm run smoke:evm        # live record→anchor→verify→tamper-fail on Mantle Sepolia (.env key)
npm run smoke:meridian   # anchor a real MERIDIAN agent run
npm run smoke:gaslight   # anchor a real GASLIGHT agent run
npm run build:pages      # static viewer bundle (committed demo packets + browser verify)
npm run kms:derive-address  # Tencent KMS → EVM address (one-time setup)
```

## Tech stack

TypeScript · viem · Solidity 0.8.24 (Foundry) · React + Vite (viewer) ·
@modelcontextprotocol/sdk · Tencent Cloud KMS + SCF

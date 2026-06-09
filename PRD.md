# REPLAY — Product Requirements Document

> The flight recorder + time-travel debugger for on-chain AI agents. "LangSmith for agents
> that move money." Record every decision (model input, output, tool calls, the tx) — anchored
> on Mantle — then scrub the timeline, inspect any moment, and fork it: deterministically
> re-execute the decision with edited inputs and diff the outcome.

**Hackathon:** Mantle Turing Test 2026 — deadline 2026-06-15 16:59
**Track:** DevTool (exclusively supported by Tencent Cloud)
**Role in portfolio:** devtool lead (replaces gaslight-as-lead; gaslight demoted to optional
cheap submit + REPLAY demo client).

---

## 1. Why this wins the devtool track

Every team in this hackathon is building agents, and every one of them debugs via console
logs. REPLAY's user base is sitting in the same Discord during judging week. Observability is
a category judges already understand (Datadog/LangSmith exist) — zero explanation tax. And
"agents that move money need a black box" lands harder here than anywhere: the audience just
watched their own agent do something inexplicable on testnet.

## 2. Provenance of the core (be honest about this in the README — it's a strength)

This is the **EVM port of BOUND's black-box core** (Sui/Walrus, built & proven 2026-06-08):
- `recorder.ts` (275 LOC) — recordStep (hash→encrypt→store→anchor), verifyStep (re-fetch,
  recompute SHA-256, check vs on-chain anchor, fail closed), recallRun (verified timeline).
  **Dependency-injected backends** — the port is a backend swap, not a rewrite.
- `evidence.ts` (150 LOC) — Evidence Packet: {agentId, sessionId, eventType, modelInput,
  modelOutput, toolCalls, commitment, memorySnapshot}.
- `memory-backend.ts` — in-memory backend: full record→verify path runs offline (judges
  without a wallet, demo resilience).

⚠️ STOP-AND-ASK (owner decision before DoraHacks submission, not before building):
submission must be open-source → this open-sources a port of BOUND's core. Owner decides
scope of what's published. Build proceeds; the submission click waits on this.

## 3. What's new vs BOUND (the actual build)

| Piece | Work |
|---|---|
| **EVM anchor backend** | `contracts/FlightRecorder.sol` on Mantle Sepolia (5003): `anchor(bytes32 runId, uint256 seq, bytes32 packetHash)` + event. Packet blobs: local store served via API (v1), hash-anchored on-chain = tamper-evident. HONEST FRAMING (R2): Walrus made BOUND's blobs immutable; here immutability lives in the on-chain hash, blob storage is conventional. Say exactly that. |
| **Capture SDK** | `replay.wrap(agent)` / explicit `replay.record({input, output, toolCalls, txHash})` — TS, viem-native. The 6-line instrumentation quickstart is the pitch. |
| **Time-travel viewer** | Web UI: run timeline scrubber → packet inspector ("what did the agent know at block N?") → verify badge per step (hash vs on-chain anchor, live check). |
| **Fork & replay** | The judge-melting moment: select a step → edit its inputs (balances, APYs, risk floors) → **deterministically re-execute the agent's decision logic** → side-by-side diff of what the agent did vs would-have-done. NO LLM in the replay path — forks are reproducible by construction (R3 as a feature, say this in the pitch). HONEST LIMITS (R2): v1 re-executes decision logic only; it does NOT re-run model calls and does NOT re-simulate txs via historical `eth_call` — both are roadmap. Never claim either. |
| **MCP server** | REPLAY_RECORD, REPLAY_RECALL, REPLAY_VERIFY, REPLAY_FORK — agents can introspect their own history. |

## 4. Demo clients = the dead projects work again

Instrument **MERIDIAN** (its JSONL decision logs map 1:1 to Evidence Packets — signals,
risk checks, proposal, receipt) and **gaslight** (optimization decisions). The demo shows a
*real* yield agent's questionable rebalance, then time-travels into it and forks the prompt.
MERIDIAN gets dissected on camera by REPLAY — a better end than being submitted.

## 5. Tencent fit

- Viewer + packet API deployed via Tencent serverless (reuse gaslight's `deploy.tencent.sh` /
  `serverless.yml` patterns); packet blobs → Tencent COS (v1 stretch; local disk ships).
- Inherit gaslight's Tencent KMS signer for the anchor wallet (already written: `submitter/kms.ts`).
- Pitch line: "trace storage and replay workers run on Tencent Cloud; signing via Tencent KMS."

## 6. Judging map

| Criterion | Answer |
|---|---|
| Part A Technical (15) | Verified-anchor architecture, fail-closed verification, deterministic fork-and-diff replay |
| Part A Ecosystem (10) | Instruments agents ON Mantle; anchor contract on Mantle; every hackathon team is a potential user |
| Part B (Tencent) | KMS + serverless + COS are load-bearing, not stickers |
| Innovation | Time-travel debugging for on-chain agents — category exists (LangSmith) but not on-chain; reproducible no-LLM fork-and-diff is the wedge |
| Deployment award | FlightRecorder.sol verified on explorer; every `anchor()` call IS an AI decision written on-chain — the cleanest possible checkbox |
| Adoption proof | 2 instrumented in-house agents + SDK offered in hackathon Discord (owner action) during judging week |

## 7. Demo flow (video ≥2min)

1. Hook: MERIDIAN makes a rebalance that looks wrong. "Why did it do that?" — the universal
   agent-dev question.
2. Open REPLAY: scrub the timeline to the moment. Inspect the packet — exact model input,
   the APY signals it saw, the risk checks, the tx.
3. Click verify: hash recomputed, matches the on-chain anchor on Mantle explorer. "This
   history can't be quietly edited."
4. Fork it: edit one risk parameter, deterministically re-execute the decision logic → the
   agent now declines the trade. Side-by-side diff. "Found the bug without redeploying —
   and because there's no LLM in the replay path, the fork is reproducible."
5. Quickstart: 6 lines to instrument any viem agent. Tencent console glimpse.
6. Close: "Agents that move money need a black box. REPLAY is the black box, on Mantle."

## 8. Risks

| Risk | Mitigation |
|---|---|
| Port friction (Sui types leak into core) | Day-1 task is a clean extraction: copy the 495 LOC, strip Sui imports, keep DI seams. If extraction exceeds ½ day, STOP — re-scope to reimplementing the schema only |
| Fork-replay overpromises | v1 = deterministic decision-logic re-execution ONLY. No LLM re-run, no eth_call simulation, no state forking — README's honest-limits section must say all three (R2). Caught overclaimed once already (2026-06-09 audit) |
| Public RPC lacks deep historical state | (roadmap concern only — v1 does no historical eth_call) cache all demo packets |
| Owner IP concern blocks submission | flagged §2; decision needed by Jun 14 |
| Time (3rd active build) | Cut order in TASKS.md; gaslight submission is the first thing sacrificed |

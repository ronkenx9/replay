# REPLAY — Task Plan (~3 days)

> Rules: ~/brain/skills/hackathon-execution-framework.md. Gates blocking, commit per task.

## Phase 0 — Core extraction (½ day, HARD TIMEBOX)
- [x] Copy `bound/src/blackbox/{recorder,evidence,memory-backend}.ts` → `src/core/`. Strip
      Sui/Walrus imports; keep the DI seams and Evidence Packet schema intact. Do NOT refactor
      beyond what compiles — port first, improve never (hackathon rule).
      GATE: `npm test` green with ported BOUND tests against the in-memory backend.
      TIMEBOX: if not green in ½ day, stop → reimplement schema-only from evidence.ts → note in journal.
- [x] Scaffold: meridian-pattern package.json/tsconfig, chains.ts (5003-fixed copy).
      GATE: build green.

## Phase 1 — EVM anchor (½ day)
- [x] `contracts/FlightRecorder.sol`: `anchor(bytes32 runId, uint256 seq, bytes32 packetHash)`,
      `getAnchor(runId, seq)`, event `StepAnchored`. ~60 lines, anyone-can-anchor (runId scoped
      to sender: key = keccak(msg.sender, runId)).
      GATE: contract tests; deploy Mantle Sepolia 5003; **VERIFY on explorer**; address in CLAUDE.md.
- [x] `src/backends/evm.ts`: implements the recorder's storage+anchor interface — blob to
      `data/packets/` (served by API), hash to FlightRecorder.
      GATE: record→verify roundtrip live on Sepolia: tamper the local blob → verifyStep FAILS
      (fail-closed proof, on camera later).

## Phase 2 — Capture SDK + instrument the demo clients (½ day)
- [x] `src/sdk.ts`: `createReplay({walletClient, runId})` → `.record(packet)`, `.wrap(llmCall)`.
      6-line quickstart documented as written.
      GATE: fresh script instruments a toy agent in ≤6 lines, packets anchored.
- [ ] Instrument MERIDIAN: adapt its ledger JSONL output → Evidence Packets; replay one full
      rebalance cycle (dry-run) through REPLAY.
      GATE: meridian run produces ≥4 anchored, verifiable steps (signals→risk→proposal→receipt).
- [ ] Instrument gaslight's audit logger the same way (cheap — same JSONL shape).
      GATE: one gaslight optimization recorded. (CUT-FIRST if behind.)

## Phase 3 — Time-travel viewer (1 day — the judged surface)
- [ ] Viewer (Vite+React, editorial-landing-page taste): run list → timeline scrubber →
      packet inspector (model input/output, tool calls, tx link) → per-step verify badge doing
      a LIVE hash-vs-anchor check.
      GATE: scrubbing a real MERIDIAN run feels instant (packets pre-loaded); verify badge
      flips red on a tampered fixture.
- [ ] Fork & replay: edit-prompt modal → re-run LLM call; re-simulate tx via eth_call pinned
      to the step's blockNumber → side-by-side diff view.
      GATE: the PRD §7 demo moment works end-to-end on the MERIDIAN run: changed risk param →
      visibly different decision.
- [ ] Public deploy (Tencent serverless via gaslight's script patterns; Vercel fallback).
      GATE: public URL on a phone.

## Phase 4 — MCP + Tencent polish (½ day)
- [ ] MCP server: REPLAY_RECORD / REPLAY_RECALL / REPLAY_VERIFY / REPLAY_FORK (gaslight pattern).
      GATE: Claude Code calls RECALL against a real run.
- [ ] Tencent KMS signing path for the anchor wallet (port gaslight `submitter/kms.ts`).
      GATE: one anchor tx signed via KMS path, or mock-mode honestly labeled. (CUT if behind.)

## Phase 5 — Submission hardening (½ day) — protected
- [ ] ⚠️ STOP-AND-ASK: owner decision on open-sourcing scope (PRD §2) — needed by Jun 14.
- [ ] Full ship-verification.md pass; README (quickstart at top, BOUND provenance section,
      honest-limits section on fork-replay, verified contract address, public URL).
- [ ] .env.example; fresh-clone test (in-memory backend = no wallet needed for judges).
- [ ] Demo video ≥2min per PRD §7 — the tamper-detection red badge and the fork-diff are the
      two money shots.
- [ ] DoraHacks submission (DevTool track) + deployment-award checklist line-by-line.
- [ ] Owner action: offer SDK in hackathon Discord (adoption proof during judging).

## Cut order
gaslight instrumentation → Tencent KMS path → MCP FORK action → COS blob storage.
NEVER CUT: fail-closed verify demo · fork-diff moment · contract verification · Phase 5.

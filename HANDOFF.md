# REPLAY Handoff

Last updated: 2026-06-09 20:40 Africa/Lagos.

## Current State

Phase 0 is complete and committed as the baseline port. Phase 1 is complete on Mantle Sepolia:
FlightRecorder is deployed on chain 5003, bytecode is present, and live record→verify→tamper-fail
passed. Phase 2 SDK is started: the capture SDK and toy-agent quickstart are
done against the in-memory backend. MERIDIAN adapter and smoke path are complete using a
representative decrypted dry-run payload fixture.

- `src/core/recorder.ts` — EVM-shaped BOUND blackbox recorder port.
- `src/core/evidence.ts` — Evidence Packet layer and commitment proof helpers.
- `src/backends/memory.ts` — no-wallet in-memory backend for tests and judge fresh-clone mode.
- `src/backends/evm.ts` — filesystem blob storage + FlightRecorder `anchor`/`getAnchorFor` backend.
- `src/sdk.ts` — caller-facing `createReplay(...).record`, `.wrap`, and `.recall` SDK.
- `src/adapters/meridian.ts` — converts one decrypted MERIDIAN decision log into four Evidence Packets.
- `fixtures/meridian-dry-run-decision.json` — representative MERIDIAN dry-run decision payload.
- `scripts/meridian-replay-smoke.ts` — anchors and verifies the four MERIDIAN evidence packets.
- `examples/toy-agent.ts` — six-line toy agent demo; uses memory backend until live EVM address exists.
- `src/chains.ts` — Mantle + Mantle Sepolia config; Sepolia is pinned to `5003`.
- `contracts/FlightRecorder.sol` — anchor contract with task-plan API: `anchor(runId, seq, packetHash)`, `getAnchor(runId, seq)`, `getAnchorFor(recorder, runId, seq)`.
- `test/FlightRecorder.t.sol` + `foundry.toml` — Foundry contract tests.
- `scripts/deploy-flight-recorder.sh` — deploy command with a chain-id guard; refuses non-5003 RPCs.
- `scripts/live-evm-smoke.ts` — live smoke that records one step, verifies it, tampers the blob, then verifies failure.

Verification already run:

```bash
npm test
npm run build
forge test
npm run deploy:flight-recorder
npm run smoke:evm
npm run smoke:meridian
npm run demo:toy
```

`npm test`, `npm run build`, `forge test`, `npm run demo:toy`, `npm run smoke:evm`, and `npm run smoke:meridian` passed on 2026-06-09.
`npm install` reports 5 audit findings from transitive packages; do not broad-upgrade during a gated phase unless you can rerun all tests.

## What Changed In Phase 0

- Added Vitest tests covering record/verify, blob tamper detection, anchor mismatch fail-closed behavior, claim proof, ordered recall, and Evidence Packet commitment proof.
- Added a chain safety test that proves `getAddresses(5001)` throws instead of silently falling back to mainnet.
- Implemented `src/core/evidence.ts` and fixed `getAddresses` to throw on unsupported chain ids.

## Next Task

Continue Phase 2 by instrumenting gaslight's audit logger, or move to Phase 3 viewer if cutting
gaslight. Note: MERIDIAN CLI did not emit a usable log during live dry-run attempts: one run held
early, and one forced mock fallback failed risk before logging. The REPLAY smoke therefore uses a
representative decrypted dry-run fixture with the same payload shape.

## Hard Rules To Preserve

- Never use chain id `5001` for Mantle Sepolia; correct id is `5003`.
- Never silently default unknown chain ids to mainnet.
- Verification must fail closed on tampered blobs or mismatched anchors.
- Do not claim live EVM anchoring until Phase 1 deploy + readback succeeds.
- Open-source scope for BOUND-derived code is still an owner stop-and-ask before submission.

## Useful Commands

```bash
npm install
npm test
npm run build
npm run contract:test
npm run deploy:flight-recorder
git status --short
```

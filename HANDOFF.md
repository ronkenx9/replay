# REPLAY Handoff

Last updated: 2026-06-09 20:05 Africa/Lagos.

## Current State

Phase 0 is complete and committed as the baseline port. Phase 1 local contract tests are also
passing, but Phase 1 is not complete until Mantle Sepolia deploy + explorer verification are done.

- `src/core/recorder.ts` — EVM-shaped BOUND blackbox recorder port.
- `src/core/evidence.ts` — Evidence Packet layer and commitment proof helpers.
- `src/backends/memory.ts` — no-wallet in-memory backend for tests and judge fresh-clone mode.
- `src/chains.ts` — Mantle + Mantle Sepolia config; Sepolia is pinned to `5003`.
- `contracts/FlightRecorder.sol` — anchor contract with task-plan API: `anchor(runId, seq, packetHash)`, `getAnchor(runId, seq)`, `getAnchorFor(recorder, runId, seq)`.
- `test/FlightRecorder.t.sol` + `foundry.toml` — Foundry contract tests.

Verification already run:

```bash
npm test
npm run build
forge test
```

All passed on 2026-06-09. `npm install` reports 5 audit findings from transitive packages; do not broad-upgrade during a gated phase unless you can rerun all tests.

## What Changed In Phase 0

- Added Vitest tests covering record/verify, blob tamper detection, anchor mismatch fail-closed behavior, claim proof, ordered recall, and Evidence Packet commitment proof.
- Added a chain safety test that proves `getAddresses(5001)` throws instead of silently falling back to mainnet.
- Implemented `src/core/evidence.ts` and fixed `getAddresses` to throw on unsupported chain ids.

## Next Task

Continue `TASKS.md` Phase 1, first unchecked item:

Local tests are done. Next steps:

1. Deploy `contracts/FlightRecorder.sol` to Mantle Sepolia `5003`.
2. Verify the contract on the Mantle Sepolia explorer.
3. Record the verified address in `CLAUDE.md`.
4. Add `src/backends/evm.ts` and make record→verify read back from the verified contract.
5. Run the live tamper roundtrip gate: record a packet, verify green, tamper local blob, verify red.

Do not mark Phase 1 complete until the live deploy/verify gate passes.

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
git status --short
```

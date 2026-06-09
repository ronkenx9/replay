# REPLAY Handoff

Last updated: 2026-06-09 20:00 Africa/Lagos.

## Current State

Phase 0 is complete and committed as the baseline port:

- `src/core/recorder.ts` — EVM-shaped BOUND blackbox recorder port.
- `src/core/evidence.ts` — Evidence Packet layer and commitment proof helpers.
- `src/backends/memory.ts` — no-wallet in-memory backend for tests and judge fresh-clone mode.
- `src/chains.ts` — Mantle + Mantle Sepolia config; Sepolia is pinned to `5003`.
- `contracts/FlightRecorder.sol` — draft anchor contract already present, not yet tested/deployed.

Verification already run:

```bash
npm test
npm run build
```

Both passed on 2026-06-09. `npm install` reports 5 audit findings from transitive packages; do not broad-upgrade during a gated phase unless you can rerun all tests.

## What Changed In Phase 0

- Added Vitest tests covering record/verify, blob tamper detection, anchor mismatch fail-closed behavior, claim proof, ordered recall, and Evidence Packet commitment proof.
- Added a chain safety test that proves `getAddresses(5001)` throws instead of silently falling back to mainnet.
- Implemented `src/core/evidence.ts` and fixed `getAddresses` to throw on unsupported chain ids.

## Next Task

Start `TASKS.md` Phase 1, first unchecked item:

1. Add contract test tooling for `contracts/FlightRecorder.sol`.
2. Test:
   - `anchorStep` writes one anchor.
   - `getAnchor` returns the hash and block.
   - duplicate `(sender, runId, stepIndex)` reverts.
   - another sender can use the same `runId` + `stepIndex` without collision.
3. Only after local contract tests pass, deploy to Mantle Sepolia `5003`.
4. Verify contract on explorer and record the address in `CLAUDE.md`.

Suggested lightweight path: use Foundry if available; otherwise add Hardhat. Keep the contract surface minimal and do not refactor the recorder during Phase 1.

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


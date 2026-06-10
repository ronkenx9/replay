# REPLAY — HANDOFF

> Last updated: 2026-06-10 01:40 Africa/Lagos. Written to survive chat compaction: assumes
> you have ZERO context. Read order: this file → ~/brain/skills/hackathon-execution-framework.md
> (your operating contract — gates are blocking, hard rules R1–R8 apply) → PRD.md → TASKS.md
> (first unchecked box is your work).

## What this is

Flight recorder + time-travel debugger for on-chain AI agents on Mantle. DevTool-track lead
for the Mantle Turing Test hackathon, **deadline 2026-06-15 16:59** (DoraHacks). EVM port of
BOUND's blackbox core (`../bound/src/blackbox/` — do not diverge from its semantics).
Sibling submissions: PROVENANCE (`../provenance`, flagship, AI x RWA) and RELIC (`../relic`,
consumer). GASLIGHT (`../gaslight`) is demoted: REPLAY demo client + optional secondary.

## State: DONE and PROVEN (re-verified in the 2026-06-09 audit, not just claimed)

| Item | Proof |
|---|---|
| Phases 0–2 + most of P3 (TASKS.md) | Core/backend vitest green; `npm run build` clean |
| FlightRecorder.sol live on Mantle Sepolia (5003) | `0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062` — eth_getCode non-empty; deploy tx + deployer in CLAUDE.md |
| Contract VERIFIED | Sourcify `exact_match` (creation+runtime): `curl -s https://sourcify.dev/server/v2/contract/5003/<address>` |
| Live anchors + end-to-end verify | 7 packets in `data/packets/` with real Sepolia txs; ALL verify via core `verifyStep` with on-chain anchor hash match (audit re-ran this live) |
| Demo-client adapters | `src/adapters/{meridian,gaslight}.ts` + smokes green |
| Viewer (Vite+React) | run list / timeline / packet inspector / LIVE on-chain verify badge / non-destructive tamper check (red proof state) / fork-and-diff modal |
| SDK | `createReplay({agentId, runId, backend})` → record / wrap / recall |
| MCP server | `src/mcp-server.ts` exposes `REPLAY_RECORD`, `REPLAY_RECALL`, `REPLAY_VERIFY`, `REPLAY_FORK`; SDK stdio smoke recalled a real 3-step GASLIGHT run |

## Fixes applied in the audit session (understand before touching core)

1. **Receipt schema unified.** Persisted `*.receipt.json` were slim `{anchorRef,txHash,verifyUrl}`
   and core `verifyStep` could NOT consume them after restart. Now: `Backend.saveReceipt?` hook;
   `recordStep` persists the FULL `StepReceipt`; evm backend implements it;
   `scripts/migrate-receipts.ts` upgraded the 7 existing files (idempotent, hash-checked).
   Do not reintroduce slim receipts.
2. **Fork & replay honestly reframed (R2).** The implementation is a DETERMINISTIC re-execution
   of the agent's decision logic in the viewer — there is NO LLM re-run and NO historical
   `eth_call`. PRD §3/§7/§8, TASKS P3 note, and brain were corrected. Pitch angle: "no LLM in
   the replay path = forks are reproducible." NEVER claim model re-run / eth_call / state
   forking in README, video, or submission. Building those later = new task, new gate.
3. **Viewer test made hermetic.** It was silently fetching a LIVE local API on :4174 (a leftover
   server made results environment-dependent). Now stubs `fetch`, async matchers, assertions
   match current App copy ("Packet Verified", "Live Verify"). If viewer copy changes, update
   `src/viewer/App.test.tsx` deliberately — never loosen it back to environment-dependent.
4. **MCP local actions added.** `src/mcp-actions.ts` is the pure local artifact layer; keep it
   testable independently from the stdio server. `REPLAY_RECORD` currently lists recorded runs;
   new step capture remains SDK/runtime work, not MCP-side magic.

## What REMAINS (TASKS.md is authoritative — work top to bottom)

1. **P3 final box — public deploy.** Viewer + API to a public URL. Tencent serverless first
   (port patterns from `../gaslight/{deploy.tencent.sh,serverless.yml}`); Vercel fallback for
   the static viewer. GATE: public URL loads on a phone. Record URL in CLAUDE.md.
   Viewer API base is now configurable with `VITE_REPLAY_API_BASE_URL` at build time.
   Local dev defaults to `http://localhost:4174`; deployed frontends must set this to the
   public API origin or they will fall back to static mock runs.
2. **P5 — submission hardening. PROTECTED, never cut.**
   - ship-verification.md full pass (~/brain/skills/).
   - README: quickstart at top → BOUND provenance section → **honest-limits section (no LLM
     re-run, no eth_call, no state forking; blob storage is tamper-EVIDENT not tamper-proof)**
     → verified contract address → public URL.
   - `.env.example`; fresh-clone test (memory backend = judges need no wallet).
   - Demo video ≥2min — money shots: tamper check flipping red + fork-diff changing the decision.
   - DoraHacks submission + Deployment-Award checklist line-by-line (testnet OK; contract
     verification already ✅).

## Cut order (behind schedule → top down; never invent cuts)
COS blob storage.
NEVER CUT: fail-closed verify demo · fork-diff moment · contract verification · P5 hardening.

## OWNER DECISIONS PENDING (stop-and-ask — do not improvise)
- ⚠️ **By Jun 14: open-source scope of BOUND core.** Submission requires a public repo; this
  publishes a port of BOUND's recorder/evidence engine (the owner's separate startup thesis).
  Prepare everything; the publish/submit click is the owner's.
- Demo-video voiceover, Discord SDK offer, X posts, DoraHacks final click: owner-only.
- Anchor wallet key: env var only, never committed. Deployer so far:
  `0x5a1b8F72e3D280eAEdC28aDb5909d3358e9a5B4C` (testnet). New funding/keys → ask owner.

## Verification & execution commands

```bash
npm run build && npm test        # tsc clean; 30/30 expected
npm run smoke:meridian           # anchors a fresh MERIDIAN run live on Sepolia (.env key + gas)
npm run smoke:gaslight           # same for gaslight; both use unique run ids (write-once anchors)
REPLAY_SIGNER_MODE=tencent-kms npm run smoke:evm
                                  # KMS path; uses live Tencent creds when present, otherwise prints
                                  # signerMode=tencent-kms-mock with an ephemeral local mock signer
npm run mcp                      # stdio MCP server with REPLAY_* tools
npm run dev                      # API server :4174 (runs list + /api/verify)
npm run dev:web                  # Vite viewer on :5173
npm run contract:test            # Foundry tests for FlightRecorder.sol
```
Live end-to-end check of persisted artifacts (no wallet needed): for each
`data/packets/*.receipt.json`, core `verifyStep` (with `createEvmBackend` + public client)
must return `verified:true` WITH `onChainHash` present. The audit ran exactly this — keep it
as the regression ritual after any core/backend change.

## Key facts (verified; re-verify if anything smells off — R1)
- Mantle Sepolia chain id **5003** (NOT 5001 — that bug shipped once; see ~/brain/mistakes/log.md).
  RPC `https://rpc.sepolia.mantle.xyz` · explorer `https://explorer.sepolia.mantle.xyz`.
- FlightRecorder anchors are **write-once per (sender, runId, seq)** — reruns need fresh runIds
  (smokes already generate unique session ids for this).
- Anchor wallet selection lives in `src/signing/anchor-wallet.ts`. Default mode is private key.
  `REPLAY_SIGNER_MODE=tencent-kms` selects `src/signing/tencent-kms.ts`; live mode requires
  `TENCENT_KMS_KEY_ID`, `TENCENT_SECRET_ID`, `TENCENT_SECRET_KEY`, and `TENCENT_KMS_ADDRESS`.
  Missing KMS creds are deliberately labeled `signerMode=tencent-kms-mock` in smoke output.
- `data/packets/` is **gitignored** — demo packets do NOT travel with the repo. Before
  submission: commit a curated demo run to `fixtures/` or un-ignore a `data/packets-demo/`
  dir (R6: the demo must work from snapshot).
- Codebase map: core `src/core/{recorder,evidence}.ts` · backends `src/backends/{memory,evm}.ts`
  · SDK `src/sdk.ts` · adapters `src/adapters/` · API `src/server.ts` + `src/server-verifier.ts`
  · MCP `src/mcp-actions.ts` + `src/mcp-server.ts` · viewer `src/viewer/` (`viewer-data.ts` = static fallback runs) · contract
  `contracts/FlightRecorder.sol` + `test/FlightRecorder.t.sol` · CLI `src/cli.ts`.

## Session ritual (from the framework — non-negotiable)
`git log --oneline -5` + `git status` first · first unchecked TASKS.md box is your work ·
gate passes BEFORE checkbox · commit per task (`P<phase>.<n>: …`) · end of session: update
~/brain/projects/REPLAY.md (2–3 sentences) + one journal line · stop-and-ask triggers above.

# REPLAY Handoff

Last updated: 2026-06-09 21:02 Africa/Lagos.

## Current State

REPLAY is the flight recorder + time-travel debugger for on-chain AI agents.
We have successfully completed **Phase 0, Phase 1, Phase 2, and Phase 3**!

- **Phase 0 (Core Extraction)**: Complete. EVM BOUND blackbox recorder port compiles and all vitest unit tests are green.
- **Phase 1 (EVM Anchor)**: Complete. `FlightRecorder.sol` is deployed on Mantle Sepolia (chain `5003`) at `0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062` and verified on Sourcify. Live record→verify→tamper smoke tests pass.
- **Phase 2 (Capture SDK & Client Instrumentation)**: Complete.
  - SDK allows recording, wrapping, and recalling.
  - Developed Meridian and Gaslight adapters to convert their decision logs into Evidence Packets.
  - Modified smoke tests to use unique session IDs per run to prevent contract `AlreadyAnchored` reverts.
- **Phase 3 (Time-Travel Viewer)**: Complete!
  - Added a backend API server (`src/server.ts` & `src/cli.ts`) that listens on port `4174`. It scans `data/packets` for dynamic run packets and local `.receipt.json` files.
  - Modified `evm.ts` to automatically save `.receipt.json` next to packet JSON blobs during anchoring.
  - Updated React `App.tsx` and `viewer-data.ts` to fetch runs dynamically from the local API (`/api/runs`) with a robust offline fallback to static mock runs if the server is down.
  - Integrated a **Live On-Chain Verify** check that queries `/api/verify` to confirm that the local packet blob hash matches the anchor hash stored in `FlightRecorder.sol`.
  - Added an interactive **Fork & Replay** modal. Developers can edit parameters (e.g. idle wallet balances, venue APYs, and minimum reserve floor limits for MERIDIAN; original estimates and MEV risk scores for GASLIGHT) and see a gorgeous side-by-side simulation comparison of the original vs new decisions.

---

## Codebase Map

- [src/core/recorder.ts](file:///Users/gadgetplug/Documents/vibecoding/replay/src/core/recorder.ts) — BOUND blackbox recorder core.
- [src/core/evidence.ts](file:///Users/gadgetplug/Documents/vibecoding/replay/src/core/evidence.ts) — Evidence Packet commitments and verification.
- [src/backends/evm.ts](file:///Users/gadgetplug/Documents/vibecoding/replay/src/backends/evm.ts) — Filesystem packet storage + `FlightRecorder.sol` anchor backend. Saves `.receipt.json` metadata on anchor.
- [src/sdk.ts](file:///Users/gadgetplug/Documents/vibecoding/replay/src/sdk.ts) — SDK for instrumenting agents.
- [src/server.ts](file:///Users/gadgetplug/Documents/vibecoding/replay/src/server.ts) — HTTP API server on port `4174` (runs list, verify endpoint).
- [src/cli.ts](file:///Users/gadgetplug/Documents/vibecoding/replay/src/cli.ts) — Backend entrypoint.
- [src/viewer/App.tsx](file:///Users/gadgetplug/Documents/vibecoding/replay/src/viewer/App.tsx) — Main frontend application with dynamic loading, verify checks, and simulation fork.
- [src/viewer-data.ts](file:///Users/gadgetplug/Documents/vibecoding/replay/src/viewer-data.ts) — Type definitions and static fallback mock runs.

---

## Verification & Execution Commands

### 1. Build and Run Unit Tests
```bash
npm run build
npm test
```
*Expected output: TypeScript compilation completes with no errors; all 15 Vitest tests pass.*

### 2. Run Smoke Tests
Generates live transactions and writes dynamic packets & receipts to `data/packets/`:
```bash
npm run smoke:meridian
npm run smoke:gaslight
```
*Expected output: Logs the generated unique cycle IDs, packet counts, and verified transaction explorer URLs on Mantle Sepolia.*

### 3. Start Backend API Server
```bash
npm run dev
```
*Expected output: `[REPLAY API] Server listening on port 4174`*

### 4. Start Vite React Frontend
```bash
npm run dev:web
```
*Expected output: Serves the Web UI on `http://127.0.0.1:5173/` (or default port).*

---

## Tasks for the Next Agent

Please proceed with **Phase 4 (MCP & Tencent Polish)**:
1. **MCP Server**: Implement the MCP server in `src/mcp-server.ts` or add actions to `cli.ts` (e.g. `REPLAY_RECORD`, `REPLAY_RECALL`, `REPLAY_VERIFY`, `REPLAY_FORK`).
2. **Tencent KMS Signing**: Port the KMS wallet signing logic from `gaslight/submitter/kms.ts` into `replay` for the anchor wallet, with an option to fallback to private keys.
3. **Public Deployment**: Deploy the API server + React build via Tencent serverless or standard static hosting (e.g. Vercel for frontend).

*Note: The owner's open-source scope decision for BOUND IP is due on June 14 before final submission.*

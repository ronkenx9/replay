# REPLAY — devtool lead, Mantle Turing Test (Tencent track)

Flight recorder + time-travel debugger for on-chain AI agents. EVM port of BOUND's black-box
core (../bound/src/blackbox/ — 495 LOC, dependency-injected, DO NOT rewrite, port).

## Read order (mandatory)
1. ~/brain/skills/hackathon-execution-framework.md — operating contract
2. PRD.md  3. TASKS.md (first unchecked box)  4. ~/brain/projects/REPLAY.md

## Verified facts
- Mantle Sepolia = 5003 (NOT 5001). Source core: ../bound/src/blackbox/{recorder,evidence,memory-backend}.ts
- Demo clients: ../meridian (decision JSONL ≈ Evidence Packets), ../gaslight (audit log)
- Tencent integration IN-REPO: src/signing/tencent-kms.ts (AsymmetricSign, live KMS) ·
  serverless.yml (SCF web fn, serves fixtures/demo-packets) · scripts/derive-kms-address.ts.
  Owner creds needed for live mode: TENCENT_SECRET_ID/KEY, TENCENT_KMS_KEY_ID(+REGION), then
  `npm run kms:derive-address` -> TENCENT_KMS_ADDRESS -> fund with Sepolia MNT
- ⚠️ Open-source scope = OWNER DECISION before submission (BOUND IP) — stop-and-ask, due Jun 14

## Deployed addresses
- FlightRecorder.sol (Mantle Sepolia 5003): `0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062`
  - Deploy tx: `0xd7cfa4fdf53a8ebd450c4a5596331c66ba6e5ae3e4142974b4ff45d248b206b9`
  - Deployer: `0x5a1b8F72e3D280eAEdC28aDb5909d3358e9a5B4C`
  - Bytecode check: `cast code ...` returned non-empty bytecode on chain `5003`
  - Source verification: Sourcify `exact_match`
- Viewer URL: pending

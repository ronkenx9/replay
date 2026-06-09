# REPLAY — devtool lead, Mantle Turing Test (Tencent track)

Flight recorder + time-travel debugger for on-chain AI agents. EVM port of BOUND's black-box
core (../bound/src/blackbox/ — 495 LOC, dependency-injected, DO NOT rewrite, port).

## Read order (mandatory)
1. ~/brain/skills/hackathon-execution-framework.md — operating contract
2. PRD.md  3. TASKS.md (first unchecked box)  4. ~/brain/projects/REPLAY.md

## Verified facts
- Mantle Sepolia = 5003 (NOT 5001). Source core: ../bound/src/blackbox/{recorder,evidence,memory-backend}.ts
- Demo clients: ../meridian (decision JSONL ≈ Evidence Packets), ../gaslight (audit log)
- Tencent assets to port: ../gaslight/{submitter/kms.ts,deploy.tencent.sh,serverless.yml}
- ⚠️ Open-source scope = OWNER DECISION before submission (BOUND IP) — stop-and-ask, due Jun 14

## Deployed addresses
(record here — FlightRecorder.sol, viewer URL)

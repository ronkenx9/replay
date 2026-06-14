# REPLAY — Submission Package

> Owner actions: record video → upload → post X thread → done.
> Deadline: **2026-06-15 15:59** (DoraHacks lists 15:59 — treat as binding).

## Submission format

X post with: pitch, demo video, GitHub link, Mantle contract address, **#MantleAIHackathon**.
Track: **AI DevTools** (Tencent Cloud).

## Asset checklist

| Asset | Status |
|---|---|
| GitHub repo | ✅ https://github.com/ronkenx9/replay |
| Contract (Mantle Sepolia 5003) | ✅ `0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062` — Sourcify exact_match |
| Live viewer | ✅ https://ronkenx9.github.io/replay/ |
| README + .env.example | ✅ |
| Demo video | ⬜ owner records (`demo-video.html` is a screen-recordable timed storyboard) |
| X thread | ⬜ owner posts (draft below) |
| DoraHacks BUIDL | ⬜ owner registers |

## Demo video script (~2:30)

Open `demo-video.html` in a browser and screen-record the 16:9 timed storyboard. It uses the
existing landing assets and includes captions for each beat. Controls are in the lower right
for pause, previous, and next scene.

**Setup:** public viewer open · explorer tab on FlightRecorder · terminal ready.

**[0:00–0:20] Problem.**
> "Your AI agent moved funds at 3am and you have no idea why. Logs can be edited. REPLAY is
> the flight recorder for on-chain agents: every decision becomes a hash-anchored evidence
> packet on Mantle — record, replay, verify."

**[0:20–0:50] The timeline.**
Open viewer → pick the MERIDIAN run.
> "This is a real agent run. Every step — signals, the risk decision, the action — captured
> as an evidence packet, content-hashed, anchored on Mantle Sepolia. Click any step: tool
> calls, memory snapshot, the anchor transaction."

**[0:50–1:20] Live verify. (money shot #1)**
Click Live Verify.
> "The browser recomputes the packet's sha256 and reads the anchor straight from Mantle RPC —
> no REPLAY server in the loop. The proof doesn't need us."

**[1:20–1:50] Tamper check. (money shot #2)**
Click Run tamper check → red.
> "Now tamper with the packet — one appended byte. Local hash changes, the on-chain anchor
> doesn't. Red. That's the property: logs can lie, anchors can't."

**[1:50–2:15] Fork & replay. (money shot #3)**
Open fork modal, raise risk threshold → decision flips to DECLINED.
> "Time travel: change the recorded inputs and re-run the agent's decision logic — original
> versus fork. No LLM in the replay path, which is exactly why it's reproducible."

**[2:15–2:30] Close.**
> "SDK, MCP tools for agent-native access, Tencent Cloud KMS signing, verified contract on
> Mantle. REPLAY — the black box your agent should have been wearing. "

## X thread draft

**Tweet 1:**
> Your AI agent did something weird on-chain at 3am. Prove what happened.
>
> REPLAY — flight recorder + time-travel debugger for on-chain agents on @0xMantle.
> Record → anchor → replay → verify.
>
> 🎥 [video]
> ⚙️ https://github.com/ronkenx9/replay
> 📜 0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062 (Mantle Sepolia)
> #MantleAIHackathon

**Tweet 2:**
> Every agent step → canonical evidence packet → sha256 anchored in FlightRecorder.sol
> (write-once per step).
>
> The viewer live-verifies packets IN THE BROWSER against Mantle RPC. Tamper with one byte
> and the proof flips red. Logs can lie. Anchors can't.

**Tweet 3:**
> Time-travel debugging: fork any recorded decision, change its inputs, watch the decision
> split. Deterministic re-execution — no LLM in the replay path, so forks are reproducible.
>
> Try it (no wallet needed): https://ronkenx9.github.io/replay/

## DoraHacks BUIDL fields

- **Name:** REPLAY
- **Tagline:** Flight recorder + time-travel debugger for on-chain AI agents — every decision hash-anchored on Mantle.
- **Track:** AI DevTools
- **GitHub:** https://github.com/ronkenx9/replay
- **Demo:** https://ronkenx9.github.io/replay/
- **Contract:** 0x4d46d3669Ee5EF3298C6E1FD0f92fdd60cc1d062 (Mantle Sepolia 5003, Sourcify exact_match)
- **Tencent angle (say it):** KMS AsymmetricSign signer mode + SCF serverless function in-repo.

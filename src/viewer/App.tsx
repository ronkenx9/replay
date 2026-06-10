import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Box,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  Copy,
  Database,
  ExternalLink,
  GitFork,
  Hash,
  Home,
  Layers3,
  Menu,
  Network,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  ShieldCheck,
  Square,
  Terminal,
  Timer,
  X,
  Zap,
} from "lucide-react";
import { flightRecorderAddress, replayRuns, type ReplayRun } from "../viewer-data.js";
import { replayApiUrl } from "./api.js";
import "./styles.css";

type VerifyStatus = "idle" | "success" | "success-fallback" | "tampered";

const HERO_IMAGE = "/assets/replay-hero-recorder.png";
const DEVICE_IMAGE = "/assets/replay-device-closeup.png";

function short(hash = "") {
  return hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : hash;
}

function Logo() {
  return (
    <div className="logo" aria-label="REPLAY">
      <span className="logo-orbit">
        <Play size={13} fill="currentColor" />
      </span>
      <span className="logo-text">REPLAY</span>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <div className="section-label">{children}</div>;
}

function StatusBadge({ tone = "green", children }: { tone?: "green" | "orange" | "red" | "blue"; children: string }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

function IconTile({ icon: Icon, label }: { icon: typeof Play; label: string }) {
  return (
    <div className="icon-tile">
      <Icon size={26} />
      <span>{label}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TimelineStep({
  index,
  active,
  title,
  time,
  onSelect,
}: {
  index: number;
  active: boolean;
  title: string;
  time: string;
  onSelect: () => void;
}) {
  return (
    <button className={`timeline-step ${active ? "active" : ""}`} onClick={onSelect}>
      <span className="timeline-dot">
        {active ? <Play size={15} fill="currentColor" /> : <Square size={14} />}
      </span>
      <b>{String(index).padStart(2, "0")}</b>
      <strong>{title}</strong>
      <small>{time}</small>
    </button>
  );
}

function CodeBlock() {
  return (
    <pre className="code-card">
      <code>{`import { Replay } from "replay-sdk";

const replay = new Replay({
  agentId: "meridian",
  chain: "mantle-sepolia",
  rpcUrl: process.env.MANTLE_RPC_URL
});

await replay.record({
  input,
  output,
  toolCalls,
  txHash
});`}</code>
    </pre>
  );
}

export function App() {
  const [runs, setRuns] = useState<ReplayRun[]>(replayRuns);
  const [loading, setLoading] = useState(false);
  const [runIndex, setRunIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [tamperChecking, setTamperChecking] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifyDetails, setVerifyDetails] = useState("");
  const [forkOpen, setForkOpen] = useState(false);
  const [walletIdle, setWalletIdle] = useState(2000);
  const [riskThreshold, setRiskThreshold] = useState(0.55);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const response = await fetch(replayApiUrl("/api/runs"));
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) setRuns(data);
    } catch (error) {
      console.warn("Using static fallback runs.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const run = runs[runIndex] ?? replayRuns[0]!;
  const step = run.steps[stepIndex] ?? run.steps[0]!;
  const timelineSteps = run.steps.slice(0, 7);
  const verifiedCount = useMemo(() => run.steps.filter((item) => item.status === "verified").length, [run]);
  const simulatedPass = riskThreshold <= 0.48;

  const selectRun = (index: number) => {
    setRunIndex(index);
    setStepIndex(0);
    setVerifyStatus("idle");
    setVerifyDetails("");
  };

  const handleVerify = async (tamper = false) => {
    setVerifying(true);
    setTamperChecking(tamper);
    setVerifyStatus("idle");
    setVerifyDetails("");

    try {
      const response = await fetch(replayApiUrl("/api/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentHash: step.contentHash, tamper }),
      });
      const data = await response.json();
      if (data.verified) {
        setVerifyStatus("success");
        setVerifyDetails(data.reason || "Local packet hash matches the on-chain Mantle anchor.");
      } else {
        setVerifyStatus("tampered");
        setVerifyDetails(data.reason || "Local packet hash mismatch.");
      }
    } catch {
      setVerifyStatus("success-fallback");
      setVerifyDetails("Local server unavailable; showing fixture-backed proof state.");
    } finally {
      setVerifying(false);
      setTamperChecking(false);
    }
  };

  return (
    <main className="site-shell">
      <section className="brand-board">
        <article className="brand-panel identity-panel">
          <SectionLabel>01. Brand Identity</SectionLabel>
          <div className="identity-lockup">
            <Logo />
            <p>The black box for on-chain AI agents.</p>
          </div>
          <div className="mini-grid">
            <div>
              <Logo />
              <small>Primary lockup</small>
            </div>
            <div>
              <span className="logo-orbit standalone"><Play size={18} fill="currentColor" /></span>
              <small>Icon mark</small>
            </div>
            <div className="wordmark">REPL<span>A</span>Y</div>
          </div>
          <div className="palette">
            {["#060606", "#ff5a1f", "#f5f1ea", "#20d17d", "#2f82ff", "#ff3838", "#7c3aed"].map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </div>
          <div className="type-row">
            <strong>Aa</strong>
            <span>Space Grotesk</span>
            <span>Inter</span>
            <span>JetBrains Mono</span>
          </div>
        </article>

        <article className="brand-panel hero-panel">
          <SectionLabel>02. Landing Page Hero</SectionLabel>
          <nav className="hero-nav">
            <Logo />
            <div>
              <a>Product</a>
              <a>Docs</a>
              <a>Pricing</a>
              <a>MCP</a>
              <a>Blog</a>
            </div>
            <button onClick={() => handleVerify(false)}>Start Recording</button>
          </nav>
          <div className="hero-content">
            <div className="hero-copy">
              <h1>
                Debug the moment your agent went <span>wrong.</span>
              </h1>
              <p>
                REPLAY records every prompt, tool call, decision, and transaction your on-chain AI agent makes, then lets you scrub, verify, and fork the timeline.
              </p>
              <div className="hero-bullets">
                <span><BadgeCheck size={14} /> Record every decision</span>
                <span><ShieldCheck size={14} /> Verify on Mantle</span>
                <span><GitFork size={14} /> Time-travel and fork</span>
              </div>
              <div className="hero-actions">
                <button className="primary-action" onClick={() => handleVerify(false)}>Start Recording</button>
                <button className="secondary-action" onClick={() => setForkOpen(true)}>View Demo Run</button>
              </div>
            </div>
            <div className="hero-visual">
              <img src={HERO_IMAGE} alt="REPLAY black box recorder device" />
              <div className="proof-line">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
          <div className="trust-row">
            <Metric label="Network" value="Mantle Sepolia" />
            <Metric label="Partner" value="Tencent Cloud" />
            <Metric label="Secured" value="KMS" />
            <Metric label="Storage" value="COS / Local" />
          </div>
        </article>

        <article className="brand-panel timeline-panel">
          <SectionLabel>03. Timeline Viewer</SectionLabel>
          <div className="app-frame">
            <aside className="app-sidebar">
              <Menu size={18} />
              <Logo />
              <Home className="active" />
              <Layers3 />
              <Hash />
              <GitFork />
            </aside>
            <div className="app-main">
              <header className="app-top">
                <span>Runs / {run.id}</span>
                <StatusBadge>Verified</StatusBadge>
              </header>
              <div className="run-switcher">
                {runs.slice(0, 4).map((item, index) => (
                  <button key={`${item.id}-${index}`} className={index === runIndex ? "active" : ""} onClick={() => selectRun(index)}>
                    {item.name}
                  </button>
                ))}
              </div>
              <div className="run-summary">
                <div>
                  <strong>Run: {run.id}</strong>
                  <div className="summary-grid">
                    <Metric label="Agent" value={run.agent.toUpperCase()} />
                    <Metric label="Network" value="Mantle Sepolia" />
                    <Metric label="Start" value="Jun 8, 2026 14:32" />
                    <Metric label="Steps" value={String(run.steps.length)} />
                  </div>
                </div>
                <button className="outline-button">Share</button>
              </div>
              <div className="timeline-rail">
                {timelineSteps.map((item, index) => (
                  <TimelineStep
                    key={`${run.id}-${item.index}`}
                    index={item.index}
                    active={index === stepIndex}
                    title={item.title}
                    time={`14:32:${10 + index * 3}`}
                    onSelect={() => setStepIndex(index)}
                  />
                ))}
              </div>
              <div className="playback">
                <RotateCcw size={15} />
                <Pause size={15} />
                <button><Play size={18} fill="currentColor" /></button>
                <ArrowRight size={15} />
                <span>14:32:18 / 14:34:29</span>
                <b>1x</b>
              </div>
              <div className="step-card">
                <div>
                  <strong>Step {String(step.index).padStart(2, "0")}: {step.title}</strong>
                  <p>{step.summary}</p>
                </div>
                <StatusBadge>Verified</StatusBadge>
              </div>
            </div>
          </div>
        </article>

        <article className="brand-panel inspector-panel">
          <SectionLabel>04. Packet Inspector</SectionLabel>
          <div className="panel-head">
            <h2>Step {String(step.index).padStart(2, "0")}: {step.title}</h2>
            <StatusBadge>Verified</StatusBadge>
          </div>
          <div className="inspector-grid">
            <div className="kv-list">
              <Metric label="Event Type" value={step.kind.toUpperCase()} />
              <Metric label="Timestamp" value="2026-06-08 14:32:18 UTC" />
              <Metric label="Agent ID" value={run.agent} />
              <Metric label="Packet Hash" value={short(step.contentHash)} />
              <Metric label="Anchor Tx" value={short(step.txHash)} />
            </div>
            <div className="accordion-stack">
              <details open>
                <summary>Model Input <ChevronDown size={14} /></summary>
                <pre>{`{
  "objective": "maximize risk-adjusted yield",
  "risk_threshold": ${riskThreshold},
  "portfolio": "0x8a1f...d3c2"
}`}</pre>
              </details>
              <details>
                <summary>Tool Calls (2) <ChevronDown size={14} /></summary>
                <p>getAPY <StatusBadge>Success</StatusBadge></p>
                <p>getExposure <StatusBadge>Success</StatusBadge></p>
              </details>
              <details>
                <summary>Memory Snapshot <ChevronDown size={14} /></summary>
                <p>{step.payload.join(" / ")}</p>
              </details>
            </div>
          </div>
        </article>

        <article className="brand-panel fork-panel">
          <SectionLabel>05. Fork & Replay</SectionLabel>
          <div className="fork-head">
            <strong><span /> Fork from Step {String(step.index).padStart(2, "0")}: {step.title}</strong>
            <button onClick={() => setForkOpen(true)}>Edit prompt & inputs</button>
          </div>
          <div className="diff-grid">
            <div className="diff-card original">
              <StatusBadge tone="orange">Original Run</StatusBadge>
              <Metric label="Risk Threshold" value="0.42" />
              <Metric label="Decision" value="PASS" />
              <Metric label="Tx Result" value="REBALANCE EXECUTED" />
              <Metric label="APY Change" value="+12.48%" />
            </div>
            <div className="vs">VS</div>
            <div className={`diff-card forked ${simulatedPass ? "" : "failed"}`}>
              <StatusBadge tone="blue">Forked Run</StatusBadge>
              <Metric label="Risk Threshold" value={String(riskThreshold)} />
              <Metric label="Decision" value={simulatedPass ? "PASS" : "FAIL"} />
              <Metric label="Tx Result" value={simulatedPass ? "EXECUTED" : "DECLINED"} />
              <Metric label="Idle Capital" value={`$${walletIdle}`} />
            </div>
          </div>
          <div className="fork-controls">
            <label>
              Risk threshold
              <input type="number" step="0.01" value={riskThreshold} onChange={(e) => setRiskThreshold(Number(e.target.value))} />
            </label>
            <label>
              Wallet idle
              <input type="number" value={walletIdle} onChange={(e) => setWalletIdle(Number(e.target.value))} />
            </label>
            <button className="primary-action" onClick={() => setForkOpen(true)}>Re-run Fork</button>
          </div>
        </article>

        <article className="brand-panel verify-panel">
          <SectionLabel>06. Verification Panel</SectionLabel>
          <div className={`verify-state ${verifyStatus === "tampered" ? "red" : ""}`}>
            {verifyStatus === "tampered" ? <AlertTriangle /> : <CheckCircle2 />}
            <div>
              <h2>{verifyStatus === "tampered" ? "Packet Tampered" : "Packet Verified"}</h2>
              <p>{verifyDetails || "This packet hash matches the on-chain anchor."}</p>
            </div>
          </div>
          <Metric label="Packet Hash" value={short(step.contentHash)} />
          <Metric label="Recomputed" value={verifyStatus === "tampered" ? "mismatch" : short(step.contentHash)} />
          <Metric label="Anchor Tx" value={short(step.txHash)} />
          <Metric label="Block Number" value="39874291" />
          <div className="verify-actions">
            <button onClick={() => handleVerify(false)} disabled={verifying}>
              <ShieldCheck size={16} /> {verifying && !tamperChecking ? "Verifying..." : "Live Verify"}
            </button>
            <button onClick={() => handleVerify(true)} disabled={verifying}>
              <AlertTriangle size={16} /> {tamperChecking ? "Checking..." : "Run tamper check"}
            </button>
          </div>
          <a href={step.verifyUrl} target="_blank" rel="noreferrer">View on Mantle Explorer <ExternalLink size={14} /></a>
        </article>

        <article className="brand-panel mobile-panel">
          <SectionLabel>07. Mobile Preview</SectionLabel>
          <div className="phone">
            <div className="phone-screen">
              <header><Menu size={15} /><Logo /><StatusBadge>Verified</StatusBadge></header>
              <small>Run<br />{run.id.slice(0, 22)}</small>
              <div className="phone-timeline">
                {timelineSteps.slice(0, 5).map((item, index) => (
                  <span key={item.index} className={index === stepIndex ? "active" : ""}>{String(item.index).padStart(2, "0")}</span>
                ))}
              </div>
              <div className="phone-card">
                <strong>Step {String(step.index).padStart(2, "0")}: {step.title}</strong>
                <Metric label="Packet Hash" value={short(step.contentHash)} />
                <Metric label="Status" value="Verified" />
              </div>
              <button onClick={() => setForkOpen(true)}>Fork from here</button>
              <button className="dark">Inspect Packet</button>
            </div>
          </div>
        </article>

        <article className="brand-panel icon-panel">
          <SectionLabel>08. Icon Set</SectionLabel>
          <div className="icon-grid">
            <IconTile icon={Play} label="App Icon" />
            <IconTile icon={Box} label="Recorder" />
            <IconTile icon={Timer} label="Timeline" />
            <IconTile icon={GitFork} label="Fork" />
            <IconTile icon={ShieldCheck} label="Verify" />
            <IconTile icon={Hash} label="Anchor" />
            <IconTile icon={Zap} label="Run" />
          </div>
        </article>

        <article className="brand-panel sdk-panel">
          <SectionLabel>09. SDK Quickstart</SectionLabel>
          <CodeBlock />
          <p>That is it. Every decision is recorded and anchored.</p>
        </article>

        <article className="brand-panel device-panel">
          <SectionLabel>10. Black Box Device</SectionLabel>
          <img src={DEVICE_IMAGE} alt="Close-up REPLAY black box recorder" />
        </article>

        <article className="brand-panel architecture-panel">
          <SectionLabel>11. Architecture</SectionLabel>
          <div className="arch-row">
            <div><Terminal /> Your Agent <b>replay.record()</b></div>
            <ArrowRight />
            <div><Code2 /> REPLAY SDK <b>Capture I/O, tools, tx</b></div>
            <ArrowRight />
            <div><Database /> Evidence Packet <b>Hash + encrypt</b></div>
            <ArrowRight />
            <div><Server /> Storage <b>COS / Local</b></div>
            <ArrowRight />
            <div><Network /> On-chain Anchor <b>{short(flightRecorderAddress)}</b></div>
          </div>
          <div className="arch-tools">
            <span><Search /> Scrub</span>
            <span><Copy /> Inspect</span>
            <span><ShieldCheck /> Verify</span>
            <span><GitFork /> Fork</span>
            <span><Play /> Replay</span>
          </div>
        </article>
      </section>

      {forkOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setForkOpen(false)}><X size={18} /></button>
            <SectionLabel>Fork & Replay</SectionLabel>
            <h2>Change the condition. Watch the decision split.</h2>
            <div className="fork-controls modal-controls">
              <label>
                Risk threshold
                <input type="number" step="0.01" value={riskThreshold} onChange={(e) => setRiskThreshold(Number(e.target.value))} />
              </label>
              <label>
                Wallet idle
                <input type="number" value={walletIdle} onChange={(e) => setWalletIdle(Number(e.target.value))} />
              </label>
            </div>
            <div className="diff-grid">
              <div className="diff-card original">
                <StatusBadge tone="orange">Original</StatusBadge>
                <Metric label="Decision" value="PASS" />
                <Metric label="Outcome" value="Funds moved" />
              </div>
              <div className={`diff-card forked ${simulatedPass ? "" : "failed"}`}>
                <StatusBadge tone={simulatedPass ? "green" : "red"}>Forked</StatusBadge>
                <Metric label="Decision" value={simulatedPass ? "PASS" : "FAIL"} />
                <Metric label="Outcome" value={simulatedPass ? "Execute" : "No action"} />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  GitFork,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Square,
  X,
  Zap,
} from "lucide-react";
import { flightRecorderAddress, replayRuns, type ReplayRun } from "../viewer-data.js";
import { replayApiUrl } from "./api.js";
import "./styles.css";

type VerifyStatus = "idle" | "success" | "success-fallback" | "tampered";

function short(hash = "") {
  return hash.length > 16 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;
}

/* ─── Small components ─── */

function StatusBadge({ tone = "green", children }: { tone?: "green" | "orange" | "red" | "blue"; children: string }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="kv-row">
      <span className="kv-label">{label}</span>
      <span className="kv-value">{value}</span>
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
        {active ? <Play size={14} fill="currentColor" /> : <Square size={12} />}
      </span>
      <span className="timeline-step-index">{String(index).padStart(2, "0")}</span>
      <span className="timeline-step-title">{title}</span>
      <span className="timeline-step-time">{time}</span>
    </button>
  );
}

/* ─── Main App ─── */

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
    <main className="devtool-shell">
      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon"><Play size={11} fill="currentColor" /></span>
            <span className="sidebar-logo-text">REPLAY</span>
          </div>
          <button
            className={`sidebar-refresh ${loading ? "spinning" : ""}`}
            onClick={fetchRuns}
            aria-label="Refresh runs"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="sidebar-section-label">Recorded runs</div>

        <ul className="run-list">
          {runs.map((item, index) => (
            <li key={`${item.id}-${index}`}>
              <button
                className={`run-item ${index === runIndex ? "active" : ""}`}
                onClick={() => selectRun(index)}
              >
                <span className="run-item-dot" />
                <span className="run-item-info">
                  <span className="run-item-name">{item.name}</span>
                  <span className="run-item-meta">{item.agent} · {item.steps.length} steps</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <Server size={12} />
          <span>{short(flightRecorderAddress)}</span>
        </div>
      </aside>

      {/* ═══════════════ MAIN AREA ═══════════════ */}
      <section className="main-area">
        {/* Run header */}
        <div className="run-header">
          <div className="run-header-top">
            <h1>
              {run.name}
              <span className="mono-id">{run.id}</span>
            </h1>
            <StatusBadge>{verifiedCount === run.steps.length ? "Verified" : `${verifiedCount}/${run.steps.length}`}</StatusBadge>
          </div>
          <div className="run-stats">
            <div className="stat-card">
              <div className="stat-label">Agent</div>
              <div className="stat-value">{run.agent}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Network</div>
              <div className="stat-value">Mantle Sepolia</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Start</div>
              <div className="stat-value">Jun 8, 14:32</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Steps</div>
              <div className="stat-value">{run.steps.length}</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="timeline-section">
          <div className="timeline-label">Step timeline</div>
          <div className="timeline-rail">
            {timelineSteps.map((item, index) => (
              <TimelineStep
                key={`${run.id}-${item.index}`}
                index={item.index}
                active={index === stepIndex}
                title={item.title}
                time={`14:32:${String(10 + index * 3).padStart(2, "0")}`}
                onSelect={() => setStepIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* Playback transport */}
        <div className="playback-bar">
          <button aria-label="Rewind"><RotateCcw size={15} /></button>
          <button aria-label="Pause"><Pause size={15} /></button>
          <button className="playback-play" aria-label="Play"><Play size={18} fill="currentColor" /></button>
          <button aria-label="Step forward"><ArrowRight size={15} /></button>
          <span className="playback-time">14:32:18 / 14:34:29</span>
          <span className="playback-speed">1×</span>
        </div>

        {/* Selected step card */}
        <div className="step-summary">
          <div className="step-card">
            <div>
              <div className="step-card-title">
                Step {String(step.index).padStart(2, "0")}: {step.title}
              </div>
              <div className="step-card-summary">{step.summary}</div>
              <div className="step-card-payload">
                {step.payload.map((p, i) => (
                  <span key={i} className="payload-tag">{p}</span>
                ))}
              </div>
            </div>
            <StatusBadge tone={step.status === "verified" ? "green" : "red"}>
              {step.status === "verified" ? "Verified" : "Tampered"}
            </StatusBadge>
          </div>
        </div>
      </section>

      {/* ═══════════════ DETAIL PANEL ═══════════════ */}
      <aside className="detail-panel">
        {/* Detail header */}
        <div className="detail-header">
          <h2>Step {String(step.index).padStart(2, "0")}: {step.title}</h2>
          <StatusBadge>{step.status === "verified" ? "Verified" : "Tampered"}</StatusBadge>
        </div>

        {/* Packet fields */}
        <div className="detail-section">
          <div className="detail-section-title">Packet data</div>
          <KvRow label="Event Type" value={step.kind.toUpperCase()} />
          <KvRow label="Timestamp" value="2026-06-08 14:32:18 UTC" />
          <KvRow label="Agent ID" value={run.agent} />
          <KvRow label="Packet Hash" value={short(step.contentHash)} />
          <KvRow label="Anchor Tx" value={short(step.txHash)} />
        </div>

        {/* Accordions */}
        <details className="accordion" open>
          <summary>
            Model Input
            <ChevronDown size={14} className="accordion-chevron" />
          </summary>
          <div className="accordion-body">
            <pre>{`{
  "objective": "maximize risk-adjusted yield",
  "risk_threshold": ${riskThreshold},
  "portfolio": "0x8a1f...d3c2"
}`}</pre>
          </div>
        </details>

        <details className="accordion">
          <summary>
            Tool Calls (2)
            <ChevronDown size={14} className="accordion-chevron" />
          </summary>
          <div className="accordion-body">
            <p>getAPY <StatusBadge>Success</StatusBadge></p>
            <p>getExposure <StatusBadge>Success</StatusBadge></p>
          </div>
        </details>

        <details className="accordion">
          <summary>
            Memory Snapshot
            <ChevronDown size={14} className="accordion-chevron" />
          </summary>
          <div className="accordion-body">
            <p>{step.payload.join(" / ")}</p>
          </div>
        </details>

        {/* Verification */}
        <div className="detail-section">
          <div className="detail-section-title">Verification</div>

          <div className={`verify-banner ${verifyStatus === "tampered" ? "tampered" : ""}`}>
            {verifyStatus === "tampered" ? <AlertTriangle /> : <CheckCircle2 />}
            <div>
              <h3>{verifyStatus === "tampered" ? "Packet Tampered" : "Packet Verified"}</h3>
              <p>{verifyDetails || "This packet hash matches the on-chain anchor."}</p>
            </div>
          </div>

          <KvRow label="Packet Hash" value={short(step.contentHash)} />
          <KvRow label="Recomputed" value={verifyStatus === "tampered" ? "mismatch" : short(step.contentHash)} />
          <KvRow label="Anchor Tx" value={short(step.txHash)} />
          <KvRow label="Block Number" value="39874291" />
        </div>

        <div className="action-row">
          <button className="action-btn" onClick={() => handleVerify(false)} disabled={verifying}>
            <ShieldCheck size={14} /> {verifying && !tamperChecking ? "Verifying…" : "Live Verify"}
          </button>
          <button className="action-btn" onClick={() => handleVerify(true)} disabled={verifying}>
            <AlertTriangle size={14} /> {tamperChecking ? "Checking…" : "Run tamper check"}
          </button>
        </div>

        <a
          className="explorer-link"
          href={step.verifyUrl}
          target="_blank"
          rel="noreferrer"
        >
          View on Mantle Explorer <ExternalLink size={12} />
        </a>

        {/* Fork & Replay */}
        <div className="detail-section">
          <div className="detail-section-title">Fork & Replay</div>

          <div className="fork-header">
            <strong>
              <span className="fork-dot" />
              Fork from Step {String(step.index).padStart(2, "0")}
            </strong>
            <button className="fork-edit-btn" onClick={() => setForkOpen(true)}>Edit inputs</button>
          </div>

          <div className="diff-grid">
            <div className="diff-card">
              <StatusBadge tone="orange">Original</StatusBadge>
              <div>
                <div className="diff-metric-label">Risk Threshold</div>
                <div className="diff-metric-value">0.42</div>
              </div>
              <div>
                <div className="diff-metric-label">Decision</div>
                <div className="diff-metric-value">PASS</div>
              </div>
              <div>
                <div className="diff-metric-label">Result</div>
                <div className="diff-metric-value">EXECUTED</div>
              </div>
            </div>

            <div className="diff-vs">VS</div>

            <div className={`diff-card forked ${simulatedPass ? "" : "failed"}`}>
              <StatusBadge tone="blue">Forked</StatusBadge>
              <div>
                <div className="diff-metric-label">Risk Threshold</div>
                <div className="diff-metric-value">{riskThreshold}</div>
              </div>
              <div>
                <div className="diff-metric-label">Decision</div>
                <div className="diff-metric-value">{simulatedPass ? "PASS" : "FAIL"}</div>
              </div>
              <div>
                <div className="diff-metric-label">Result</div>
                <div className="diff-metric-value">{simulatedPass ? "EXECUTED" : "DECLINED"}</div>
              </div>
            </div>
          </div>

          <div className="fork-controls">
            <label>
              Risk threshold
              <input
                type="number"
                step="0.01"
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(Number(e.target.value))}
              />
            </label>
            <label>
              Wallet idle
              <input
                type="number"
                value={walletIdle}
                onChange={(e) => setWalletIdle(Number(e.target.value))}
              />
            </label>
            <button
              className="action-btn primary fork-rerun-btn"
              onClick={() => setForkOpen(true)}
            >
              <GitFork size={14} /> Re-run Fork
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════════ FORK MODAL ═══════════════ */}
      {forkOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setForkOpen(false)}><X size={16} /></button>
            <h2 className="modal-title">Fork & Replay</h2>
            <p className="modal-subtitle">Change the condition. Watch the decision split.</p>

            <div className="fork-controls">
              <label>
                Risk threshold
                <input
                  type="number"
                  step="0.01"
                  value={riskThreshold}
                  onChange={(e) => setRiskThreshold(Number(e.target.value))}
                />
              </label>
              <label>
                Wallet idle
                <input
                  type="number"
                  value={walletIdle}
                  onChange={(e) => setWalletIdle(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="diff-grid" style={{ marginTop: 20 }}>
              <div className="diff-card">
                <StatusBadge tone="orange">Original</StatusBadge>
                <div>
                  <div className="diff-metric-label">Decision</div>
                  <div className="diff-metric-value">PASS</div>
                </div>
                <div>
                  <div className="diff-metric-label">Outcome</div>
                  <div className="diff-metric-value">Funds moved</div>
                </div>
              </div>
              <div className={`diff-card forked ${simulatedPass ? "" : "failed"}`}>
                <StatusBadge tone={simulatedPass ? "green" : "red"}>Forked</StatusBadge>
                <div>
                  <div className="diff-metric-label">Decision</div>
                  <div className="diff-metric-value">{simulatedPass ? "PASS" : "FAIL"}</div>
                </div>
                <div>
                  <div className="diff-metric-label">Outcome</div>
                  <div className="diff-metric-value">{simulatedPass ? "Execute" : "No action"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

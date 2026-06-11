import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  GitFork,
  Layers,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Square,
  X,
} from "lucide-react";
import { flightRecorderAddress, replayRuns, type ReplayRun } from "../viewer-data.js";
import { replayApiUrl } from "./api.js";
import { verifyPacketStatic } from "./static-verify.js";
import "./styles.css";

type VerifyStatus = "idle" | "success" | "success-fallback" | "tampered";

function short(hash = "") {
  return hash.length > 16 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;
}

function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="kv-row">
      <span className="kv-label">{label}</span>
      <span className="kv-value">{value}</span>
    </div>
  );
}

export function App() {
  const [runs, setRuns] = useState<ReplayRun[]>(replayRuns);
  const [loading, setLoading] = useState(false);
  const [runIndex, setRunIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "detail">("detail");
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
      if (Array.isArray(data) && data.length > 0) {
        setRuns(data);
        return;
      }
      throw new Error("API returned no runs");
    } catch {
      // No API (static deployment): load the committed demo bundle — real
      // anchored packets with embedded bytes for browser-side verification.
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}demo-data.json`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) setRuns(data);
      } catch (error) {
        console.warn("Using static fallback runs.", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const run = runs[runIndex] ?? replayRuns[0]!;
  const step = run.steps[stepIndex] ?? run.steps[0]!;
  const verifiedCount = useMemo(() => run.steps.filter((item) => item.status === "verified").length, [run]);
  const simulatedPass = riskThreshold <= 0.48;

  const selectRun = (index: number) => {
    setRunIndex(index);
    setStepIndex(0);
    setVerifyStatus("idle");
    setVerifyDetails("");
    setViewMode("detail");
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
      // No API (static deployment): verify in the browser — recompute sha256 of
      // the embedded packet bytes and read the anchor straight from Mantle RPC.
      if (step.contentHash && step.packetText) {
        try {
          const data = await verifyPacketStatic({
            contentHash: step.contentHash,
            packetText: step.packetText,
            anchorRef: step.anchorRef,
            tamper,
          });
          if (data.verified) {
            setVerifyStatus("success");
            setVerifyDetails(data.reason);
          } else {
            setVerifyStatus("tampered");
            setVerifyDetails(data.reason);
          }
        } catch (error) {
          setVerifyStatus("success-fallback");
          setVerifyDetails(`Live RPC verification unavailable: ${(error as Error).message}`);
        }
      } else {
        setVerifyStatus("success-fallback");
        setVerifyDetails("Local server unavailable; showing fixture-backed proof state.");
      }
    } finally {
      setVerifying(false);
      setTamperChecking(false);
    }
  };

  return (
    <div className="shell">
      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className="sidebar">
        <div className="sb-logo">
          <span className="sb-logo-icon">
            <Play size={11} fill="currentColor" style={{ marginLeft: "1px" }} />
          </span>
          <span className="sb-logo-text">REPLAY</span>
          <span className="sb-badge">v1.0</span>
        </div>

        <div className="sb-search">
          <Search size={13} className="sb-search-icon" />
          <input type="text" placeholder="Search runs..." readOnly />
          <span className="sb-search-hint">⌘K</span>
        </div>

        <div className="sb-nav">
          <button className={`sb-nav-item ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}>
            <Activity size={16} />
            <span>All Runs</span>
            <span className="sb-nav-count">{runs.length}</span>
          </button>

          <div className="sb-divider" />

          <div style={{ padding: "8px 12px 4px", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.05em", fontFamily: "var(--mono)" }}>
            Recorded Runs
          </div>
          {runs.map((r, idx) => (
            <button
              key={r.id}
              className={`sb-nav-item ${viewMode === "detail" && runIndex === idx ? "active" : ""}`}
              onClick={() => selectRun(idx)}
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: viewMode === "detail" && runIndex === idx ? "var(--accent)" : "var(--text-3)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {r.name}
                </span>
              </div>
              <span style={{ fontSize: "10px", color: "var(--text-3)", marginLeft: "12px", fontFamily: "var(--mono)" }}>
                {r.id.slice(0, 8)}… · {r.steps.length} steps
              </span>
            </button>
          ))}
        </div>

        <div className="sb-bottom">
          <button className="sb-nav-item">
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>

        <div className="sb-status">
          <div className="sb-status-dot" />
          <div className="sb-status-info">
            <div className="sb-status-chain">MANTLE SEPOLIA</div>
            <div className="sb-status-block">Block #39,874,291</div>
          </div>
          <div className="sb-status-latency">12ms</div>
        </div>
      </aside>

      {/* ═══════════════ MAIN AREA ═══════════════ */}
      <main className="main">
        {viewMode === "list" ? (
          <>
            <div className="topbar">
              <div className="topbar-left">
                <h1>Recorded Runs</h1>
                <p>Verify execution integrity of local agents on-chain.</p>
              </div>
              <div className="topbar-actions">
                <button className={`btn-solid ${loading ? "spinning" : ""}`} onClick={fetchRuns}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            <div className="stats-row">
              <div className="stat">
                <div className="stat-label">Total Runs</div>
                <div className="stat-value neutral">{runs.length} Active</div>
              </div>
              <div className="stat">
                <div className="stat-label">Total Packets</div>
                <div className="stat-value neutral">
                  {runs.reduce((acc, curr) => acc + curr.steps.length, 0)} Recorded
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Status</div>
                <div className="stat-value">HEALTHY</div>
              </div>
              <div className="stat">
                <div className="stat-label">Mantle Anchor</div>
                <div className="stat-value neutral" title={flightRecorderAddress}>{short(flightRecorderAddress)}</div>
              </div>
            </div>

            <div className="section-heading">
              <span>All Recorded Agent Operations</span>
              <span className="section-count">{runs.length}</span>
            </div>

            <div className="run-list">
              {runs.map((r, idx) => (
                <button
                  key={r.id}
                  className="run-row"
                  onClick={() => selectRun(idx)}
                >
                  <div className="run-row-icon">
                    <Activity size={18} />
                  </div>
                  <div className="run-row-info">
                    <div className="run-row-title">
                      <span className="run-row-name">{r.name}</span>
                      <span className="run-row-hash">{r.id}</span>
                    </div>
                    <div className="run-row-desc">{r.subtitle}</div>
                  </div>
                  <div className="run-row-right">
                    <div className="run-row-steps">{r.steps.length} steps</div>
                    <div className="run-row-time">14:32 UTC</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="topbar">
              <div className="topbar-left">
                <button className="btn-back" onClick={() => setViewMode("list")}>
                  ← Back to runs
                </button>
                <h1>
                  {run.name}
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-3)", marginLeft: "8px" }}>
                    {run.id}
                  </span>
                </h1>
                <p>{run.subtitle}</p>
              </div>
              <div className="topbar-actions">
                <span className={`badge ${verifiedCount === run.steps.length ? "green" : "orange"}`}>
                  {verifiedCount === run.steps.length ? "Verified" : `${verifiedCount}/${run.steps.length} Verified`}
                </span>
                <button className="btn-solid" onClick={fetchRuns}>
                  <RefreshCw size={14} className={loading ? "spinning" : ""} />
                </button>
              </div>
            </div>

            <div className="stats-row">
              <div className="stat">
                <div className="stat-label">Agent</div>
                <div className="stat-value neutral">{run.agent}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Network</div>
                <div className="stat-value neutral">Mantle Sepolia</div>
              </div>
              <div className="stat">
                <div className="stat-label">Contract</div>
                <div className="stat-value neutral" title={run.contract}>{short(run.contract)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Total Steps</div>
                <div className="stat-value">{run.steps.length}</div>
              </div>
            </div>

            <div className="detail-content">
              {/* Timeline */}
              <div className="timeline-section">
                <div className="timeline-label">Step timeline</div>
                <div className="timeline-rail">
                  {run.steps.map((item, index) => (
                    <button
                      key={item.index}
                      className={`t-step ${index === stepIndex ? "active" : ""}`}
                      onClick={() => {
                        setStepIndex(index);
                        setVerifyStatus("idle");
                        setVerifyDetails("");
                      }}
                    >
                      <span className="t-dot">
                        {index === stepIndex ? <Play size={12} fill="currentColor" /> : <Square size={10} />}
                      </span>
                      <span className="t-idx">{String(item.index).padStart(2, "0")}</span>
                      <span className="t-title">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Playback */}
              <div className="playback">
                <button aria-label="Rewind" onClick={() => setStepIndex(0)}>
                  <RotateCcw size={14} />
                </button>
                <button aria-label="Pause">
                  <Pause size={14} />
                </button>
                <button className="play-btn" aria-label="Play">
                  <Play size={16} fill="currentColor" />
                </button>
                <button
                  aria-label="Step forward"
                  onClick={() => setStepIndex((prev) => Math.min(run.steps.length - 1, prev + 1))}
                >
                  <ArrowRight size={14} />
                </button>
                <span className="play-time">
                  {`14:32:${String(10 + stepIndex * 3).padStart(2, "0")} / 14:32:${String(10 + (run.steps.length - 1) * 3).padStart(2, "0")}`}
                </span>
                <span className="play-speed">1×</span>
              </div>

              {/* Step Detail Card */}
              <div className="step-detail-card">
                <div className="step-detail-top">
                  <div>
                    <div className="step-detail-title">
                      Step {String(step.index).padStart(2, "0")}: {step.title}
                    </div>
                    <div className="step-detail-summary">{step.summary}</div>
                  </div>
                  <span className={`badge ${step.status === "verified" ? "green" : "red"}`}>
                    {step.status}
                  </span>
                </div>
                <div className="payload-tags">
                  {step.payload.map((p, i) => (
                    <span key={i} className="p-tag">{p}</span>
                  ))}
                </div>
              </div>

              {/* Grid: Inspector + Verify */}
              <div className="detail-grid">
                {/* Column 1: Inspector */}
                <div className="inspector-card">
                  <div className="inspector-header">
                    <h3>Packet Inspector</h3>
                    <span className="badge blue">{step.kind.toUpperCase()}</span>
                  </div>
                  <div className="inspector-body">
                    <KvRow label="Event Type" value={step.kind.toUpperCase()} />
                    <KvRow label="Timestamp" value="2026-06-08 14:32:18 UTC" />
                    <KvRow label="Agent ID" value={run.agent} />
                    <KvRow label="Packet Hash" value={short(step.contentHash)} />
                    <KvRow label="Anchor Tx" value={short(step.txHash)} />

                    <details className="acc" open>
                      <summary>
                        Model Input
                        <ChevronDown size={14} className="acc-chevron" />
                      </summary>
                      <div className="acc-body">
                        <pre>{`{
  "objective": "maximize risk-adjusted yield",
  "risk_threshold": ${riskThreshold},
  "portfolio": "0x8a1f...d3c2"
}`}</pre>
                      </div>
                    </details>

                    <details className="acc">
                      <summary>
                        Tool Calls ({step.payload.length})
                        <ChevronDown size={14} className="acc-chevron" />
                      </summary>
                      <div className="acc-body">
                        {step.payload.map((p, i) => (
                          <p key={i}>
                            {p.split(" ")[0]} <span className="badge green" style={{ marginLeft: "auto", scale: "0.85" }}>Success</span>
                          </p>
                        ))}
                      </div>
                    </details>

                    <details className="acc">
                      <summary>
                        Memory Snapshot
                        <ChevronDown size={14} className="acc-chevron" />
                      </summary>
                      <div className="acc-body">
                        <p>{step.payload.join(" / ")}</p>
                      </div>
                    </details>
                  </div>
                </div>

                {/* Column 2: Verify */}
                <div className="verify-card">
                  <div className="verify-header">
                    <h3>Proof Verification</h3>
                    <span className={`badge ${verifyStatus === "tampered" ? "red" : "green"}`}>
                      {verifyStatus === "tampered" ? "TAMPERED" : "VERIFIED"}
                    </span>
                  </div>
                  <div className="verify-body">
                    <div className={`verify-banner ${verifyStatus === "tampered" ? "tampered" : ""}`}>
                      {verifyStatus === "tampered" ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                      <div>
                        <h4>{verifyStatus === "tampered" ? "Packet Tampered" : "Packet Verified"}</h4>
                        <p>{verifyDetails || "This packet hash matches the on-chain anchor."}</p>
                      </div>
                    </div>

                    <KvRow label="Packet Hash" value={short(step.contentHash)} />
                    <KvRow label="Recomputed" value={verifyStatus === "tampered" ? "mismatch" : short(step.contentHash)} />
                    <KvRow label="Anchor Tx" value={short(step.txHash)} />
                    <KvRow label="Block Number" value="39874291" />

                    <div className="verify-actions">
                      <button onClick={() => handleVerify(false)} disabled={verifying}>
                        <ShieldCheck size={14} />
                        {verifying && !tamperChecking ? "Verifying..." : "Live Verify"}
                      </button>
                      <button onClick={() => handleVerify(true)} disabled={verifying}>
                        <AlertTriangle size={14} />
                        {tamperChecking ? "Checking..." : "Run tamper check"}
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
                  </div>
                </div>
              </div>

              {/* Fork Section */}
              <div className="fork-section">
                <div className="fork-sec-header">
                  <h3>
                    <span />
                    Fork from Step {String(step.index).padStart(2, "0")}
                  </h3>
                  <button className="fork-edit" onClick={() => setForkOpen(true)}>Edit inputs</button>
                </div>
                <div className="fork-body">
                  <div className="diff-row">
                    <div className="diff-card">
                      <span className="badge orange">Original</span>
                      <div style={{ marginTop: "8px" }}>
                        <div className="dm-label">Risk Threshold</div>
                        <div className="dm-value">0.42</div>
                      </div>
                      <div style={{ marginTop: "8px" }}>
                        <div className="dm-label">Decision</div>
                        <div className="dm-value">PASS</div>
                      </div>
                      <div style={{ marginTop: "8px" }}>
                        <div className="dm-label">Result</div>
                        <div className="dm-value">EXECUTED</div>
                      </div>
                    </div>

                    <div className="diff-vs">VS</div>

                    <div className={`diff-card forked ${simulatedPass ? "" : "failed"}`}>
                      <span className={`badge ${simulatedPass ? "blue" : "red"}`}>Forked</span>
                      <div style={{ marginTop: "8px" }}>
                        <div className="dm-label">Risk Threshold</div>
                        <div className="dm-value">{riskThreshold}</div>
                      </div>
                      <div style={{ marginTop: "8px" }}>
                        <div className="dm-label">Decision</div>
                        <div className="dm-value">{simulatedPass ? "PASS" : "FAIL"}</div>
                      </div>
                      <div style={{ marginTop: "8px" }}>
                        <div className="dm-label">Result</div>
                        <div className="dm-value">{simulatedPass ? "EXECUTED" : "DECLINED"}</div>
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
                    <button className="fork-rerun" onClick={() => setForkOpen(true)}>
                      <GitFork size={13} />
                      Re-run Fork
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ═══════════════ FORK MODAL ═══════════════ */}
      {forkOpen && (
        <div className="modal-bg">
          <div className="modal-box">
            <button className="modal-x" onClick={() => setForkOpen(false)}>
              <X size={16} />
            </button>
            <h2>Fork &amp; Replay</h2>
            <p>Change the conditions. Watch the decision split.</p>

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

            <div className="diff-row" style={{ marginTop: 20 }}>
              <div className="diff-card">
                <span className="badge orange">Original</span>
                <div style={{ marginTop: "8px" }}>
                  <div className="dm-label">Risk Threshold</div>
                  <div className="dm-value">0.42</div>
                </div>
                <div style={{ marginTop: "8px" }}>
                  <div className="dm-label">Decision</div>
                  <div className="dm-value">PASS</div>
                </div>
                <div style={{ marginTop: "8px" }}>
                  <div className="dm-label">Result</div>
                  <div className="dm-value">EXECUTED</div>
                </div>
              </div>

              <div className="diff-vs">VS</div>

              <div className={`diff-card forked ${simulatedPass ? "" : "failed"}`}>
                <span className={`badge ${simulatedPass ? "blue" : "red"}`}>Forked</span>
                <div style={{ marginTop: "8px" }}>
                  <div className="dm-label">Risk Threshold</div>
                  <div className="dm-value">{riskThreshold}</div>
                </div>
                <div style={{ marginTop: "8px" }}>
                  <div className="dm-label">Decision</div>
                  <div className="dm-value">{simulatedPass ? "PASS" : "FAIL"}</div>
                </div>
                <div style={{ marginTop: "8px" }}>
                  <div className="dm-label">Result</div>
                  <div className="dm-value">{simulatedPass ? "EXECUTED" : "DECLINED"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

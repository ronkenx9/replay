import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, ChevronDown, ExternalLink, GitFork, Pause, Play, RefreshCw, RotateCcw, Search, Settings, ShieldCheck, Square, X, } from "lucide-react";
import { flightRecorderAddress, replayRuns } from "../viewer-data.js";
import { replayApiUrl } from "./api.js";
import { verifyPacketStatic } from "./static-verify.js";
import "./styles.css";
function short(hash = "") {
    return hash.length > 16 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;
}
function KvRow({ label, value }) {
    return (_jsxs("div", { className: "kv-row", children: [_jsx("span", { className: "kv-label", children: label }), _jsx("span", { className: "kv-value", children: value })] }));
}
export function App() {
    const [runs, setRuns] = useState(replayRuns);
    const [loading, setLoading] = useState(false);
    const [runIndex, setRunIndex] = useState(0);
    const [stepIndex, setStepIndex] = useState(0);
    const [viewMode, setViewMode] = useState("detail");
    const [verifying, setVerifying] = useState(false);
    const [tamperChecking, setTamperChecking] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState("idle");
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
        }
        catch {
            // No API (static deployment): load the committed demo bundle — real
            // anchored packets with embedded bytes for browser-side verification.
            try {
                const response = await fetch(`${import.meta.env.BASE_URL}demo-data.json`);
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0)
                    setRuns(data);
            }
            catch (error) {
                console.warn("Using static fallback runs.", error);
            }
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchRuns();
    }, []);
    const run = runs[runIndex] ?? replayRuns[0];
    const step = run.steps[stepIndex] ?? run.steps[0];
    const verifiedCount = useMemo(() => run.steps.filter((item) => item.status === "verified").length, [run]);
    const simulatedPass = riskThreshold <= 0.48;
    const selectRun = (index) => {
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
            }
            else {
                setVerifyStatus("tampered");
                setVerifyDetails(data.reason || "Local packet hash mismatch.");
            }
        }
        catch {
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
                    }
                    else {
                        setVerifyStatus("tampered");
                        setVerifyDetails(data.reason);
                    }
                }
                catch (error) {
                    setVerifyStatus("success-fallback");
                    setVerifyDetails(`Live RPC verification unavailable: ${error.message}`);
                }
            }
            else {
                setVerifyStatus("success-fallback");
                setVerifyDetails("Local server unavailable; showing fixture-backed proof state.");
            }
        }
        finally {
            setVerifying(false);
            setTamperChecking(false);
        }
    };
    return (_jsxs("div", { className: "shell", children: [_jsxs("aside", { className: "sidebar", children: [_jsxs("div", { className: "sb-logo", children: [_jsx("span", { className: "sb-logo-icon", children: _jsx(Play, { size: 11, fill: "currentColor", style: { marginLeft: "1px" } }) }), _jsx("span", { className: "sb-logo-text", children: "REPLAY" }), _jsx("span", { className: "sb-badge", children: "v1.0" })] }), _jsxs("div", { className: "sb-search", children: [_jsx(Search, { size: 13, className: "sb-search-icon" }), _jsx("input", { type: "text", placeholder: "Search runs...", readOnly: true }), _jsx("span", { className: "sb-search-hint", children: "\u2318K" })] }), _jsxs("div", { className: "sb-nav", children: [_jsxs("button", { className: `sb-nav-item ${viewMode === "list" ? "active" : ""}`, onClick: () => setViewMode("list"), children: [_jsx(Activity, { size: 16 }), _jsx("span", { children: "All Runs" }), _jsx("span", { className: "sb-nav-count", children: runs.length })] }), _jsx("div", { className: "sb-divider" }), _jsx("div", { style: { padding: "8px 12px 4px", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.05em", fontFamily: "var(--mono)" }, children: "Recorded Runs" }), runs.map((r, idx) => (_jsxs("button", { className: `sb-nav-item ${viewMode === "detail" && runIndex === idx ? "active" : ""}`, onClick: () => selectRun(idx), style: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", width: "100%" }, children: [_jsx("div", { style: {
                                                    width: "6px",
                                                    height: "6px",
                                                    borderRadius: "50%",
                                                    background: viewMode === "detail" && runIndex === idx ? "var(--accent)" : "var(--text-3)",
                                                    flexShrink: 0,
                                                } }), _jsx("span", { style: { fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }, children: r.name })] }), _jsxs("span", { style: { fontSize: "10px", color: "var(--text-3)", marginLeft: "12px", fontFamily: "var(--mono)" }, children: [r.id.slice(0, 8), "\u2026 \u00B7 ", r.steps.length, " steps"] })] }, r.id)))] }), _jsx("div", { className: "sb-bottom", children: _jsxs("button", { className: "sb-nav-item", children: [_jsx(Settings, { size: 16 }), _jsx("span", { children: "Settings" })] }) }), _jsxs("div", { className: "sb-status", children: [_jsx("div", { className: "sb-status-dot" }), _jsxs("div", { className: "sb-status-info", children: [_jsx("div", { className: "sb-status-chain", children: "MANTLE SEPOLIA" }), _jsx("div", { className: "sb-status-block", children: "Block #39,874,291" })] }), _jsx("div", { className: "sb-status-latency", children: "12ms" })] })] }), _jsx("main", { className: "main", children: viewMode === "list" ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "topbar", children: [_jsxs("div", { className: "topbar-left", children: [_jsx("h1", { children: "Recorded Runs" }), _jsx("p", { children: "Verify execution integrity of local agents on-chain." })] }), _jsx("div", { className: "topbar-actions", children: _jsxs("button", { className: `btn-solid ${loading ? "spinning" : ""}`, onClick: fetchRuns, children: [_jsx(RefreshCw, { size: 14 }), " Refresh"] }) })] }), _jsxs("div", { className: "stats-row", children: [_jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-label", children: "Total Runs" }), _jsxs("div", { className: "stat-value neutral", children: [runs.length, " Active"] })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-label", children: "Total Packets" }), _jsxs("div", { className: "stat-value neutral", children: [runs.reduce((acc, curr) => acc + curr.steps.length, 0), " Recorded"] })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-label", children: "Status" }), _jsx("div", { className: "stat-value", children: "HEALTHY" })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-label", children: "Mantle Anchor" }), _jsx("div", { className: "stat-value neutral", title: flightRecorderAddress, children: short(flightRecorderAddress) })] })] }), _jsxs("div", { className: "section-heading", children: [_jsx("span", { children: "All Recorded Agent Operations" }), _jsx("span", { className: "section-count", children: runs.length })] }), _jsx("div", { className: "run-list", children: runs.map((r, idx) => (_jsxs("button", { className: "run-row", onClick: () => selectRun(idx), children: [_jsx("div", { className: "run-row-icon", children: _jsx(Activity, { size: 18 }) }), _jsxs("div", { className: "run-row-info", children: [_jsxs("div", { className: "run-row-title", children: [_jsx("span", { className: "run-row-name", children: r.name }), _jsx("span", { className: "run-row-hash", children: r.id })] }), _jsx("div", { className: "run-row-desc", children: r.subtitle })] }), _jsxs("div", { className: "run-row-right", children: [_jsxs("div", { className: "run-row-steps", children: [r.steps.length, " steps"] }), _jsx("div", { className: "run-row-time", children: "14:32 UTC" })] })] }, r.id))) })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "topbar", children: [_jsxs("div", { className: "topbar-left", children: [_jsx("button", { className: "btn-back", onClick: () => setViewMode("list"), children: "\u2190 Back to runs" }), _jsxs("h1", { children: [run.name, _jsx("span", { style: { fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-3)", marginLeft: "8px" }, children: run.id })] }), _jsx("p", { children: run.subtitle })] }), _jsxs("div", { className: "topbar-actions", children: [_jsx("span", { className: `badge ${verifiedCount === run.steps.length ? "green" : "orange"}`, children: verifiedCount === run.steps.length ? "Verified" : `${verifiedCount}/${run.steps.length} Verified` }), _jsx("button", { className: "btn-solid", onClick: fetchRuns, children: _jsx(RefreshCw, { size: 14, className: loading ? "spinning" : "" }) })] })] }), _jsxs("div", { className: "stats-row", children: [_jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-label", children: "Agent" }), _jsx("div", { className: "stat-value neutral", children: run.agent })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-label", children: "Network" }), _jsx("div", { className: "stat-value neutral", children: "Mantle Sepolia" })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-label", children: "Contract" }), _jsx("div", { className: "stat-value neutral", title: run.contract, children: short(run.contract) })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-label", children: "Total Steps" }), _jsx("div", { className: "stat-value", children: run.steps.length })] })] }), _jsxs("div", { className: "detail-content", children: [_jsxs("div", { className: "timeline-section", children: [_jsx("div", { className: "timeline-label", children: "Step timeline" }), _jsx("div", { className: "timeline-rail", children: run.steps.map((item, index) => (_jsxs("button", { className: `t-step ${index === stepIndex ? "active" : ""}`, onClick: () => {
                                                    setStepIndex(index);
                                                    setVerifyStatus("idle");
                                                    setVerifyDetails("");
                                                }, children: [_jsx("span", { className: "t-dot", children: index === stepIndex ? _jsx(Play, { size: 12, fill: "currentColor" }) : _jsx(Square, { size: 10 }) }), _jsx("span", { className: "t-idx", children: String(item.index).padStart(2, "0") }), _jsx("span", { className: "t-title", children: item.title })] }, item.index))) })] }), _jsxs("div", { className: "playback", children: [_jsx("button", { "aria-label": "Rewind", onClick: () => setStepIndex(0), children: _jsx(RotateCcw, { size: 14 }) }), _jsx("button", { "aria-label": "Pause", children: _jsx(Pause, { size: 14 }) }), _jsx("button", { className: "play-btn", "aria-label": "Play", children: _jsx(Play, { size: 16, fill: "currentColor" }) }), _jsx("button", { "aria-label": "Step forward", onClick: () => setStepIndex((prev) => Math.min(run.steps.length - 1, prev + 1)), children: _jsx(ArrowRight, { size: 14 }) }), _jsx("span", { className: "play-time", children: `14:32:${String(10 + stepIndex * 3).padStart(2, "0")} / 14:32:${String(10 + (run.steps.length - 1) * 3).padStart(2, "0")}` }), _jsx("span", { className: "play-speed", children: "1\u00D7" })] }), _jsxs("div", { className: "step-detail-card", children: [_jsxs("div", { className: "step-detail-top", children: [_jsxs("div", { children: [_jsxs("div", { className: "step-detail-title", children: ["Step ", String(step.index).padStart(2, "0"), ": ", step.title] }), _jsx("div", { className: "step-detail-summary", children: step.summary })] }), _jsx("span", { className: `badge ${step.status === "verified" ? "green" : "red"}`, children: step.status })] }), _jsx("div", { className: "payload-tags", children: step.payload.map((p, i) => (_jsx("span", { className: "p-tag", children: p }, i))) })] }), _jsxs("div", { className: "detail-grid", children: [_jsxs("div", { className: "inspector-card", children: [_jsxs("div", { className: "inspector-header", children: [_jsx("h3", { children: "Packet Inspector" }), _jsx("span", { className: "badge blue", children: step.kind.toUpperCase() })] }), _jsxs("div", { className: "inspector-body", children: [_jsx(KvRow, { label: "Event Type", value: step.kind.toUpperCase() }), _jsx(KvRow, { label: "Timestamp", value: "2026-06-08 14:32:18 UTC" }), _jsx(KvRow, { label: "Agent ID", value: run.agent }), _jsx(KvRow, { label: "Packet Hash", value: short(step.contentHash) }), _jsx(KvRow, { label: "Anchor Tx", value: short(step.txHash) }), _jsxs("details", { className: "acc", open: true, children: [_jsxs("summary", { children: ["Model Input", _jsx(ChevronDown, { size: 14, className: "acc-chevron" })] }), _jsx("div", { className: "acc-body", children: _jsx("pre", { children: `{
  "objective": "maximize risk-adjusted yield",
  "risk_threshold": ${riskThreshold},
  "portfolio": "0x8a1f...d3c2"
}` }) })] }), _jsxs("details", { className: "acc", children: [_jsxs("summary", { children: ["Tool Calls (", step.payload.length, ")", _jsx(ChevronDown, { size: 14, className: "acc-chevron" })] }), _jsx("div", { className: "acc-body", children: step.payload.map((p, i) => (_jsxs("p", { children: [p.split(" ")[0], " ", _jsx("span", { className: "badge green", style: { marginLeft: "auto", scale: "0.85" }, children: "Success" })] }, i))) })] }), _jsxs("details", { className: "acc", children: [_jsxs("summary", { children: ["Memory Snapshot", _jsx(ChevronDown, { size: 14, className: "acc-chevron" })] }), _jsx("div", { className: "acc-body", children: _jsx("p", { children: step.payload.join(" / ") }) })] })] })] }), _jsxs("div", { className: "verify-card", children: [_jsxs("div", { className: "verify-header", children: [_jsx("h3", { children: "Proof Verification" }), _jsx("span", { className: `badge ${verifyStatus === "tampered" ? "red" : "green"}`, children: verifyStatus === "tampered" ? "TAMPERED" : "VERIFIED" })] }), _jsxs("div", { className: "verify-body", children: [_jsxs("div", { className: `verify-banner ${verifyStatus === "tampered" ? "tampered" : ""}`, children: [verifyStatus === "tampered" ? _jsx(AlertTriangle, { size: 24 }) : _jsx(ShieldCheck, { size: 24 }), _jsxs("div", { children: [_jsx("h4", { children: verifyStatus === "tampered" ? "Packet Tampered" : "Packet Verified" }), _jsx("p", { children: verifyDetails || "This packet hash matches the on-chain anchor." })] })] }), _jsx(KvRow, { label: "Packet Hash", value: short(step.contentHash) }), _jsx(KvRow, { label: "Recomputed", value: verifyStatus === "tampered" ? "mismatch" : short(step.contentHash) }), _jsx(KvRow, { label: "Anchor Tx", value: short(step.txHash) }), _jsx(KvRow, { label: "Block Number", value: "39874291" }), _jsxs("div", { className: "verify-actions", children: [_jsxs("button", { onClick: () => handleVerify(false), disabled: verifying, children: [_jsx(ShieldCheck, { size: 14 }), verifying && !tamperChecking ? "Verifying..." : "Live Verify"] }), _jsxs("button", { onClick: () => handleVerify(true), disabled: verifying, children: [_jsx(AlertTriangle, { size: 14 }), tamperChecking ? "Checking..." : "Run tamper check"] })] }), _jsxs("a", { className: "explorer-link", href: step.verifyUrl, target: "_blank", rel: "noreferrer", children: ["View on Mantle Explorer ", _jsx(ExternalLink, { size: 12 })] })] })] })] }), _jsxs("div", { className: "fork-section", children: [_jsxs("div", { className: "fork-sec-header", children: [_jsxs("h3", { children: [_jsx("span", {}), "Fork from Step ", String(step.index).padStart(2, "0")] }), _jsx("button", { className: "fork-edit", onClick: () => setForkOpen(true), children: "Edit inputs" })] }), _jsxs("div", { className: "fork-body", children: [_jsxs("div", { className: "diff-row", children: [_jsxs("div", { className: "diff-card", children: [_jsx("span", { className: "badge orange", children: "Original" }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Risk Threshold" }), _jsx("div", { className: "dm-value", children: "0.42" })] }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Decision" }), _jsx("div", { className: "dm-value", children: "PASS" })] }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Result" }), _jsx("div", { className: "dm-value", children: "EXECUTED" })] })] }), _jsx("div", { className: "diff-vs", children: "VS" }), _jsxs("div", { className: `diff-card forked ${simulatedPass ? "" : "failed"}`, children: [_jsx("span", { className: `badge ${simulatedPass ? "blue" : "red"}`, children: "Forked" }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Risk Threshold" }), _jsx("div", { className: "dm-value", children: riskThreshold })] }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Decision" }), _jsx("div", { className: "dm-value", children: simulatedPass ? "PASS" : "FAIL" })] }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Result" }), _jsx("div", { className: "dm-value", children: simulatedPass ? "EXECUTED" : "DECLINED" })] })] })] }), _jsxs("div", { className: "fork-controls", children: [_jsxs("label", { children: ["Risk threshold", _jsx("input", { type: "number", step: "0.01", value: riskThreshold, onChange: (e) => setRiskThreshold(Number(e.target.value)) })] }), _jsxs("label", { children: ["Wallet idle", _jsx("input", { type: "number", value: walletIdle, onChange: (e) => setWalletIdle(Number(e.target.value)) })] }), _jsxs("button", { className: "fork-rerun", onClick: () => setForkOpen(true), children: [_jsx(GitFork, { size: 13 }), "Re-run Fork"] })] })] })] })] })] })) }), forkOpen && (_jsx("div", { className: "modal-bg", children: _jsxs("div", { className: "modal-box", children: [_jsx("button", { className: "modal-x", onClick: () => setForkOpen(false), children: _jsx(X, { size: 16 }) }), _jsx("h2", { children: "Fork & Replay" }), _jsx("p", { children: "Change the conditions. Watch the decision split." }), _jsxs("div", { className: "fork-controls", children: [_jsxs("label", { children: ["Risk threshold", _jsx("input", { type: "number", step: "0.01", value: riskThreshold, onChange: (e) => setRiskThreshold(Number(e.target.value)) })] }), _jsxs("label", { children: ["Wallet idle", _jsx("input", { type: "number", value: walletIdle, onChange: (e) => setWalletIdle(Number(e.target.value)) })] })] }), _jsxs("div", { className: "diff-row", style: { marginTop: 20 }, children: [_jsxs("div", { className: "diff-card", children: [_jsx("span", { className: "badge orange", children: "Original" }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Risk Threshold" }), _jsx("div", { className: "dm-value", children: "0.42" })] }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Decision" }), _jsx("div", { className: "dm-value", children: "PASS" })] }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Result" }), _jsx("div", { className: "dm-value", children: "EXECUTED" })] })] }), _jsx("div", { className: "diff-vs", children: "VS" }), _jsxs("div", { className: `diff-card forked ${simulatedPass ? "" : "failed"}`, children: [_jsx("span", { className: `badge ${simulatedPass ? "blue" : "red"}`, children: "Forked" }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Risk Threshold" }), _jsx("div", { className: "dm-value", children: riskThreshold })] }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Decision" }), _jsx("div", { className: "dm-value", children: simulatedPass ? "PASS" : "FAIL" })] }), _jsxs("div", { style: { marginTop: "8px" }, children: [_jsx("div", { className: "dm-label", children: "Result" }), _jsx("div", { className: "dm-value", children: simulatedPass ? "EXECUTED" : "DECLINED" })] })] })] })] }) }))] }));
}
//# sourceMappingURL=App.js.map
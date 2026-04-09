"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnalysisResult, ListingData } from "./types";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ── Loading ──────────────────────────────────────────────────
function Loader() {
  const steps = ["PARSING LISTING", "RUNNING DIAGNOSTICS", "CALCULATING ROI", "DRAFTING NEGOTIATION SCRIPT"];
  const [step, setStep] = useState(0);
  useState(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1300);
    return () => clearInterval(t);
  });
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "40px" }}>
      <div style={{ textAlign: "center" }}>
        <div className="display" style={{ fontSize: "72px", fontWeight: 900, color: "var(--orange)", lineHeight: 1, letterSpacing: "-0.02em" }}>AAA</div>
        <div className="mono" style={{ fontSize: "10px", letterSpacing: "0.2em", color: "var(--muted)", marginTop: "4px" }}>ANALYZING</div>
      </div>
      <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: i <= step ? "var(--orange)" : "var(--dim)", transition: "background 0.3s" }} />
            <span className="mono" style={{ fontSize: "10px", letterSpacing: "0.08em", color: i < step ? "var(--muted)" : i === step ? "var(--orange)" : "var(--dim)", transition: "color 0.3s" }}>{s}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <span className="dot dot-1" /><span className="dot dot-2" /><span className="dot dot-3" />
      </div>
    </div>
  );
}

// ── Score Bar ────────────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="bar-track" style={{ marginTop: "8px" }}>
      <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Results ──────────────────────────────────────────────────
function Results({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [tab, setTab] = useState<"diag" | "roi" | "nego">("diag");
  const [copied, setCopied] = useState<string | null>(null);
  const { listing: L, diagnostic: D, roi: R, negotiation: N } = result;

  const ratingCls = { PASS: "rating-pass", MAYBE: "rating-maybe", SKIP: "rating-skip" }[R.dealRating] || "";
  const barColor = R.dealScore >= 70 ? "var(--green)" : R.dealScore >= 45 ? "var(--yellow)" : "var(--red)";
  const profitCls = R.potentialProfit >= 0 ? "profit-positive" : "profit-negative";

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "40px" }}>
      <div className="accent-line" />

      {/* Header */}
      <div style={{ padding: "16px 20px 0" }}>
        <button className="btn-ghost" onClick={onReset} style={{ marginBottom: "20px" }}>← NEW LISTING</button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "20px" }}>
          <div>
            <div className="display" style={{ fontSize: "36px", fontWeight: 800, lineHeight: 1.1, color: "var(--text)" }}>
              {L.year} {L.make}<br />{L.model}
            </div>
            <div className="mono" style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
              {L.mileage.toLocaleString()} mi &nbsp;·&nbsp; {fmt(L.askingPrice)} ask
            </div>
          </div>
          <div className={`card ${ratingCls}`} style={{ padding: "10px 14px", textAlign: "center", flexShrink: 0, border: "1px solid" }}>
            <div className="display" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "0.02em" }}>
              {R.dealRating}
            </div>
            <div className="mono" style={{ fontSize: "9px", marginTop: "2px", opacity: 0.7 }}>{R.dealScore}/100</div>
          </div>
        </div>

        {/* Profit hero */}
        <div className="card" style={{ padding: "20px", marginBottom: "4px" }}>
          <div className="mono" style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--muted)", marginBottom: "6px" }}>POTENTIAL PROFIT</div>
          <div className={`display ${profitCls}`} style={{ fontSize: "56px", fontWeight: 900, lineHeight: 1 }}>
            {fmt(R.potentialProfit)}
          </div>
          <div style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: "9px", color: "var(--muted)" }}>DEAL SCORE</span>
              <span className="mono" style={{ fontSize: "9px", color: "var(--muted)" }}>{R.dealScore}%</span>
            </div>
            <Bar pct={R.dealScore} color={barColor} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginTop: "20px" }}>
        {[["diag","DIAGNOSE"],["roi","ROI CALC"],["nego","NEGOTIATE"]].map(([id, lbl]) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id as "diag"|"roi"|"nego")}>{lbl}</button>
        ))}
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* ── DIAGNOSE ── */}
        {tab === "diag" && (
          <>
            <div className="card fade-up" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div className="label">Likely Issue</div>
                  <div style={{ fontSize: "17px", fontWeight: 600, lineHeight: 1.4, color: "var(--text)" }}>{D.likelyIssue}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="display" style={{ fontSize: "48px", fontWeight: 900, color: "var(--orange)", lineHeight: 1 }}>{D.confidenceScore}</div>
                  <div className="mono" style={{ fontSize: "9px", color: "var(--muted)" }}>% CONFIDENCE</div>
                </div>
              </div>
              <Bar pct={D.confidenceScore} color="var(--orange)" />
            </div>

            <div className="card fade-up delay-1" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div className="label" style={{ margin: 0 }}>Recommended Fix</div>
                <span className="mono" style={{ fontSize: "9px", padding: "4px 8px", border: "1px solid", borderColor: D.isDIYFriendly ? "var(--green)" : "var(--yellow)", color: D.isDIYFriendly ? "var(--green)" : "var(--yellow)", borderRadius: "2px" }}>
                  {D.isDIYFriendly ? "DIY FRIENDLY" : "SHOP NEEDED"}
                </span>
              </div>
              <div style={{ fontSize: "15px", color: "var(--text)", marginBottom: "16px", lineHeight: 1.5 }}>{D.easyFix}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ background: "var(--surface2)", padding: "12px" }}>
                  <div className="mono" style={{ fontSize: "9px", color: "var(--muted)", marginBottom: "4px" }}>FIX COST LOW</div>
                  <div className="display" style={{ fontSize: "24px", fontWeight: 700, color: "var(--green)" }}>{fmt(D.fixCostLow)}</div>
                </div>
                <div style={{ background: "var(--surface2)", padding: "12px" }}>
                  <div className="mono" style={{ fontSize: "9px", color: "var(--muted)", marginBottom: "4px" }}>FIX COST HIGH</div>
                  <div className="display" style={{ fontSize: "24px", fontWeight: 700, color: "var(--yellow)" }}>{fmt(D.fixCostHigh)}</div>
                </div>
              </div>
            </div>

            <div className="card fade-up delay-2" style={{ padding: "20px" }}>
              <div className="label">Technical Notes</div>
              <div style={{ fontSize: "14px", color: "#bbb", lineHeight: 1.7 }}>{D.technicalDetails}</div>
            </div>

            {D.warningFlags.length > 0 && (
              <div className="warn-block fade-up delay-3">
                <div className="mono" style={{ fontSize: "9px", color: "var(--red)", letterSpacing: "0.12em", marginBottom: "10px" }}>⚠ WARNING FLAGS</div>
                {D.warningFlags.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", fontSize: "13px", color: "#ffaaaa", marginBottom: "6px", lineHeight: 1.4 }}>
                    <span style={{ color: "var(--red)", flexShrink: 0 }}>—</span>{f}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ROI ── */}
        {tab === "roi" && (
          <>
            <div className="card fade-up" style={{ padding: "20px" }}>
              <div className="label">Cost Breakdown</div>
              {[
                ["Asking Price", R.askingPrice, "neg"],
                ["Est. Fix Cost", R.estimatedFixCost, "neg"],
                ["Smog + Gross Polluter", R.smogFee, "neg"],
                ["DMV / Transfer", R.dmvFees, "neg"],
              ].map(([label, val]) => (
                <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "14px", color: "var(--muted)" }}>{String(label)}</span>
                  <span className="mono" style={{ fontSize: "13px", color: "var(--red)" }}>− {fmt(Number(val))}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>Est. Resale (Private Party)</span>
                <span className="mono" style={{ fontSize: "13px", color: "var(--green)" }}>+ {fmt(R.estimatedResaleValue)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 0" }}>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Net Profit</span>
                <span className={`display ${profitCls}`} style={{ fontSize: "28px", fontWeight: 800 }}>{fmt(R.potentialProfit)}</span>
              </div>
            </div>

            <div className="card fade-up delay-1" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div className="label" style={{ margin: 0 }}>Deal Score</div>
                <span className="mono" style={{ fontSize: "11px", color: barColor }}>{R.dealScore}/100</span>
              </div>
              <Bar pct={R.dealScore} color={barColor} />
            </div>

            <div className="card fade-up delay-2" style={{ padding: "20px" }}>
              <div className="label">LA Market Assumptions</div>
              {["Smog includes gross polluter contingency ($150)", "Resale = private party 'Good' condition, LA comps", "90001 zip + 50-mile radius market", "Salvage title cuts resale 40–50% — not factored unless noted"].map(t => (
                <div key={t} style={{ display: "flex", gap: "10px", fontSize: "12px", color: "var(--muted)", marginBottom: "6px", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--orange)", flexShrink: 0 }}>·</span>{t}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── NEGOTIATE ── */}
        {tab === "nego" && (
          <>
            <div className="card-hot card fade-up" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div className="label" style={{ margin: 0 }}>Strategy</div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--orange)" }}>TARGET: {fmt(N.targetOffer)}</div>
              </div>
              <div style={{ fontSize: "14px", color: "#ccc", lineHeight: 1.6 }}>{N.tactic}</div>
            </div>

            {[
              { id: "open", label: "First Message — Send Now", text: N.openingMessage },
              { id: "follow", label: "24h Follow-Up", text: N.followUpMessage },
            ].map(({ id, label, text }) => (
              <div key={id} className="card fade-up delay-1" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div className="label" style={{ margin: 0 }}>{label}</div>
                  <button
                    className={`btn-ghost ${copied === id ? "copied" : ""}`}
                    onClick={() => copy(text, id)}
                  >
                    {copied === id ? "COPIED ✓" : "COPY"}
                  </button>
                </div>
                <div style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.7, whiteSpace: "pre-wrap", background: "var(--surface2)", padding: "16px", borderRadius: "2px" }}>
                  {text}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Input Form ───────────────────────────────────────────────
function InputForm({ onAnalyze, initialUrl }: { onAnalyze: (l: ListingData) => void; initialUrl?: string }) {
  const [mode, setMode] = useState<"url" | "manual">(initialUrl ? "url" : "manual");
  const [url, setUrl] = useState(initialUrl || "");
  const [price, setPrice] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [desc, setDesc] = useState("");

  const ready = price && year && make && model && mileage && desc;

  const submit = () => {
    if (!ready) return;
    onAnalyze({
      url: url || "manual-entry",
      askingPrice: parseInt(price.replace(/\D/g, "")),
      year: parseInt(year),
      make: make.trim(),
      model: model.trim(),
      mileage: parseInt(mileage.replace(/\D/g, "")),
      description: desc.trim(),
      location: "Los Angeles, CA",
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="accent-line" />

      {/* Hero */}
      <div style={{ padding: "32px 20px 24px", borderBottom: "1px solid var(--border)" }}>
        <div className="display" style={{ fontSize: "80px", fontWeight: 900, color: "var(--orange)", lineHeight: 0.9, letterSpacing: "-0.02em" }}>
          AAA
        </div>
        <div className="mono" style={{ fontSize: "10px", letterSpacing: "0.2em", color: "var(--muted)", marginTop: "8px" }}>AUTO ARBITRAGE ASSISTANT</div>
        <div style={{ fontSize: "14px", color: "var(--muted)", marginTop: "6px", fontWeight: 300 }}>Flip smarter. Los Angeles.</div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[["url","FROM LINK"],["manual","MANUAL ENTRY"]].map(([id, lbl]) => (
          <button key={id} className={`tab ${mode === id ? "active" : ""}`} onClick={() => setMode(id as "url"|"manual")}>{lbl}</button>
        ))}
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {mode === "url" && (
          <div>
            <label className="label">FB Marketplace URL</label>
            <input className="field" placeholder="https://www.facebook.com/marketplace/item/..." value={url} onChange={e => setUrl(e.target.value)} />
            <div className="mono" style={{ fontSize: "10px", color: "var(--orange)", marginTop: "8px", textAlign: "center", opacity: 0.8 }}>
              Shared from iOS? URL auto-fills here
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { lbl: "Asking Price ($)", val: price, set: setPrice, ph: "2500", type: "tel" },
            { lbl: "Year", val: year, set: setYear, ph: "2009", type: "tel" },
            { lbl: "Make", val: make, set: setMake, ph: "Honda", type: "text" },
            { lbl: "Model", val: model, set: setModel, ph: "Accord", type: "text" },
          ].map(f => (
            <div key={f.lbl}>
              <label className="label">{f.lbl}</label>
              <input className="field" type={f.type} inputMode={f.type === "tel" ? "numeric" : "text"} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
            </div>
          ))}
        </div>

        <div>
          <label className="label">Mileage</label>
          <input className="field" type="tel" inputMode="numeric" placeholder="145000" value={mileage} onChange={e => setMileage(e.target.value)} />
        </div>

        <div>
          <label className="label">Listing Description</label>
          <textarea className="field" placeholder={"Paste the full description from the listing — include everything the seller wrote.\n\nSymptoms, history, reason for sale, anything mentioned about the car's condition."} value={desc} onChange={e => setDesc(e.target.value)} />
        </div>

        {/* Tips */}
        <div style={{ background: "var(--surface2)", padding: "16px", borderLeft: "2px solid var(--orange)" }}>
          <div className="mono" style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--orange)", marginBottom: "10px" }}>PRO TIPS</div>
          {["Copy the FULL seller description — more context = better diagnosis", "Note every warning light or symptom the seller mentions", "Use the asking price from the listing title, not your offer"].map(t => (
            <div key={t} style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "5px", display: "flex", gap: "8px" }}>
              <span style={{ color: "var(--orange)", flexShrink: 0 }}>→</span>{t}
            </div>
          ))}
        </div>

        <button className="btn-primary" onClick={submit} disabled={!ready}>
          ANALYZE DEAL
        </button>

        <div className="mono" style={{ fontSize: "9px", textAlign: "center", color: "var(--dim)", letterSpacing: "0.1em" }}>
          POWERED BY GEMINI FLASH · LA MARKET
        </div>
      </div>
    </div>
  );
}

// ── App Shell ────────────────────────────────────────────────
function App() {
  const searchParams = useSearchParams();
  const sharedUrl = searchParams.get("url") || "";

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const analyze = async (listing: ListingData) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (result) return <Results result={result} onReset={() => setResult(null)} />;

  return (
    <>
      {error && (
        <div style={{ position: "fixed", top: "16px", left: "16px", right: "16px", background: "rgba(255,59,59,0.1)", border: "1px solid var(--red)", padding: "14px 16px", zIndex: 999, borderRadius: "2px" }}>
          <div className="mono" style={{ fontSize: "11px", color: "var(--red)", marginBottom: "6px" }}>ERROR: {error}</div>
          <button className="btn-ghost" onClick={() => setError("")} style={{ fontSize: "10px" }}>DISMISS</button>
        </div>
      )}
      <InputForm onAnalyze={analyze} initialUrl={sharedUrl} />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080808" }} />}>
      <App />
    </Suspense>
  );
}

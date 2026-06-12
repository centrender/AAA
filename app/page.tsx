"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
}

interface Result {
  listing: { askingPrice: number; year: number; make: string; model: string; mileage: number; description: string; location: string; };
  market?: { marketValueLow: number; marketValueTypical: number; marketValueHigh: number; valueBasis: string; isClassicOrCollector: boolean; demandNote: string; };
  diagnostic: { likelyIssue: string; confidenceScore: number; easyFix: string; fixCostLow: number; fixCostHigh: number; isDIYFriendly: boolean; warningFlags: string[]; technicalDetails: string; };
  roi: { askingPrice: number; trueMarketValue?: number; estimatedFixCost: number; smogFee: number; dmvFees: number; estimatedResaleValue: number; potentialProfit: number; dealRating: string; dealScore: number; verdict?: string; daysOnMarket?: number; domLeverage?: string; };
  negotiation: { openingMessage: string; followUpMessage: string; tactic: string; targetOffer: number; };
}

function Loader({ step }: { step: number }) {
  const steps = ["READING LISTING", "EXTRACTING DETAILS", "RUNNING DIAGNOSTICS", "CALCULATING ROI", "DRAFTING NEGOTIATION"];
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "40px" }}>
      <div style={{ textAlign: "center" }}>
        <div className="display" style={{ fontSize: "72px", fontWeight: 900, color: "var(--orange)", lineHeight: 1 }}>AAA</div>
        <div className="mono" style={{ fontSize: "10px", letterSpacing: "0.2em", color: "var(--muted)", marginTop: "4px" }}>WORKING</div>
      </div>
      <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: i < step ? "var(--green)" : i === step ? "var(--orange)" : "var(--dim)", transition: "background 0.3s" }} />
            <span className="mono" style={{ fontSize: "10px", letterSpacing: "0.07em", color: i < step ? "var(--muted)" : i === step ? "var(--orange)" : "var(--dim)" }}>{s}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}><span className="dot dot-1" /><span className="dot dot-2" /><span className="dot dot-3" /></div>
    </div>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 100); return () => clearTimeout(t); }, [pct]);
  return <div style={{ height: "3px", background: "var(--surface2)", marginTop: "8px" }}><div style={{ height: "100%", background: color, width: `${w}%`, transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)" }} /></div>;
}

function Results({ r, onReset }: { r: Result; onReset: () => void }) {
  const [tab, setTab] = useState<"diag" | "roi" | "nego">("diag");
  const [copied, setCopied] = useState<string | null>(null);
  const { listing: L, diagnostic: D, roi: R, negotiation: N } = r;

  const rStyle: Record<string, React.CSSProperties> = {
    PASS: { color: "var(--green)", borderColor: "var(--green)", background: "rgba(0,232,122,0.06)" },
    MAYBE: { color: "var(--yellow)", borderColor: "var(--yellow)", background: "rgba(255,184,0,0.06)" },
    SKIP: { color: "var(--red)", borderColor: "var(--red)", background: "rgba(255,59,59,0.06)" },
  };
  const ratingStyle = rStyle[R.dealRating] || {};
  const barColor = R.dealScore >= 70 ? "var(--green)" : R.dealScore >= 45 ? "var(--yellow)" : "var(--red)";
  const profitColor = R.potentialProfit >= 0 ? "var(--green)" : "var(--red)";

  const copy = (t: string, id: string) => navigator.clipboard.writeText(t).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000); });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "48px" }}>
      <div className="accent-line" />
      <div style={{ padding: "16px 20px 0" }}>
        <button className="btn-ghost" onClick={onReset} style={{ marginBottom: "20px" }}>← NEW LISTING</button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
          <div>
            <div className="display" style={{ fontSize: "32px", fontWeight: 800, lineHeight: 1.1 }}>{L.year} {L.make}<br />{L.model}</div>
            <div className="mono" style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>{(L.mileage || 0).toLocaleString()} mi · {fmt(L.askingPrice)} ask</div>
            {R.daysOnMarket && R.daysOnMarket > 0 ? (
              <div style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "2px", background: R.daysOnMarket >= 22 ? "rgba(0,232,122,0.08)" : R.daysOnMarket >= 8 ? "rgba(255,184,0,0.08)" : "var(--surface2)", border: `1px solid ${R.daysOnMarket >= 22 ? "var(--green)" : R.daysOnMarket >= 8 ? "var(--yellow)" : "var(--border)"}` }}>
                <span className="mono" style={{ fontSize: "10px", fontWeight: 600, color: R.daysOnMarket >= 22 ? "var(--green)" : R.daysOnMarket >= 8 ? "var(--yellow)" : "var(--muted)" }}>
                  {R.daysOnMarket}D ON MARKET
                </span>
                {R.domLeverage && <span className="mono" style={{ fontSize: "10px", color: "var(--muted)" }}>· {R.domLeverage}</span>}
              </div>
            ) : null}
          </div>
          <div style={{ padding: "10px 14px", border: "1px solid", borderRadius: "2px", textAlign: "center", flexShrink: 0, ...ratingStyle }}>
            <div className="display" style={{ fontSize: "26px", fontWeight: 900 }}>{R.dealRating}</div>
            <div className="mono" style={{ fontSize: "9px", marginTop: "2px", opacity: 0.7 }}>{R.dealScore}/100</div>
          </div>
        </div>
        <div className="card" style={{ padding: "20px", marginBottom: "4px" }}>
          <div className="mono" style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--muted)", marginBottom: "6px" }}>POTENTIAL PROFIT</div>
          <div className="display" style={{ fontSize: "52px", fontWeight: 900, lineHeight: 1, color: profitColor }}>{fmt(R.potentialProfit)}</div>
          <div style={{ marginTop: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: "9px", color: "var(--muted)" }}>DEAL SCORE</span>
              <span className="mono" style={{ fontSize: "9px", color: "var(--muted)" }}>{R.dealScore}/100</span>
            </div>
            <Bar pct={R.dealScore} color={barColor} />
          </div>
        </div>
        {R.verdict && (
          <div style={{ marginTop: "8px", padding: "12px 16px", background: "var(--surface2)", borderLeft: `2px solid ${profitColor}`, borderRadius: "2px" }}>
            <div className="mono" style={{ fontSize: "9px", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: "4px" }}>THE VERDICT</div>
            <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.5 }}>{R.verdict}</div>
          </div>
        )}
      </div>

      <div className="tabs" style={{ marginTop: "20px" }}>
        {(["diag", "roi", "nego"] as const).map((id, i) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{["DIAGNOSE", "ROI CALC", "NEGOTIATE"][i]}</button>
        ))}
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {tab === "diag" && (
          <>
            <div className="card fade-up" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div className="label">Likely Issue</div>
                  <div style={{ fontSize: "16px", fontWeight: 600, lineHeight: 1.4 }}>{D.likelyIssue}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="display" style={{ fontSize: "46px", fontWeight: 900, color: "var(--orange)", lineHeight: 1 }}>{D.confidenceScore}</div>
                  <div className="mono" style={{ fontSize: "9px", color: "var(--muted)" }}>% CONFIDENT</div>
                </div>
              </div>
              <Bar pct={D.confidenceScore} color="var(--orange)" />
            </div>
            <div className="card fade-up delay-1" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div className="label" style={{ margin: 0 }}>Recommended Fix</div>
                <span className="mono" style={{ fontSize: "9px", padding: "4px 8px", border: "1px solid", borderRadius: "2px", borderColor: D.isDIYFriendly ? "var(--green)" : "var(--yellow)", color: D.isDIYFriendly ? "var(--green)" : "var(--yellow)" }}>{D.isDIYFriendly ? "DIY FRIENDLY" : "SHOP NEEDED"}</span>
              </div>
              <div style={{ fontSize: "14px", lineHeight: 1.6, marginBottom: "16px", color: "#ddd" }}>{D.easyFix}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ background: "var(--surface2)", padding: "12px" }}>
                  <div className="mono" style={{ fontSize: "9px", color: "var(--muted)", marginBottom: "4px" }}>LOW EST.</div>
                  <div className="display" style={{ fontSize: "22px", fontWeight: 700, color: "var(--green)" }}>{fmt(D.fixCostLow)}</div>
                </div>
                <div style={{ background: "var(--surface2)", padding: "12px" }}>
                  <div className="mono" style={{ fontSize: "9px", color: "var(--muted)", marginBottom: "4px" }}>HIGH EST.</div>
                  <div className="display" style={{ fontSize: "22px", fontWeight: 700, color: "var(--yellow)" }}>{fmt(D.fixCostHigh)}</div>
                </div>
              </div>
            </div>
            <div className="card fade-up delay-2" style={{ padding: "20px" }}>
              <div className="label">Technical Notes</div>
              <div style={{ fontSize: "13px", color: "#bbb", lineHeight: 1.7 }}>{D.technicalDetails}</div>
            </div>
            {D.warningFlags?.length > 0 && (
              <div className="fade-up delay-3" style={{ background: "rgba(255,59,59,0.05)", borderLeft: "2px solid var(--red)", padding: "14px 16px" }}>
                <div className="mono" style={{ fontSize: "9px", color: "var(--red)", letterSpacing: "0.12em", marginBottom: "10px" }}>⚠ WARNING FLAGS</div>
                {D.warningFlags.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", fontSize: "13px", color: "#ffaaaa", marginBottom: "6px", lineHeight: 1.4 }}><span style={{ color: "var(--red)", flexShrink: 0 }}>—</span>{f}</div>
                ))}
              </div>
            )}
          </>
        )}
        {tab === "roi" && (
          <>
            {r.market && (
              <div className="card fade-up" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div className="label" style={{ margin: 0 }}>Real Market Value</div>
                  <span className="mono" style={{ fontSize: "9px", padding: "3px 7px", border: "1px solid var(--border)", borderRadius: "2px", color: "var(--muted)" }}>SOLD COMPS · NOT ASKING</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                  {[["LOW", r.market.marketValueLow, "var(--muted)"], ["TYPICAL", r.market.marketValueTypical, "var(--orange)"], ["HIGH", r.market.marketValueHigh, "var(--muted)"]].map(([l, val, c]) => (
                    <div key={String(l)} style={{ background: "var(--surface2)", padding: "10px", textAlign: "center" }}>
                      <div className="mono" style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "3px" }}>{String(l)}</div>
                      <div className="display" style={{ fontSize: "20px", fontWeight: 700, color: c as string }}>{fmt(Number(val))}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--border)" }}>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--muted)" }}>SELLER ASKING</span>
                  <span className="mono" style={{ fontSize: "11px", color: R.askingPrice > r.market.marketValueTypical ? "var(--red)" : "var(--green)" }}>
                    {fmt(R.askingPrice)} {R.askingPrice > r.market.marketValueTypical ? "▲ OVER MARKET" : "▼ under market"}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5, marginTop: "8px" }}>{r.market.valueBasis}</div>
                {r.market.demandNote && <div style={{ fontSize: "12px", color: "#999", lineHeight: 1.5, marginTop: "6px" }}>Liquidity: {r.market.demandNote}</div>}
              </div>
            )}
            <div className="card fade-up delay-1" style={{ padding: "20px" }}>
              <div className="label">Cost Breakdown</div>
              {[["Your Target Offer", N.targetOffer], ["Est. Fix Cost", R.estimatedFixCost], ["Smog + Gross Polluter Risk", R.smogFee], ["DMV / Transfer Fees", R.dmvFees]].map(([l, v]) => (
                <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "14px", color: "var(--muted)" }}>{String(l)}</span>
                  <span className="mono" style={{ fontSize: "13px", color: "var(--red)" }}>− {fmt(Number(v))}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>Est. Resale (Private Party, LA)</span>
                <span className="mono" style={{ fontSize: "13px", color: "var(--green)" }}>+ {fmt(R.estimatedResaleValue)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 0", alignItems: "center" }}>
                <span style={{ fontSize: "15px", fontWeight: 600 }}>Net Profit</span>
                <span className="display" style={{ fontSize: "28px", fontWeight: 800, color: profitColor }}>{fmt(R.potentialProfit)}</span>
              </div>
            </div>
            <div className="card fade-up delay-1" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div className="label" style={{ margin: 0 }}>Deal Score</div>
                <span className="mono" style={{ fontSize: "11px", color: barColor }}>{R.dealScore}/100</span>
              </div>
              <Bar pct={R.dealScore} color={barColor} />
            </div>
          </>
        )}
        {tab === "nego" && (
          <>
            <div style={{ background: "var(--surface)", border: "1px solid var(--orange)", borderRadius: "2px", padding: "20px" }} className="fade-up">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <div className="label" style={{ margin: 0 }}>Strategy</div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--orange)" }}>TARGET {fmt(N.targetOffer)}</div>
              </div>
              <div style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.6 }}>{N.tactic}</div>
            </div>
            {[{ id: "open", label: "First Message", sub: "Send this now", t: N.openingMessage }, { id: "follow", label: "24h Follow-Up", sub: "If no response", t: N.followUpMessage }].map(({ id, label, sub, t }) => (
              <div key={id} className="card fade-up delay-1" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <div className="label" style={{ margin: 0 }}>{label}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{sub}</div>
                  </div>
                  <button className={`btn-ghost ${copied === id ? "copied" : ""}`} onClick={() => copy(t, id)} style={{ flexShrink: 0 }}>{copied === id ? "COPIED ✓" : "COPY"}</button>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.7, whiteSpace: "pre-wrap", background: "var(--surface2)", padding: "14px", borderRadius: "2px" }}>{t}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const searchParams = useSearchParams();
  const shared = searchParams.get("url") || searchParams.get("text") || "";

  const [raw, setRaw] = useState(shared);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (raw.trim().length < 15) { setError("Paste a full listing first"); return; }
    setLoading(true); setStep(0); setError("");
    const interval = setInterval(() => setStep(s => Math.min(s + 1, 4)), 1400);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawListing: raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  if (loading) return <Loader step={step} />;
  if (result) return <Results r={result} onReset={() => { setResult(null); setRaw(""); }} />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="accent-line" />
      {error && (
        <div style={{ margin: "16px 20px 0", background: "rgba(255,59,59,0.1)", border: "1px solid var(--red)", padding: "14px 16px", borderRadius: "2px" }}>
          <div className="mono" style={{ fontSize: "11px", color: "var(--red)" }}>ERROR: {error}</div>
        </div>
      )}

      <div style={{ padding: "32px 20px 20px" }}>
        <div className="display" style={{ fontSize: "80px", fontWeight: 900, color: "var(--orange)", lineHeight: 0.9 }}>AAA</div>
        <div className="mono" style={{ fontSize: "10px", letterSpacing: "0.2em", color: "var(--muted)", marginTop: "8px" }}>AUTO ARBITRAGE ASSISTANT</div>
        <div style={{ fontSize: "14px", color: "var(--muted)", marginTop: "6px", fontWeight: 300 }}>Flip smarter. Los Angeles.</div>
      </div>

      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label className="label">Paste The Whole Listing</label>
          <textarea
            className="field"
            style={{ minHeight: "260px", fontSize: "15px" }}
            placeholder={"Select everything on the FB Marketplace listing page, copy it, paste here.\n\nTitle, price, year, mileage, the full seller description — all of it in one shot.\n\nExample:\n2009 Honda Accord EX-L\n$4,200\nDriven 142,000 miles\nCheck engine light is on, runs but shifts rough sometimes. Selling as-is, smog due..."}
            value={raw}
            onChange={e => setRaw(e.target.value)}
            autoFocus
          />
          <div className="mono" style={{ fontSize: "10px", color: "var(--muted)", marginTop: "8px", lineHeight: 1.5 }}>
            AI reads the whole thing and pulls out year, make, model, price, mileage, and problems automatically. No typing fields.
          </div>
        </div>

        <button className="btn-primary" onClick={analyze} disabled={raw.trim().length < 15}>ANALYZE DEAL</button>

        {raw.length > 0 && (
          <button className="btn-ghost" onClick={() => setRaw("")} style={{ alignSelf: "center" }}>CLEAR</button>
        )}

        <div className="mono" style={{ fontSize: "9px", textAlign: "center", color: "var(--dim)", letterSpacing: "0.1em", marginTop: "8px" }}>POWERED BY GEMINI · LA MARKET DATA</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080808" }} />}>
      <App />
    </Suspense>
  );
}

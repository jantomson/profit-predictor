import { useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Geo {
  id: string;
  label: string;
  cpm: number;
}

interface Offer {
  id: string;
  name: string;
  payout: number;
  cvr: number;
  cpm: number;
  adCtr: number;
  lpCtr: number;
  impressions: number;
  geos: Geo[];
}

interface Metrics {
  clicks: number;
  adSpend: number;
  cpc: number;
  lpVisits: number;
  purchases: number;
  revenue: number;
  profit: number;
  roi: number;
  cpa: number;
  epc: number;
}

interface Signal {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}

type TabId = "single" | "compare" | "geo";

// ── Helpers ───────────────────────────────────────────────────────────────────

const uid = (): string => Math.random().toString(36).slice(2);

const mkOffer = (name = "New Offer", overrides: Partial<Offer> = {}): Offer => ({
  id: uid(),
  name,
  payout: 50,
  cvr: 4,
  cpm: 60,
  adCtr: 8,
  lpCtr: 50,
  impressions: 50000,
  geos: [
    { id: uid(), label: "US", cpm: 60 },
    { id: uid(), label: "UK", cpm: 40 },
    { id: uid(), label: "AU", cpm: 45 },
  ],
  ...overrides,
});

function calcM(o: Offer, cpmOvr?: number): Metrics {
  const cpm = cpmOvr ?? o.cpm;
  const clicks = o.impressions * (o.adCtr / 100);
  const adSpend = (o.impressions / 1000) * cpm;
  const cpc = clicks > 0 ? adSpend / clicks : 0;
  const lpVisits = clicks * (o.lpCtr / 100);
  const purchases = lpVisits * (o.cvr / 100);
  const revenue = purchases * o.payout;
  const profit = revenue - adSpend;
  const roi = adSpend > 0 ? (profit / adSpend) * 100 : 0;
  const cpa = purchases > 0 ? adSpend / purchases : 0;
  const epc = clicks > 0 ? revenue / clicks : 0;
  return { clicks, adSpend, cpc, lpVisits, purchases, revenue, profit, roi, cpa, epc };
}

function sig(roi: number): Signal {
  if (roi >= 40) return { label: "YES", icon: "✓", color: "#00e676", bg: "#071a0f", border: "#00e676" };
  if (roi >= -10) return { label: "MAYBE", icon: "⚠", color: "#ffc107", bg: "#1a1500", border: "#ffc107" };
  return { label: "NO", icon: "✕", color: "#ff1744", bg: "#1a0505", border: "#ff1744" };
}

const $f = (n: number): string =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const nf = (n: number): string => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const pf = (n: number): string => `${n.toFixed(1)}%`;

// ── Components ────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  pre?: string;
  suf?: string;
  step?: number;
}

function Field({ label, value, onChange, pre, suf, step = 1 }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 10, color: "#888", letterSpacing: "0.09em", fontWeight: 600, textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", background: "#1e1e28", border: "1px solid #2c2c3a", borderRadius: 7, overflow: "hidden" }}>
        {pre && (
          <span style={{ padding: "0 10px", color: "#555", fontSize: 13, borderRight: "1px solid #262630" }}>
            {pre}
          </span>
        )}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e8eaf8", fontSize: 16, fontWeight: 500, padding: "10px 12px", fontFamily: "inherit", minWidth: 0 }}
        />
        {suf && (
          <span style={{ padding: "0 10px", color: "#555", fontSize: 13, borderLeft: "1px solid #262630" }}>
            {suf}
          </span>
        )}
      </div>
    </div>
  );
}

interface CardProps {
  offer: Offer;
  onChange: (o: Offer) => void;
  onRemove: (() => void) | null;
  isBest: boolean;
}

function Card({ offer, onChange, onRemove, isBest }: CardProps) {
  const m = calcM(offer);
  const s = sig(m.roi);
  const u = (k: keyof Offer) => (v: number) => onChange({ ...offer, [k]: v });

  type StatRow = [string, string, string];
  const statRows: StatRow[][] = [
    [["Profit", m.profit < 0 ? "-" + $f(m.profit) : $f(m.profit), m.profit >= 0 ? "#00e676" : "#ff4444"], ["ROI", pf(m.roi), "#eeeef8"]],
    [["Revenue", $f(m.revenue), "#aab0cc"], ["Ad Spend", $f(m.adSpend), "#ff8a65"]],
    [["Purchases", nf(m.purchases), "#aab0cc"], ["CPA", $f(m.cpa), "#aab0cc"]],
    [["Clicks", nf(m.clicks), "#666"], ["EPC", $f(m.epc), "#666"]],
  ];

  return (
    <div style={{
      background: "#14141e",
      border: `2px solid ${isBest ? s.color : "#242430"}`,
      borderRadius: 16,
      overflow: "hidden",
      flex: "1 1 300px",
      maxWidth: 400,
      minWidth: 0,
      boxSizing: "border-box" as const,
      boxShadow: isBest ? `0 0 32px ${s.color}28, 0 8px 32px rgba(0,0,0,0.5)` : "0 8px 32px rgba(0,0,0,0.4)",
      position: "relative" as const,
      transition: "border-color 0.3s, box-shadow 0.3s",
    }}>
      {isBest && (
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", background: s.color, color: "#030a06", fontSize: 10, fontWeight: 800, padding: "3px 16px", borderRadius: "0 0 10px 10px", letterSpacing: "0.18em" }}>
          BEST
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "20px 18px 14px", marginTop: "16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1c1c28" }}>
        <input
          value={offer.name}
          onChange={(e) => onChange({ ...offer, name: e.target.value })}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 18, fontWeight: 700, color: "#eeeef8", fontFamily: "inherit" }}
        />
        {onRemove && (
          <button
            onClick={onRemove}
            style={{ background: "#220f0f", border: "1px solid #3a1515", borderRadius: 8, color: "#ff4444", fontSize: 8, fontWeight: 700, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap"}}
          >
            <span>✕</span> Remove
          </button>
        )}
      </div>

      {/* Inputs */}
      <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
        <Field label="Payout" value={offer.payout} onChange={u("payout")} pre="$" step={5} />
        <Field label="CVR %" value={offer.cvr} onChange={u("cvr")} suf="%" step={0.5} />
        <Field label="CPM" value={offer.cpm} onChange={u("cpm")} pre="$" step={5} />
        <Field label="Ad CTR %" value={offer.adCtr} onChange={u("adCtr")} suf="%" step={0.5} />
        <Field label="LP CTR %" value={offer.lpCtr} onChange={u("lpCtr")} suf="%" step={5} />
        <Field label="Impressions" value={offer.impressions} onChange={u("impressions")} pre="#" step={10000} />
      </div>

      {/* Signal */}
      <div style={{ margin: "0 18px 14px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 9, padding: "11px 18px", textAlign: "center" }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: s.color, letterSpacing: "0.12em" }}>
          {s.icon} {s.label}
        </span>
      </div>

      {/* Stats */}
      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 0 }}>
        {statRows.map((row, ri) => (
          <div key={ri} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: ri > 0 ? "1px solid #1c1c28" : "none" }}>
            {row.map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#555" }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color }}>{val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Geo Tab ───────────────────────────────────────────────────────────────────

interface GeoTabProps {
  offers: Offer[];
  onUpdateOffer: (o: Offer) => void;
}

function GeoTab({ offers, onUpdateOffer }: GeoTabProps) {
  const [selId, setSelId] = useState<string>(offers[0]?.id ?? "");
  const offer = offers.find((o) => o.id === selId) ?? offers[0];

  if (!offer) {
    return <div style={{ color: "#555", padding: 40, textAlign: "center" }}>Add an offer first.</div>;
  }

  const upd = (k: keyof Offer) => (v: number) => onUpdateOffer({ ...offer, [k]: v });
  const addGeo = () => onUpdateOffer({ ...offer, geos: [...offer.geos, { id: uid(), label: "NEW", cpm: 30 }] });
  const remGeo = (id: string) => onUpdateOffer({ ...offer, geos: offer.geos.filter((g) => g.id !== id) });
  const updGeo = (id: string, k: keyof Geo, v: string | number) =>
    onUpdateOffer({ ...offer, geos: offer.geos.map((g) => (g.id === id ? { ...g, [k]: v } : g)) });

  const metrics = offer.geos.map((g) => ({ ...calcM(offer, g.cpm), geo: g }));
  const bestROI = Math.max(...metrics.map((m) => m.roi));

  type GeoStatRow = [string, string, string, boolean];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Offer selector */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#555", letterSpacing: "0.09em" }}>OFFER:</span>
        {offers.map((o) => (
          <button
            key={o.id}
            onClick={() => setSelId(o.id)}
            style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${selId === o.id ? "#00e676" : "#242430"}`, background: selId === o.id ? "rgba(0,230,118,0.08)" : "#14141e", color: selId === o.id ? "#00e676" : "#666", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
          >
            {o.name}
          </button>
        ))}
      </div>

      {/* Shared params */}
      <div style={{ background: "#14141e", border: "1px solid #242430", borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>
          Shared Inputs — same offer, different GEO CPMs
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          <Field label="Payout" value={offer.payout} onChange={upd("payout")} pre="$" step={5} />
          <Field label="CVR %" value={offer.cvr} onChange={upd("cvr")} suf="%" step={0.5} />
          <Field label="Ad CTR %" value={offer.adCtr} onChange={upd("adCtr")} suf="%" step={0.5} />
          <Field label="LP CTR %" value={offer.lpCtr} onChange={upd("lpCtr")} suf="%" step={5} />
          <Field label="Impressions" value={offer.impressions} onChange={upd("impressions")} pre="#" step={10000} />
        </div>
      </div>

      {/* Geo cards */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        {metrics.map((m) => {
          const s = sig(m.roi);
          const isBest = m.roi === bestROI && offer.geos.length > 1;
          const geoStats: GeoStatRow[] = [
            ["ROI", pf(m.roi), s.color, true],
            ["Profit", (m.profit < 0 ? "-" : "") + $f(m.profit), m.profit >= 0 ? "#00e676" : "#ff4444", true],
            ["Revenue", $f(m.revenue), "#aab0cc", false],
            ["Ad Spend", $f(m.adSpend), "#ff8a65", false],
            ["CPA", $f(m.cpa), "#888", false],
            ["EPC", $f(m.epc), "#888", false],
          ];
          return (
            <div
              key={m.geo.id}
              style={{ background: "#14141e", border: `2px solid ${isBest ? s.color : "#242430"}`, borderRadius: 14, padding: 10, minWidth: 190, boxShadow: isBest ? `0 0 28px ${s.color}22` : "none", position: "relative", transition: "border-color 0.3s" }}
            >
              {isBest && (
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", background: s.color, color: "#030a06", fontSize: 9, fontWeight: 800, padding: "2px 14px", borderRadius: "0 0 8px 8px", letterSpacing: "0.18em" }}>
                  BEST ROI
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <input
                  value={m.geo.label}
                  onChange={(e) => updGeo(m.geo.id, "label", e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", fontSize: 17, fontWeight: 700, color: "#eeeef8", fontFamily: "inherit", width: 70 }}
                />
                <button onClick={() => remGeo(m.geo.id)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#ff4444", fontSize: 15, cursor: "pointer" }}>
                  ✕
                </button>
              </div>
              <Field label="CPM" value={m.geo.cpm} onChange={(v) => updGeo(m.geo.id, "cpm", v)} pre="$" step={5} />
              <div style={{ margin: "12px 0 10px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 7, padding: "9px 14px", textAlign: "center" }}>
                <span style={{ color: s.color, fontWeight: 800, fontSize: 16, letterSpacing: "0.12em" }}>
                  {s.icon} {s.label}
                </span>
              </div>
              {geoStats.map(([label, val, color, bold]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid #1c1c28", fontSize: 12 }}>
                  <span style={{ color: "#555" }}>{label}</span>
                  <span style={{ color, fontWeight: bold ? 700 : 500 }}>{val}</span>
                </div>
              ))}
            </div>
          );
        })}
        <button
          onClick={addGeo}
          style={{ minWidth: 190, height: 80, background: "transparent", border: "2px dashed #242430", borderRadius: 14, color: "#333", fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.2s, color 0.2s" }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#666"; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = "#242430"; e.currentTarget.style.color = "#333"; }}
        >
          + Add GEO
        </button>
      </div>

      {/* ROI bar */}
      <div style={{ background: "#14141e", border: "1px solid #242430", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
          ROI Comparison by GEO
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {metrics.map((m) => {
            const s = sig(m.roi);
            const maxAbs = Math.max(...metrics.map((mm) => Math.abs(mm.roi)), 5);
            const w = Math.min((Math.abs(m.roi) / maxAbs) * 100, 100);
            return (
              <div key={m.geo.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 38, fontSize: 12, fontWeight: 700, color: "#aaa", textAlign: "right" }}>
                  {m.geo.label}
                </span>
                <div style={{ flex: 1, height: 28, background: "#0c0c16", borderRadius: 7, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${w}%`, background: s.color, opacity: 0.65, borderRadius: 7, transition: "width 0.35s" }} />
                  <span style={{ position: "absolute", left: 10, top: 0, lineHeight: "28px", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                    {pf(m.roi)}
                  </span>
                </div>
                <span style={{ width: 90, fontSize: 12, color: m.profit >= 0 ? "#00e676" : "#ff4444", fontWeight: 600, textAlign: "right" }}>
                  {m.profit < 0 ? "-" : ""}
                  {$f(m.profit)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

interface SummaryRow {
  label: string;
  fn: (m: Metrics) => string;
  color?: (m: Metrics) => string;
  bold?: boolean;
}

export default function App() {
  const [tab, setTab] = useState<TabId>("compare");
  const [offers, setOffers] = useState<Offer[]>([
    mkOffer("Male Enhancement", { payout: 55, cvr: 4, cpm: 60, adCtr: 8, lpCtr: 50, impressions: 100000 }),
    mkOffer("Prostate Supp", { payout: 150, cvr: 2, cpm: 60, adCtr: 5, lpCtr: 50, impressions: 50000 }),
    mkOffer("Survival Offer", { payout: 80, cvr: 2, cpm: 60, adCtr: 5, lpCtr: 50, impressions: 50000 }),
  ]);

  const addOffer = () => setOffers((p) => [...p, mkOffer(`Offer #${p.length + 1}`)]);
  const remOffer = (id: string) => setOffers((p) => p.filter((o) => o.id !== id));
  const updOffer = useCallback((u: Offer) => setOffers((p) => p.map((o) => (o.id === u.id ? u : o))), []);

  const bestId = [...offers].sort((a, b) => calcM(b).roi - calcM(a).roi)[0]?.id;

  const tabs: { id: TabId; label: string }[] = [
    { id: "single", label: "Single Offer" },
    { id: "compare", label: "Compare Offers" },
    { id: "geo", label: "Geo Comparison" },
  ];

  const summaryRows: SummaryRow[] = [
    { label: "Signal", fn: (m) => `${sig(m.roi).icon} ${sig(m.roi).label}`, color: (m) => sig(m.roi).color, bold: true },
    { label: "ROI %", fn: (m) => pf(m.roi), color: (m) => sig(m.roi).color, bold: true },
    { label: "Profit", fn: (m) => (m.profit < 0 ? "-" : "") + $f(m.profit), color: (m) => (m.profit >= 0 ? "#00e676" : "#ff4444") },
    { label: "Revenue", fn: (m) => $f(m.revenue) },
    { label: "Ad Spend", fn: (m) => $f(m.adSpend), color: () => "#ff8a65" },
    { label: "Purchases", fn: (m) => nf(m.purchases) },
    { label: "CPA", fn: (m) => $f(m.cpa) },
    { label: "EPC", fn: (m) => $f(m.epc) },
    { label: "CPC", fn: (m) => $f(m.cpc) },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e18", color: "#eeeef8", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Nav */}
      <div style={{ padding: "18px 28px", borderBottom: "1px solid #1c1c28", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#eeeef8", letterSpacing: "0.04em" }}>
          💰 Profit Predictor
        </span>
        <div style={{ display: "flex", background: "#161620", border: "1px solid #242430", borderRadius: 10, padding: 4, gap: 3, marginLeft: 16 }}>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ padding: "8px 18px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", background: tab === id ? "#00e676" : "transparent", color: tab === id ? "#071a0f" : "#555", transition: "all 0.15s" }}
            >
              {label}
            </button>
          ))}
        </div>
        {tab !== "single" && (
          <button
            onClick={addOffer}
            style={{ marginLeft: "auto", padding: "9px 22px", borderRadius: 9, background: "#00e676", border: "none", color: "#071a0f", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            + Add Offer
          </button>
        )}
      </div>

      <div style={{ padding: "28px 28px" }}>
        {/* ── Single ── */}
        {tab === "single" && offers[0] && (() => {
          const o = offers[0];
          const m = calcM(o);
          const bevcr = m.cpc > 0 ? (m.cpc / ((o.lpCtr / 100) * o.payout)) * 100 : 0;
          const beCTR = o.payout > 0 ? o.cpm / (10 * o.payout * (o.lpCtr / 100) * (o.cvr / 100)) : 0;
          const maxCPM = m.epc * o.adCtr * 10;
          const breakEvenRows: [string, string][] = [
            ["Min CVR needed", `${bevcr.toFixed(2)}%`],
            ["Min CTR needed", `${beCTR.toFixed(2)}%`],
            ["Max CPM affordable", $f(maxCPM)],
            ["EPC", $f(m.epc)],
            ["CPC", $f(m.cpc)],
            ["CPA", $f(m.cpa)],
            ["LP Visits", nf(m.lpVisits)],
          ];
          return (
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap", minWidth: 0 }}>
              <Card offer={o} onChange={updOffer} onRemove={null} isBest={false} />
              <div style={{ background: "#14141e", border: "1px solid #242430", borderRadius: 14, padding: 20, minWidth: 230 }}>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                  Break-Even Analysis
                </div>
                {breakEvenRows.map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #1c1c28" }}>
                    <span style={{ color: "#555", fontSize: 13 }}>{label}</span>
                    <span style={{ color: "#c8d8ff", fontSize: 13, fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Compare ── */}
        {tab === "compare" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#eeeef8" }}>Compare Multiple Offers</div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start", minWidth: 0 }}>
              {offers.map((o) => (
                <Card
                  key={o.id}
                  offer={o}
                  onChange={updOffer}
                  onRemove={offers.length > 1 ? () => remOffer(o.id) : null}
                  isBest={o.id === bestId}
                />
              ))}
            </div>

            {offers.length > 1 && (
              <div style={{ background: "#14141e", border: "1px solid #242430", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "13px 20px", borderBottom: "1px solid #1c1c28", fontSize: 10, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Side-by-Side Summary
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1c1c28" }}>
                        <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: "#444", letterSpacing: "0.08em", fontWeight: 600 }}>
                          METRIC
                        </th>
                        {offers.map((o) => {
                          const s = sig(calcM(o).roi);
                          return (
                            <th key={o.id} style={{ padding: "10px 20px", textAlign: "center", fontSize: 13, color: s.color, fontWeight: 700 }}>
                              {o.name}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {summaryRows.map((row) => (
                        <tr key={row.label} style={{ borderBottom: "1px solid #191924" }}>
                          <td style={{ padding: "8px 20px", fontSize: 12, color: "#444", letterSpacing: "0.05em" }}>
                            {row.label}
                          </td>
                          {offers.map((o) => {
                            const m = calcM(o);
                            const color = row.color ? row.color(m) : "#c8d8ff";
                            return (
                              <td key={o.id} style={{ padding: "8px 20px", textAlign: "center", fontSize: 13, fontWeight: row.bold ? 700 : 500, color }}>
                                {row.fn(m)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Geo ── */}
        {tab === "geo" && <GeoTab offers={offers} onUpdateOffer={updOffer} />}
      </div>
    </div>
  );
}
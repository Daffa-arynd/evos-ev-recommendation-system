import { useEffect, useRef, useState } from "react";
import RadarChart from "./RadarChart";

const RANK_COLORS = ["var(--accent)", "var(--accent2)", "var(--gold)", "#ec4899", "#06b6d4"];
const EV_ICONS = { Tesla: "⚡", BMW: "🏎️", Porsche: "🏎️", Ferrari: "🏎️", Lamborghini: "🏎️", Rimac: "⚡", Rivian: "🛻", GMC: "🛻", Ford: "🛻", NIO: "🌟", Lucid: "🌟" };
const evIcon = m => EV_ICONS[m] || "🚗";

const CLUSTER_INFO = {
  budget:      { color: "#10b981", label: "Budget Seeker · Cluster A", desc: "Value-oriented: cost-efficient EVs with solid specs per dollar" },
  performance: { color: "#f59e0b", label: "Performance · Cluster B",   desc: "High-spec vehicles with advanced safety and autonomy systems" },
  longrange:   { color: "#7c3aed", label: "Long Range · Cluster C",    desc: "Maximum driving distance per charge with fast-charging capability" },
};

export default function ResultsPanel({ results, loading, error, onToggleCompare, onToggleBookmark, isInCompare, isBookmarked, compareCount }) {
  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;
  if (!results) return null;

  const cluster = CLUSTER_INFO[results.cluster_label] || CLUSTER_INFO.performance;
  const recs    = results.recommendations || [];

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("EVOS — EV Recommendation Report", 20, 20);
    doc.setFontSize(11);
    doc.text(`Cluster: ${results.cluster_label}`, 20, 35);
    doc.text(`Total Evaluated: ${results.total_vehicles_evaluated} vehicles`, 20, 43);
    doc.text(`Processing Time: ${results.processing_time_ms}ms`, 20, 51);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 59);
    doc.line(20, 65, 190, 65);

    let y = 75;
    recs.forEach((rec, i) => {
      const ev = rec.vehicle;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.text(`#${i + 1} ${ev.manufacturer} ${ev.model} (${ev.year})`, 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`Match: ${rec.similarity_pct} | Price: $${ev.price_usd?.toLocaleString()} | Range: ${ev.range_km}km`, 20, y);
      y += 7;
      doc.text(`Battery: ${ev.battery_capacity_kwh}kWh | Safety: ${ev.safety_rating}/5 | Autonomy: L${ev.autonomous_level}`, 20, y);
      y += 7;
      const lines = doc.splitTextToSize(rec.explanation, 170);
      doc.text(lines, 20, y);
      y += lines.length * 6 + 8;
      doc.line(20, y, 190, y);
      y += 8;
    });

    doc.save("EVOS_Recommendations.pdf");
  };

  return (
    <div>
      <div className="label">03 — ML Analysis · Recommendation Output</div>

      {/* Cluster Banner */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 14,
        marginBottom: 20, fontSize: 13,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: cluster.color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ color: "var(--text)", fontWeight: 500 }}>{cluster.label}</span>
          <span style={{ color: "var(--muted)" }}> — {cluster.desc}</span>
        </div>
        <button onClick={handleExportPDF} style={{
          background: "rgba(0,229,255,.1)", border: "1px solid var(--accent)",
          borderRadius: 8, color: "var(--accent)", cursor: "pointer",
          fontFamily: "var(--font-mono)", fontSize: 10,
          padding: "6px 14px", letterSpacing: ".08em", whiteSpace: "nowrap",
        }}>
          📄 Export PDF
        </button>
      </div>

      {/* Stats */}
      <StatsBar results={results} />

      <div className="label" style={{ marginTop: 28 }}>04 — Top {recs.length} Recommendations</div>

      {/* No Results */}
      {recs.length === 0 && (
        <div style={{
          textAlign: "center", padding: "48px 20px",
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 16, marginTop: 16,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 12, color: "var(--muted)" }}>
            NO VEHICLES FOUND
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
            Tidak ada EV yang sesuai dengan preferensi kamu saat ini.
            Coba:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, maxWidth: 300, margin: "16px auto 0" }}>
            {[
              "💰 Naikkan budget maksimal",
              "📍 Turunkan minimum range",
              "🔋 Turunkan minimum battery",
              "🌐 Ganti cluster profile",
            ].map(tip => (
              <div key={tip} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "8px 14px",
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)",
                textAlign: "left",
              }}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards */}
      <div>
        {recs.map((rec, i) => (
          <EVCard
            key={rec.vehicle.vehicle_id}
            rec={rec} index={i}
            onToggleCompare={onToggleCompare}
            onToggleBookmark={onToggleBookmark}
            isInCompare={isInCompare}
            isBookmarked={isBookmarked}
            compareCount={compareCount}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 24, padding: "12px 16px",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", fontFamily: "var(--font-mono)",
        fontSize: 10, color: "var(--muted)",
        display: "flex", gap: 24, flexWrap: "wrap",
      }}>
        <span>⏱ Processing: <strong style={{ color: "var(--accent)" }}>{results.processing_time_ms}ms</strong></span>
        <span>🔍 Evaluated: <strong style={{ color: "var(--text)" }}>{results.total_vehicles_evaluated} vehicles</strong></span>
        <span>🎯 Filtered: <strong style={{ color: "var(--text)" }}>{results.filtered_pool_size} candidates</strong></span>
        <span>🤖 Model: <strong style={{ color: "var(--text)" }}>v{results.model_version}</strong></span>
      </div>
    </div>
  );
}

function StatsBar({ results }) {
  const recs     = results.recommendations || [];
  const avgSim   = recs.reduce((s, r) => s + r.similarity_score, 0) / (recs.length || 1);
  const avgPrice = recs.reduce((s, r) => s + r.vehicle.price_usd, 0) / (recs.length || 1);
  const avgRange = recs.reduce((s, r) => s + r.vehicle.range_km, 0) / (recs.length || 1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 4 }}>
      {[
        { val: recs.length,                          label: "Matches",   color: "var(--accent)"  },
        { val: `${(avgSim * 100).toFixed(1)}%`,      label: "Avg Match", color: "var(--accent)"  },
        { val: `$${Math.round(avgPrice / 1000)}k`,   label: "Avg Price", color: "var(--gold)"    },
        { val: `${Math.round(avgRange)} km`,          label: "Avg Range", color: "var(--accent2)" },
      ].map(s => (
        <div key={s.label} style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", padding: "14px", textAlign: "center",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: s.color }}>{s.val}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function EVCard({ rec, index, onToggleCompare, onToggleBookmark, isInCompare, isBookmarked, compareCount }) {
  const [simAnimated, setSimAnimated] = useState(false);
  const [expanded, setExpanded]       = useState(false);
  const [showWhyNot, setShowWhyNot]   = useState(false);
  const [similar, setSimilar]         = useState(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const color      = RANK_COLORS[index] || "var(--accent)";
  const ev         = rec.vehicle;
  const bookmarked = isBookmarked(ev.vehicle_id);
  const inCompare  = isInCompare(ev.vehicle_id);

  useEffect(() => {
    const t = setTimeout(() => setSimAnimated(true), 150 + index * 100);
    return () => clearTimeout(t);
  }, [index]);

  const handleSimilar = async () => {
    if (similar) { setSimilar(null); return; }
    setLoadingSimilar(true);
    try {
      const { fetchSimilar } = await import("../utils/api");
      const data = await fetchSimilar(ev.vehicle_id, 3);
      setSimilar(data.similar_vehicles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Why NOT = fitur yang lebih BURUK dari preferensi user
const whyNots = rec.explainability?.filter(d => {
    // Hanya tampilkan kalau EV benar-benar lebih buruk dari preferensi
    // DAN selisihnya signifikan (lebih dari 2%)
    if (d.feature === "Price") {
      return d.vehicle_value > d.user_value * 1.02;
    }
    if (d.feature === "Range") {
      return d.vehicle_value < d.user_value * 0.98;
    }
    if (d.feature === "Battery Capacity") {
      return d.vehicle_value < d.user_value * 0.98;
    }
    if (d.feature === "Charge Time") {
      return d.vehicle_value > d.user_value * 1.02;
    }
    if (d.feature === "Safety Rating") {
      return d.vehicle_value < d.user_value;
    }
    if (d.feature === "Autonomy Level") {
      return d.vehicle_value < d.user_value;
    }
    return false;
  }) || [];

// Why YES = fitur yang lebih BAIK atau sesuai preferensi
const whyYes = rec.explainability?.filter(d => {
  if (d.feature === "Price")         return d.vehicle_value <= d.user_value;
  if (d.feature === "Range")         return d.vehicle_value >= d.user_value;
  if (d.feature === "Battery Capacity") return d.vehicle_value >= d.user_value;
  if (d.feature === "Charge Time")   return d.vehicle_value <= d.user_value;
  if (d.feature === "Safety Rating") return d.vehicle_value >= d.user_value;
  if (d.feature === "Autonomy Level") return d.vehicle_value >= d.user_value;
  return false;
}) || [];

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", padding: "20px",
      marginBottom: 14, position: "relative", overflow: "hidden",
      animation: `fadeUp .4s ease ${index * 0.07}s both`,
      transition: "border-color .25s, transform .25s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,229,255,.25)"; e.currentTarget.style.transform = "translateX(3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Left accent */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: "3px 0 0 3px" }} />

      {/* Rank */}
      <div style={{ position: "absolute", top: 12, right: 16, fontFamily: "var(--font-display)", fontSize: 40, color: "var(--border)", lineHeight: 1, userSelect: "none" }}>
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Action Buttons */}
      <div style={{ position: "absolute", top: 14, right: 64, display: "flex", gap: 6 }}>
        <button onClick={() => onToggleBookmark(ev)} title={bookmarked ? "Remove bookmark" : "Save"} style={{
          background: bookmarked ? "rgba(239,68,68,.15)" : "transparent",
          border: `1px solid ${bookmarked ? "#ef4444" : "var(--border)"}`,
          borderRadius: 6, fontSize: 14, cursor: "pointer",
          padding: "3px 7px", color: bookmarked ? "#ef4444" : "var(--muted)",
          transition: "all .2s",
        }}>
          {bookmarked ? "❤️" : "🤍"}
        </button>
        <button
          onClick={() => onToggleCompare(ev)}
          disabled={!inCompare && compareCount >= 3}
          title={inCompare ? "Remove from compare" : compareCount >= 3 ? "Max 3 EVs" : "Add to compare"}
          style={{
            background: inCompare ? "rgba(245,158,11,.15)" : "transparent",
            border: `1px solid ${inCompare ? "var(--gold)" : "var(--border)"}`,
            borderRadius: 6, fontSize: 12, cursor: "pointer",
            padding: "3px 7px", color: inCompare ? "var(--gold)" : "var(--muted)",
            opacity: !inCompare && compareCount >= 3 ? .4 : 1,
            transition: "all .2s",
          }}
        >
          ⚖️
        </button>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
        <div style={{ width: 50, height: 50, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, rgba(0,229,255,.12), rgba(124,58,237,.12))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
          {evIcon(ev.manufacturer)}
        </div>
        <div style={{ flex: 1, paddingRight: 100 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 2 }}>{ev.manufacturer}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: ".04em", lineHeight: 1.1 }}>{ev.model}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{ev.year} · {ev.color}</div>
        </div>
      </div>

      {/* Similarity Bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 5 }}>
          <span>Cosine Similarity Score</span>
          <span style={{ fontSize: 13, fontWeight: 600, color }}>{(rec.similarity_score * 100).toFixed(1)}% match</span>
        </div>
        <div style={{ background: "var(--surface)", borderRadius: 4, height: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, width: simAnimated ? `${rec.similarity_score * 100}%` : "0%", background: `linear-gradient(90deg, ${color}, var(--accent2))`, transition: "width 1.1s cubic-bezier(.4,0,.2,1)" }} />
        </div>
      </div>

      {/* Specs + Radar Chart */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>

        {/* Radar Chart */}
        <div style={{ flexShrink: 0 }}>
          <RadarChart explainability={rec.explainability} color={color} />
        </div>

        {/* Specs Grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            { val: ev.range_km,              unit: "km range"    },
            { val: ev.battery_capacity_kwh,  unit: "kWh battery" },
            { val: ev.charge_time_hr,        unit: "hr charge"   },
            { val: `${ev.safety_rating}/5`,  unit: "safety"      },
            { val: `L${ev.autonomous_level}`,unit: "autonomy"    },
            { val: `${ev.warranty_years}yr`, unit: "warranty"    },
          ].map((s, i) => (
            <div key={i} style={{
              background: "var(--surface)", borderRadius: "var(--radius-sm)",
              padding: "8px 6px", textAlign: "center",
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{s.val}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", textTransform: "uppercase", marginTop: 2 }}>{s.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why YES */}
      <div style={{ background: "rgba(0,229,255,.05)", border: "1px solid rgba(0,229,255,.15)", borderRadius: "var(--radius-sm)", padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>🧠</span>
        <div style={{ fontSize: 12, color: "rgba(226,232,240,.75)", lineHeight: 1.6, fontStyle: "italic" }}>{rec.explanation}</div>
      </div>

      {/* Why NOT */}
      {whyNots.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setShowWhyNot(s => !s)} style={{
            background: showWhyNot ? "rgba(245,158,11,.1)" : "transparent",
            border: `1px solid ${showWhyNot ? "var(--gold)" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)",
            color: showWhyNot ? "var(--gold)" : "var(--muted)",
            fontFamily: "var(--font-mono)", fontSize: 9,
            padding: "4px 12px", cursor: "pointer",
            letterSpacing: ".1em", textTransform: "uppercase",
          }}>
            ⚠️ Why NOT? ({whyNots.length} kelemahan)
          </button>
          {showWhyNot && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              {whyNots.map(d => (
                <div key={d.feature} style={{
                  background: "rgba(245,158,11,.05)", border: "1px solid rgba(245,158,11,.2)",
                  borderRadius: 6, padding: "7px 12px",
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", fontSize: 11, flexWrap: "wrap", gap: 4,
                }}>
                  <span style={{ color: "var(--gold)" }}>⚠️ {d.feature}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>
                    Preferensi: {d.user_value} → EV ini: {d.vehicle_value} ({d.match_quality})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feature Breakdown */}
      {rec.explainability?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setExpanded(e => !e)} style={{
            background: "transparent", border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)", color: "var(--muted)",
            fontFamily: "var(--font-mono)", fontSize: 9,
            padding: "4px 12px", cursor: "pointer",
            letterSpacing: ".1em", textTransform: "uppercase",
            transition: "all .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            {expanded ? "▲ Hide" : "▼ Show"} Feature Breakdown
          </button>
          {expanded && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              {rec.explainability.map(d => <ExplainRow key={d.feature} detail={d} />)}
            </div>
          )}
        </div>
      )}

      {/* Similar to This */}
      <div style={{ marginBottom: 10 }}>
        <button onClick={handleSimilar} style={{
          background: similar ? "rgba(124,58,237,.1)" : "transparent",
          border: `1px solid ${similar ? "var(--accent2)" : "var(--border)"}`,
          borderRadius: "var(--radius-sm)",
          color: similar ? "var(--accent2)" : "var(--muted)",
          fontFamily: "var(--font-mono)", fontSize: 9,
          padding: "4px 12px", cursor: "pointer",
          letterSpacing: ".1em", textTransform: "uppercase",
          transition: "all .2s",
        }}>
          {loadingSimilar ? "⏳ Loading..." : similar ? "▲ Hide Similar" : "🔍 Find Similar EVs"}
        </button>
        {similar && (
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
            {similar.map(s => (
              <div key={s.vehicle.vehicle_id} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "10px 12px",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", textTransform: "uppercase" }}>{s.vehicle.manufacturer}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14, marginBottom: 4 }}>{s.vehicle.model}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)" }}>{s.similarity_pct} similar</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)" }}>
                  ${Math.round(s.vehicle.price_usd / 1000)}k · {s.vehicle.range_km}km
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: ".04em", color }}>
          ${ev.price_usd?.toLocaleString()}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[ev.battery_type, ev.charging_type].filter(Boolean).map(tag => (
            <span key={tag} style={{ fontFamily: "var(--font-mono)", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", color: "var(--muted)", whiteSpace: "nowrap" }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExplainRow({ detail }) {
  const qualityColor = { excellent: "#10b981", good: "#00e5ff", partial: "#f59e0b", weak: "#ef4444" }[detail.match_quality] || "#64748b";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 60px 60px", gap: 8, alignItems: "center", padding: "7px 10px", background: "var(--surface)", borderRadius: "var(--radius-sm)", fontSize: 11 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>{detail.feature}</div>
      <div style={{ position: "relative", height: 4, background: "var(--border)", borderRadius: 2 }}>
        <div style={{ position: "absolute", height: "100%", borderRadius: 2, width: `${Math.max(0, Math.min(100, detail.contribution * 100))}%`, background: qualityColor }} />
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", textAlign: "right" }}>
        {typeof detail.vehicle_value === "number" ? detail.vehicle_value.toFixed(1) : detail.vehicle_value}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: qualityColor, textAlign: "right", textTransform: "uppercase", letterSpacing: ".06em" }}>{detail.match_quality}</div>
    </div>
  );
}

function LoadingState() {
  const [step, setStep] = useState(0);

  const steps = [
    { label: "Loading dataset...",              icon: "📊", done: false },
    { label: "Normalizing features...",         icon: "⚙️", done: false },
    { label: "Running K-Means clustering...",   icon: "🔬", done: false },
    { label: "Computing cosine similarity...",  icon: "📐", done: false },
    { label: "Generating explanations...",      icon: "🧠", done: false },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "40px 20px", maxWidth: 400, margin: "0 auto" }}>

      {/* Animated EV */}
      <div style={{ textAlign: "center", marginBottom: 28, position: "relative", height: 60 }}>
        <div style={{
          fontSize: 32,
          display: "inline-block",
          animation: "ev-drive 2s ease-in-out infinite",
        }}>
          ⚡🚗
        </div>
        {/* Road */}
        <div style={{
          position: "absolute", bottom: 8, left: 0, right: 0,
          height: 2, background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          opacity: .4,
        }} />
        {/* Speed lines */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: "absolute",
            bottom: 20 + i * 8,
            left: `${20 + i * 15}%`,
            width: 24, height: 2,
            background: "var(--accent)",
            opacity: .3,
            borderRadius: 1,
            animation: `speed-line 1s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      {/* Step Progress */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            opacity: i <= step ? 1 : .3,
            transition: "opacity .3s ease",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: i < step
                ? "rgba(16,185,129,.2)"
                : i === step
                ? "rgba(0,229,255,.15)"
                : "var(--surface)",
              border: `1px solid ${i < step ? "#10b981" : i === step ? "var(--accent)" : "var(--border)"}`,
              fontSize: 12,
              transition: "all .3s",
            }}>
              {i < step ? "✓" : s.icon}
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: i < step ? "#10b981" : i === step ? "var(--accent)" : "var(--muted)",
              letterSpacing: ".08em",
              transition: "color .3s",
            }}>
              {s.label}
            </div>
            {i === step && (
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--accent)",
                animation: "pulse-dot 1s ease-in-out infinite",
                marginLeft: "auto",
                flexShrink: 0,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{
        marginTop: 20, background: "var(--surface)",
        borderRadius: 4, height: 4, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 4,
          width: `${((step + 1) / steps.length) * 100}%`,
          background: "linear-gradient(90deg, var(--accent), var(--accent2))",
          transition: "width .4s ease",
        }} />
      </div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 9,
        color: "var(--muted)", textAlign: "right",
        marginTop: 6, letterSpacing: ".1em",
      }}>
        {Math.round(((step + 1) / steps.length) * 100)}%
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.3)", borderRadius: "var(--radius-md)", padding: "20px", textAlign: "center", color: "#fca5a5", fontSize: 13 }}>
      ⚠️ {message}
    </div>
  );
}
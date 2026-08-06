// ═══════════════════════════════════════════════════════════════
// EVOS — PreferenceForm Component
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";

const PROFILE_DEFAULTS = {
  budget:      { max_price_usd: 55000, min_range_km: 280, min_battery_kwh: 55, max_charge_time_hr: 9, min_safety_rating: 4, min_autonomy_level: 1 },
  performance: { max_price_usd: 95000, min_range_km: 350, min_battery_kwh: 80, max_charge_time_hr: 6, min_safety_rating: 4, min_autonomy_level: 3 },
  longrange:   { max_price_usd: 85000, min_range_km: 470, min_battery_kwh: 100, max_charge_time_hr: 5, min_safety_rating: 4, min_autonomy_level: 2 },
};

const SLIDERS = [
  { id: "max_price_usd",      label: "Max Budget",       min: 30000, max: 150000, step: 1000, fmt: v => `$${v.toLocaleString()}`,      color: "var(--accent)" },
  { id: "min_range_km",       label: "Min Range",         min: 100,   max: 600,   step: 10,   fmt: v => `${v} km`,                    color: "var(--accent2)", cls: "purple" },
  { id: "min_battery_kwh",    label: "Min Battery",       min: 20,    max: 150,   step: 5,    fmt: v => `${v} kWh`,                   color: "var(--gold)", cls: "gold" },
  { id: "max_charge_time_hr", label: "Max Charge Time",   min: 0.5,   max: 12,    step: 0.5,  fmt: v => `${parseFloat(v).toFixed(1)} hr`, color: "var(--accent)" },
  { id: "min_safety_rating",  label: "Min Safety Rating", min: 1,     max: 5,     step: 1,    fmt: v => `${v} / 5`,                   color: "var(--accent2)", cls: "purple" },
  { id: "min_autonomy_level", label: "Min Autonomy",      min: 0,     max: 5,     step: 1,    fmt: v => `Level ${v}`,                 color: "var(--gold)", cls: "gold" },
];

const WEIGHT_OPTIONS = [
  { value: "0.5", label: "×0.5" },
  { value: "1.0", label: "×1.0" },
  { value: "1.5", label: "×1.5" },
  { value: "2.0", label: "×2.0" },
];

const WEIGHT_FIELDS = [
  { id: "price",       label: "Price" },
  { id: "range_km",   label: "Range" },
  { id: "battery",    label: "Battery" },
  { id: "charge_time",label: "Charge" },
  { id: "safety",     label: "Safety" },
  { id: "autonomy",   label: "Autonomy" },
];

export default function PreferenceForm({ profile, onSubmit, loading }) {
  const [prefs, setPrefs] = useState(PROFILE_DEFAULTS[profile]);
  const [weights, setWeights] = useState({
    price: "1.0", range_km: "1.5", battery: "1.0",
    charge_time: "1.0", safety: "1.0", autonomy: "1.5",
  });

  // Reset when profile changes
  useEffect(() => {
    setPrefs(PROFILE_DEFAULTS[profile]);
  }, [profile]);

  const handleSlider = (id, val) => {
    setPrefs(p => ({ ...p, [id]: parseFloat(val) }));
  };

  const handleWeight = (id, val) => {
    setWeights(w => ({ ...w, [id]: val }));
  };

  const handleSubmit = () => {
    const weightPayload = Object.fromEntries(
      Object.entries(weights).map(([k, v]) => [k, parseFloat(v)])
    );
    onSubmit(prefs, weightPayload);
  };

  return (
    <div>
      <div className="label">02 — Preference Vector</div>
      <div className="glass" style={{ padding: "28px 24px" }}>

        {/* Slider Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px 32px",
          marginBottom: 24,
        }}>
          {SLIDERS.map(s => {
            const val = prefs[s.id] ?? s.min;
            const pct = ((val - s.min) / (s.max - s.min)) * 100;
            return (
              <div key={s.id}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  color: "var(--muted)", marginBottom: 8,
                  letterSpacing: ".12em", textTransform: "uppercase",
                }}>
                  <span>{s.label}</span>
                  <span style={{ color: s.color, fontSize: 11 }}>{s.fmt(val)}</span>
                </div>

                {/* Track + fill */}
                <div style={{ position: "relative", height: 3, borderRadius: 2, background: "var(--border)", marginBottom: 6 }}>
                  <div style={{
                    position: "absolute", height: "100%", borderRadius: 2,
                    width: pct + "%",
                    background: s.color || "var(--accent)",
                    transition: "width .08s",
                  }} />
                </div>

                <input
                  type="range"
                  className={s.cls || ""}
                  min={s.min} max={s.max} step={s.step}
                  value={val}
                  onChange={e => handleSlider(s.id, e.target.value)}
                  style={{ marginTop: -3 }}
                />
              </div>
            );
          })}
        </div>

        {/* Feature Weights */}
        <div style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 20,
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 9,
            color: "var(--muted)", letterSpacing: ".15em",
            textTransform: "uppercase", marginBottom: 12,
          }}>
            Feature Weights (Cosine Similarity)
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gap: 8,
          }}>
            {WEIGHT_FIELDS.map(f => (
              <div key={f.id} style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 9,
                  color: "var(--muted)", letterSpacing: ".1em",
                  textTransform: "uppercase", marginBottom: 6,
                }}>
                  {f.label}
                </div>
                <select
                  value={weights[f.id]}
                  onChange={e => handleWeight(f.id, e.target.value)}
                >
                  {WEIGHT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading && (
              <div style={{
                width: 18, height: 18,
                border: "2px solid rgba(0,0,0,.3)",
                borderTopColor: "#000",
                borderRadius: "50%",
                animation: "spin .7s linear infinite",
              }} />
            )}
            {loading ? "ANALYZING..." : "FIND MY PERFECT EV ⚡"}
          </div>
        </button>
      </div>
    </div>
  );
}

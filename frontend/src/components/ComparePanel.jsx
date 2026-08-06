export default function ComparePanel({ vehicles, onClose, onRemove }) {
  const FEATURES = [
    { key: "price_usd",            label: "💰 Price",       fmt: v => `$${v?.toLocaleString()}`, better: "lower"  },
    { key: "range_km",             label: "📍 Range",        fmt: v => `${v} km`,                better: "higher" },
    { key: "battery_capacity_kwh", label: "🔋 Battery",      fmt: v => `${v} kWh`,               better: "higher" },
    { key: "charge_time_hr",       label: "⚡ Charge Time",  fmt: v => `${v} hr`,                better: "lower"  },
    { key: "safety_rating",        label: "🛡️ Safety",       fmt: v => `${v}/5`,                 better: "higher" },
    { key: "autonomous_level",     label: "🤖 Autonomy",     fmt: v => `Level ${v}`,             better: "higher" },
    { key: "warranty_years",       label: "📋 Warranty",     fmt: v => `${v} yr`,                better: "higher" },
  ];

  const getBest = (key, better) => {
    const vals = vehicles.map(v => v[key] ?? 0);
    return better === "higher" ? Math.max(...vals) : Math.min(...vals);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 20, padding: 28,
        maxWidth: 900, width: "100%",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, letterSpacing: ".05em" }}>
            ⚖️ EV COMPARISON
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid var(--border)",
            borderRadius: 8, color: "var(--muted)", cursor: "pointer",
            fontFamily: "var(--font-mono)", fontSize: 11, padding: "6px 14px",
          }}>
            ✕ Close
          </button>
        </div>

        {/* Vehicle Headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `160px repeat(${vehicles.length}, 1fr)`,
          gap: 8, marginBottom: 12,
        }}>
          <div />
          {vehicles.map(v => (
            <div key={v.vehicle_id} style={{
              background: "var(--surface)", borderRadius: 10,
              padding: "14px 12px", textAlign: "center",
              border: "1px solid var(--border)", position: "relative",
            }}>
              <button onClick={() => onRemove(v.vehicle_id)} style={{
                position: "absolute", top: 6, right: 6,
                background: "transparent", border: "none",
                color: "var(--muted)", cursor: "pointer", fontSize: 12,
              }}>✕</button>
              <div style={{ fontSize: 22, marginBottom: 6 }}>🚗</div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 9,
                color: "var(--muted)", textTransform: "uppercase", marginBottom: 2,
              }}>
                {v.manufacturer}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16, letterSpacing: ".03em" }}>
                {v.model}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                {v.year}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Rows */}
        {FEATURES.map(feat => {
          const best = getBest(feat.key, feat.better);
          return (
            <div key={feat.key} style={{
              display: "grid",
              gridTemplateColumns: `160px repeat(${vehicles.length}, 1fr)`,
              gap: 8, marginBottom: 6,
            }}>
              {/* Feature Label */}
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 10,
                color: "var(--muted)", display: "flex",
                alignItems: "center", letterSpacing: ".06em",
              }}>
                {feat.label}
              </div>

              {/* Values */}
              {vehicles.map(v => {
                const val  = v[feat.key] ?? 0;
                const best_ = getBest(feat.key, feat.better);
                const isBest = val === best_;
                return (
                  <div key={v.vehicle_id} style={{
                    background: isBest ? "rgba(16,185,129,.1)" : "var(--surface)",
                    border: `1px solid ${isBest ? "#10b981" : "var(--border)"}`,
                    borderRadius: 8, padding: "10px 8px", textAlign: "center",
                    transition: "all .2s",
                  }}>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 17,
                      color: isBest ? "#10b981" : "var(--text)",
                    }}>
                      {feat.fmt(val)}
                    </div>
                    {isBest && (
                      <div style={{
                        fontSize: 9, color: "#10b981",
                        fontFamily: "var(--font-mono)", marginTop: 2,
                        letterSpacing: ".06em",
                      }}>
                        ✓ BEST
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
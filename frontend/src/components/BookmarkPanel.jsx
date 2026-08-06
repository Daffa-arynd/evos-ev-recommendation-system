export default function BookmarkPanel({ bookmarks, onRemove, onToggleCompare, isInCompare }) {
  if (bookmarks.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "120px 20px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>❤️</div>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 32,
          color: "var(--muted)", letterSpacing: ".05em",
        }}>
          NO SAVED EVs YET
        </div>
        <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 10, lineHeight: 1.6 }}>
          Klik ❤️ di card rekomendasi untuk menyimpan EV favorit kamu
        </div>
      </div>
    );
  }

  return (
    <div className="app-inner" style={{ paddingTop: 80 }}>
      <div className="label">❤️ Saved EVs ({bookmarks.length})</div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 14,
      }}>
        {bookmarks.map(ev => (
          <div key={ev.vehicle_id} style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16, padding: 18,
            transition: "border-color .2s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,229,255,.25)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 9,
                  color: "var(--muted)", textTransform: "uppercase",
                  letterSpacing: ".12em", marginBottom: 2,
                }}>
                  {ev.manufacturer}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>
                  {ev.model}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>
                  {ev.year} · {ev.color}
                </div>
              </div>
              <button onClick={() => onRemove(ev)} style={{
                background: "rgba(239,68,68,.1)",
                border: "1px solid rgba(239,68,68,.3)",
                borderRadius: 8, color: "#ef4444",
                cursor: "pointer", fontFamily: "var(--font-mono)",
                fontSize: 10, padding: "4px 10px",
                alignSelf: "flex-start",
              }}>
                ✕ Remove
              </button>
            </div>

            {/* Specs */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 6, marginBottom: 12,
            }}>
              {[
                { val: `$${Math.round(ev.price_usd / 1000)}k`, label: "price" },
                { val: `${ev.range_km}km`,                      label: "range" },
                { val: `${ev.battery_capacity_kwh}kWh`,         label: "battery" },
              ].map(s => (
                <div key={s.label} style={{
                  background: "var(--surface)", borderRadius: 6,
                  padding: "8px 6px", textAlign: "center",
                }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{s.val}</div>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 8,
                    color: "var(--muted)", textTransform: "uppercase", marginTop: 2,
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
              {[ev.battery_type, ev.charging_type].filter(Boolean).map(tag => (
                <span key={tag} style={{
                  fontFamily: "var(--font-mono)", fontSize: 8,
                  padding: "2px 7px", borderRadius: 4,
                  background: "rgba(255,255,255,.04)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Compare Button */}
            <button
              onClick={() => onToggleCompare(ev)}
              style={{
                width: "100%",
                background: isInCompare(ev.vehicle_id) ? "rgba(245,158,11,.15)" : "transparent",
                border: `1px solid ${isInCompare(ev.vehicle_id) ? "var(--gold)" : "var(--border)"}`,
                borderRadius: 8,
                color: isInCompare(ev.vehicle_id) ? "var(--gold)" : "var(--muted)",
                fontFamily: "var(--font-mono)", fontSize: 10,
                padding: "8px", cursor: "pointer",
                letterSpacing: ".08em", transition: "all .2s",
              }}
            >
              {isInCompare(ev.vehicle_id) ? "⚖️ In Compare List" : "⚖️ Add to Compare"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";

export default function HistoryPanel({ onLoadHistory }) {
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen]   = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("evos_history") || "[]");
      setHistory(saved);
    } catch { setHistory([]); }
  }, [isOpen]);

  const clearHistory = () => {
    localStorage.removeItem("evos_history");
    setHistory([]);
  };

  const deleteOne = (id) => {
    const updated = history.filter(h => h.id !== id);
    localStorage.setItem("evos_history", JSON.stringify(updated));
    setHistory(updated);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 90,
          background: "rgba(0,229,255,.12)",
          border: "1px solid var(--accent)",
          borderRadius: 12, color: "var(--accent)",
          fontFamily: "var(--font-mono)", fontSize: 11,
          padding: "10px 16px", cursor: "pointer",
          letterSpacing: ".08em", backdropFilter: "blur(8px)",
          boxShadow: "0 0 20px rgba(0,229,255,.15)",
          transition: "all .2s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,229,255,.2)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(0,229,255,.12)"}
      >
        🕐 History {history.length > 0 ? `(${history.length})` : ""}
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: 70, right: 24, zIndex: 90,
          background: "rgba(11,15,24,.97)", backdropFilter: "blur(16px)",
          border: "1px solid var(--border)", borderRadius: 16,
          width: 340, maxHeight: 480, overflowY: "auto",
          boxShadow: "0 8px 40px rgba(0,0,0,.6)",
          animation: "fadeUp .2s ease",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
            position: "sticky", top: 0,
            background: "rgba(11,15,24,.97)",
          }}>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 18,
              letterSpacing: ".05em",
            }}>
              🕐 Search History
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {history.length > 0 && (
                <button onClick={clearHistory} style={{
                  background: "rgba(239,68,68,.1)",
                  border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: 6, color: "#ef4444",
                  fontFamily: "var(--font-mono)", fontSize: 9,
                  padding: "4px 10px", cursor: "pointer",
                  letterSpacing: ".08em",
                }}>
                  Clear All
                </button>
              )}
              <button onClick={() => setIsOpen(false)} style={{
                background: "transparent", border: "1px solid var(--border)",
                borderRadius: 6, color: "var(--muted)",
                fontFamily: "var(--font-mono)", fontSize: 9,
                padding: "4px 10px", cursor: "pointer",
              }}>
                ✕
              </button>
            </div>
          </div>

          {/* Empty State */}
          {history.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: ".1em" }}>
                Belum ada history pencarian
              </div>
            </div>
          )}

          {/* History Items */}
          {history.map(h => (
            <div key={h.id} style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              transition: "background .15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  {/* Time & Profile */}
                  <div style={{
                    display: "flex", gap: 8, alignItems: "center", marginBottom: 6,
                  }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 9,
                      color: "var(--muted)",
                    }}>
                      {new Date(h.timestamp).toLocaleString("id-ID", {
                        day: "2-digit", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 9,
                      padding: "2px 7px", borderRadius: 4,
                      background: h.profile === "budget"
                        ? "rgba(16,185,129,.15)"
                        : h.profile === "performance"
                        ? "rgba(245,158,11,.15)"
                        : "rgba(124,58,237,.15)",
                      color: h.profile === "budget"
                        ? "#10b981"
                        : h.profile === "performance"
                        ? "#f59e0b"
                        : "#7c3aed",
                      letterSpacing: ".06em",
                    }}>
                      {h.profile}
                    </span>
                  </div>

                  {/* Preferences Summary */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: 4, marginBottom: 8,
                  }}>
                    {[
                      { label: "Budget", val: `$${Math.round(h.preferences.max_price_usd/1000)}k` },
                      { label: "Range",  val: `${h.preferences.min_range_km}km` },
                      { label: "Battery",val: `${h.preferences.min_battery_kwh}kWh` },
                      { label: "Results",val: `${h.resultCount} EVs` },
                    ].map(s => (
                      <div key={s.label} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)" }}>
                          {s.label}:
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text)" }}>
                          {s.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Top Result */}
                  {h.topResult && (
                    <div style={{
                      background: "rgba(0,229,255,.05)",
                      border: "1px solid rgba(0,229,255,.1)",
                      borderRadius: 6, padding: "5px 10px",
                      fontFamily: "var(--font-mono)", fontSize: 9,
                      color: "var(--accent)", marginBottom: 8,
                    }}>
                      🏆 Top: {h.topResult.manufacturer} {h.topResult.model} · {h.topResult.similarity}
                    </div>
                  )}

                  {/* Load Button */}
                  <button
                    onClick={() => { onLoadHistory(h); setIsOpen(false); }}
                    style={{
                      background: "rgba(0,229,255,.08)",
                      border: "1px solid rgba(0,229,255,.2)",
                      borderRadius: 6, color: "var(--accent)",
                      fontFamily: "var(--font-mono)", fontSize: 9,
                      padding: "4px 12px", cursor: "pointer",
                      letterSpacing: ".08em",
                    }}
                  >
                    ↩ Load This Search
                  </button>
                </div>

                {/* Delete */}
                <button onClick={() => deleteOne(h.id)} style={{
                  background: "transparent", border: "none",
                  color: "var(--muted)", cursor: "pointer",
                  fontSize: 14, padding: "0 0 0 8px",
                  flexShrink: 0,
                }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
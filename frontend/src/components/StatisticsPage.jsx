import { useEffect, useState } from "react";
import { fetchStatistics, fetchPCA3D, fetchElbow } from "../utils/api";

const CLUSTER_COLORS = {
  budget:      "#10b981",
  performance: "#f59e0b",
  longrange:   "#7c3aed",
};

export default function StatisticsPage() {
  const [stats, setStats]     = useState(null);
  const [pca, setPca]         = useState(null);
  const [elbow, setElbow]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    Promise.all([fetchStatistics(), fetchPCA3D(), fetchElbow()])
      .then(([s, p, e]) => { setStats(s); setPca(p); setElbow(e); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "120px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 5, height: 36, marginBottom: 20 }}>
          {["var(--accent)", "var(--accent2)", "var(--gold)", "#ec4899", "#06b6d4"].map((c, i) => (
            <div key={i} style={{
              width: 5, borderRadius: 3, background: c,
              animation: `bar-bounce 1s ease-in-out ${i * 0.1}s infinite`,
            }} />
          ))}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", color: "var(--muted)",
          fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase",
          animation: "blink 1.2s ease-in-out infinite",
        }}>
          Loading statistics...
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const TABS = [
    { id: "overview", label: "📊 Overview"          },
    { id: "pca",      label: "🔬 PCA 3D Cluster"    },
    { id: "elbow",    label: "📈 Elbow & Silhouette" },
    { id: "dist",     label: "💰 Price Distribution" },
    { id: "brands",   label: "🏭 Top Brands"         },
  ];

  return (
    <div className="app-inner" style={{ paddingTop: 80 }}>

      {/* Page Label */}
      <div className="label">📊 Dataset Statistics</div>

      {/* Summary Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 10, marginBottom: 28,
      }}>
        {[
          { val: stats.summary.total_vehicles.toLocaleString(), label: "Total EVs",    color: "var(--accent)"  },
          { val: `$${Math.round(stats.summary.avg_price/1000)}k`, label: "Avg Price",  color: "var(--gold)"    },
          { val: `${stats.summary.avg_range} km`,  label: "Avg Range",                 color: "var(--accent2)" },
          { val: `${stats.summary.avg_battery} kWh`, label: "Avg Battery",             color: "#ec4899"        },
          { val: stats.summary.manufacturers_count, label: "Brands",                   color: "#06b6d4"        },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "16px", textAlign: "center",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: s.color }}>
              {s.val}
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 9,
              color: "var(--muted)", textTransform: "uppercase",
              letterSpacing: ".12em", marginTop: 5,
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tab Buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: activeTab === t.id ? "rgba(0,229,255,.1)" : "var(--card)",
            border: `1px solid ${activeTab === t.id ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 8,
            color: activeTab === t.id ? "var(--accent)" : "var(--muted)",
            fontFamily: "var(--font-mono)", fontSize: 11,
            padding: "8px 16px", cursor: "pointer",
            letterSpacing: ".08em", transition: "all .2s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Cluster Summary */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 16, padding: 22,
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)",
              letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 18,
            }}>
              K-Means Cluster Summary
            </div>
            {stats.cluster_stats.map(c => (
              <div key={c.cluster} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{
                    fontFamily: "var(--font-display)", fontSize: 18,
                    color: CLUSTER_COLORS[c.cluster.toLowerCase()],
                  }}>
                    {c.cluster}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>
                    {c.count} vehicles
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {[
                    { val: `$${Math.round(c.avg_price/1000)}k`, label: "avg price"   },
                    { val: `${c.avg_range}km`,                   label: "avg range"   },
                    { val: `${c.avg_battery}kWh`,                label: "avg battery" },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: "var(--surface)", borderRadius: 6,
                      padding: "7px 8px", textAlign: "center",
                    }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 13 }}>{s.val}</div>
                      <div style={{
                        fontFamily: "var(--font-mono)", fontSize: 8,
                        color: "var(--muted)", textTransform: "uppercase", marginTop: 2,
                      }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Charging Types */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 16, padding: 22,
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)",
              letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 18,
            }}>
              Charging Type Distribution
            </div>
            {stats.charging_types.map((c, i) => {
              const maxCount = stats.charging_types[0]?.count || 1;
              const pct = (c.count / maxCount) * 100;
              const colors = [
                "var(--accent)", "var(--accent2)", "var(--gold)",
                "#ec4899", "#06b6d4", "#10b981", "#f97316", "#8b5cf6",
              ];
              return (
                <div key={c.type} style={{ marginBottom: 12 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontFamily: "var(--font-mono)", fontSize: 10, marginBottom: 5,
                  }}>
                    <span style={{ color: "var(--muted)" }}>{c.type}</span>
                    <span style={{ color: colors[i % colors.length] }}>{c.count}</span>
                  </div>
                  <div style={{
                    background: "var(--surface)", borderRadius: 3,
                    height: 6, overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: colors[i % colors.length],
                      borderRadius: 3, transition: "width 1.2s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: PCA 3D ── */}
      {activeTab === "pca" && pca && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 22,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)",
            letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 8,
          }}>
            PCA 3D — K-Means Cluster Visualization
          </div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--muted)", marginBottom: 16,
          }}>
            Explained variance: PC1={pca.explained_variance.pc1}% ·
            PC2={pca.explained_variance.pc2}% ·
            PC3={pca.explained_variance.pc3}% ·
            Total={pca.explained_variance.total}%
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
            {Object.entries(CLUSTER_COLORS).map(([label, color]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  color: "var(--muted)", textTransform: "capitalize",
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* 3D Plot */}
          <PCA3DPlot points={pca.points} />

          <div style={{
            marginTop: 14, fontFamily: "var(--font-mono)",
            fontSize: 9, color: "var(--muted)", textAlign: "center",
          }}>
            💡 Klik dan drag untuk merotasi visualisasi · Hover titik untuk detail EV
          </div>
        </div>
      )}

      {/* ── TAB: PRICE DISTRIBUTION ── */}
      {activeTab === "dist" && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 22,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)",
            letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 20,
          }}>
            Price Distribution — ${Math.round(stats.summary.price_min/1000)}k
            to ${Math.round(stats.summary.price_max/1000)}k
          </div>
          <BarChart data={stats.price_distribution} color="var(--accent)" />
        </div>
      )}

      {/* ── TAB: ELBOW & SILHOUETTE ── */}
      {activeTab === "elbow" && elbow && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Elbow Method Chart */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 16, padding: 22,
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)",
              letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 4,
            }}>
              Elbow Method
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)",
              marginBottom: 20, lineHeight: 1.5,
            }}>
              Menentukan nilai k optimal untuk K-Means clustering.
              Titik "siku" menunjukkan k=3 sebagai pilihan optimal.
            </div>

            {/* Chart */}
            <ElbowChart data={elbow.elbow} />

            <div style={{
              marginTop: 16, padding: "10px 14px",
              background: "rgba(0,229,255,.05)",
              border: "1px solid rgba(0,229,255,.15)",
              borderRadius: 8, fontFamily: "var(--font-mono)",
              fontSize: 10, color: "var(--muted)", lineHeight: 1.6,
            }}>
              💡 <strong style={{ color: "var(--accent)" }}>k=3 dipilih</strong> karena
              merupakan titik elbow dimana penambahan cluster tidak memberikan
              penurunan inertia yang signifikan.
            </div>
          </div>

          {/* Silhouette Score */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 16, padding: 22,
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)",
              letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 4,
            }}>
              Silhouette Score
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)",
              marginBottom: 20, lineHeight: 1.5,
            }}>
              Mengukur kualitas clustering. Nilai mendekati 1 = cluster sangat baik.
            </div>

            {/* Overall Score */}
            <div style={{
              textAlign: "center", marginBottom: 24,
              padding: "20px", background: "var(--surface)",
              borderRadius: 12, border: "1px solid var(--border)",
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 52,
                color: elbow.silhouette.overall > 0.5 ? "#10b981"
                  : elbow.silhouette.overall > 0.25 ? "var(--gold)"
                  : "#ef4444",
                lineHeight: 1,
              }}>
                {elbow.silhouette.overall}
              </div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 10,
                color: "var(--muted)", marginTop: 8, letterSpacing: ".1em",
              }}>
                Overall Silhouette Score
              </div>
              <div style={{
                display: "inline-block", marginTop: 10,
                fontFamily: "var(--font-mono)", fontSize: 11,
                padding: "4px 14px", borderRadius: 6,
                background: elbow.silhouette.overall > 0.5
                  ? "rgba(16,185,129,.15)" : "rgba(245,158,11,.15)",
                color: elbow.silhouette.overall > 0.5 ? "#10b981" : "var(--gold)",
                border: `1px solid ${elbow.silhouette.overall > 0.5 ? "#10b981" : "var(--gold)"}`,
              }}>
                {elbow.silhouette.interpretation}
              </div>
            </div>

            {/* Per Cluster */}
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 9,
              color: "var(--muted)", letterSpacing: ".12em",
              textTransform: "uppercase", marginBottom: 12,
            }}>
              Score per Cluster
            </div>
            {Object.entries(elbow.silhouette.per_cluster).map(([label, score]) => {
              const colors = { budget: "#10b981", performance: "#f59e0b", longrange: "#7c3aed" };
              const c = colors[label] || "var(--accent)";
              return (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontFamily: "var(--font-mono)", fontSize: 10, marginBottom: 5,
                  }}>
                    <span style={{ color: c, textTransform: "capitalize" }}>{label}</span>
                    <span style={{ color: "var(--text)" }}>{score}</span>
                  </div>
                  <div style={{
                    background: "var(--surface)", borderRadius: 4,
                    height: 8, overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%", width: `${score * 100}%`,
                      background: c, borderRadius: 4,
                      transition: "width 1.2s ease",
                    }} />
                  </div>
                </div>
              );
            })}

            <div style={{
              marginTop: 16, padding: "10px 14px",
              background: "rgba(16,185,129,.05)",
              border: "1px solid rgba(16,185,129,.15)",
              borderRadius: 8, fontFamily: "var(--font-mono)",
              fontSize: 10, color: "var(--muted)", lineHeight: 1.6,
            }}>
              💡 Silhouette Score {elbow.silhouette.overall} menunjukkan
              bahwa cluster yang terbentuk sudah <strong style={{ color: "#10b981" }}>
              {elbow.silhouette.interpretation.toLowerCase()}</strong> dan
              setiap EV telah ditempatkan pada cluster yang sesuai.
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: TOP BRANDS ── */}
      {activeTab === "brands" && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 22,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)",
            letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 20,
          }}>
            Top 10 Manufacturers
          </div>
          {stats.top_manufacturers.map((m, i) => {
            const max = stats.top_manufacturers[0]?.count || 1;
            const pct = (m.count / max) * 100;
            return (
              <div key={m.name} style={{ marginBottom: 14 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontFamily: "var(--font-mono)", fontSize: 11, marginBottom: 6,
                }}>
                  <span style={{ color: "var(--text)" }}>
                    #{i + 1} {m.name}
                  </span>
                  <span style={{ color: "var(--accent)" }}>
                    {m.count} vehicles
                  </span>
                </div>
                <div style={{
                  background: "var(--surface)", borderRadius: 4,
                  height: 8, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: "linear-gradient(90deg, var(--accent), var(--accent2))",
                    borderRadius: 4, transition: "width 1.2s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Bar Chart Component ───────────────────────────────────────
function BarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 220, paddingBottom: 30 }}>
      {data.map(d => {
        const h = (d.count / max) * 180;
        return (
          <div key={d.range} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4, position: "relative",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 8,
              color: "var(--muted)", marginBottom: 2,
            }}>
              {d.count}
            </div>
            <div style={{
              width: "100%", height: h,
              background: color, borderRadius: "4px 4px 0 0",
              transition: "height 1s ease",
              minHeight: d.count > 0 ? 4 : 0,
              opacity: .85,
            }} />
            <div style={{
              position: "absolute", bottom: -24,
              fontFamily: "var(--font-mono)", fontSize: 7,
              color: "var(--muted)", textAlign: "center",
              width: "100%", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {d.range}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── PCA 3D Plot Component (SVG with mouse rotation) ───────────
function PCA3DPlot({ points }) {
  const [rotX, setRotX]       = useState(20);
  const [rotY, setRotY]       = useState(30);
  const [dragging, setDragging] = useState(false);
  const [last, setLast]       = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState(null);

  const sample = points.slice(0, 600);

  const xs = sample.map(p => p.x);
  const ys = sample.map(p => p.y);
  const zs = sample.map(p => p.z);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);

  const norm = (v, mn, mx) => mx === mn ? 0 : ((v - mn) / (mx - mn)) * 2 - 1;

  const project = (x, y, z) => {
    const rx = rotX * Math.PI / 180;
    const ry = rotY * Math.PI / 180;
    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const y2 = y * cosX - z * sinX;
    const z2 = y * sinX + z * cosX;
    const x2 = x * cosY + z2 * sinY;
    const z3 = -x * sinY + z2 * cosY;
    const scale = 1 / (1 + z3 * 0.25);
    return { px: x2 * scale, py: y2 * scale, depth: z3 };
  };

  const W = 700, H = 420;

  const projected = sample.map((p, i) => {
    const x = norm(p.x, minX, maxX);
    const y = norm(p.y, minY, maxY);
    const z = norm(p.z, minZ, maxZ);
    const { px, py, depth } = project(x, y, z);
    return {
      ...p, i,
      sx: px * W * 0.32 + W / 2,
      sy: py * H * 0.32 + H / 2,
      depth,
    };
  }).sort((a, b) => a.depth - b.depth);

  return (
    <div style={{ position: "relative" }}>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{
          background: "var(--surface)", borderRadius: 12,
          cursor: dragging ? "grabbing" : "grab",
        }}
        onMouseDown={e => {
          setDragging(true);
          setLast({ x: e.clientX, y: e.clientY });
        }}
        onMouseMove={e => {
          if (!dragging) return;
          const dx = e.clientX - last.x;
          const dy = e.clientY - last.y;
          setRotY(r => r + dx * 0.4);
          setRotX(r => r + dy * 0.4);
          setLast({ x: e.clientX, y: e.clientY });
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => { setDragging(false); setTooltip(null); }}
      >
        {/* Labels */}
        <text x={12} y={22} fill="rgba(100,116,139,.7)" fontSize={10} fontFamily="monospace">
          PCA 3D — K-Means Clustering
        </text>
        <text x={12} y={38} fill="rgba(100,116,139,.5)" fontSize={9} fontFamily="monospace">
          PC1 · PC2 · PC3 | drag to rotate
        </text>

        {/* Points */}
        {projected.map((p) => (
          <circle
            key={p.i}
            cx={p.sx} cy={p.sy}
            r={3.5}
            fill={CLUSTER_COLORS[p.cluster] || "#64748b"}
            opacity={0.72}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setTooltip(p)}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={Math.min(tooltip.sx + 8, W - 180)}
              y={Math.max(tooltip.sy - 40, 5)}
              width={170} height={52}
              rx={6} fill="rgba(17,24,39,.95)"
              stroke="rgba(0,229,255,.3)" strokeWidth={1}
            />
            <text
              x={Math.min(tooltip.sx + 16, W - 172)}
              y={Math.max(tooltip.sy - 22, 19)}
              fill="#e2e8f0" fontSize={9} fontFamily="monospace"
            >
              {tooltip.name.slice(0, 22)}
            </text>
            <text
              x={Math.min(tooltip.sx + 16, W - 172)}
              y={Math.max(tooltip.sy - 8, 33)}
              fill="#00e5ff" fontSize={9} fontFamily="monospace"
            >
              ${Math.round(tooltip.price / 1000)}k · {tooltip.range_km}km
            </text>
            <text
              x={Math.min(tooltip.sx + 16, W - 172)}
              y={Math.max(tooltip.sy + 6, 47)}
              fill={CLUSTER_COLORS[tooltip.cluster]} fontSize={9} fontFamily="monospace"
            >
              {tooltip.cluster}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── Elbow Chart Component ─────────────────────────────
function ElbowChart({ data }) {
  const W = 320, H = 200;
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const minI = Math.min(...data.inertias);
  const maxI = Math.max(...data.inertias);
  const minK = Math.min(...data.k_values);
  const maxK = Math.max(...data.k_values);

  const xScale = (k) => ((k - minK) / (maxK - minK)) * chartW + PAD.left;
  const yScale = (v) => chartH - ((v - minI) / (maxI - minI)) * chartH + PAD.top;

  const points = data.k_values.map((k, i) => ({
    x: xScale(k), y: yScale(data.inertias[i]), k, inertia: data.inertias[i],
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(r => (
        <line
          key={r}
          x1={PAD.left} y1={PAD.top + chartH * (1 - r)}
          x2={PAD.left + chartW} y2={PAD.top + chartH * (1 - r)}
          stroke="rgba(255,255,255,.05)" strokeWidth={1}
        />
      ))}

      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Area fill */}
      <polygon
        points={`${PAD.left},${PAD.top + chartH} ${polyline} ${PAD.left + chartW},${PAD.top + chartH}`}
        fill="var(--accent)" fillOpacity={0.06}
      />

      {/* Points */}
      {points.map(p => (
        <g key={p.k}>
          <circle
            cx={p.x} cy={p.y} r={p.k === 3 ? 7 : 4}
            fill={p.k === 3 ? "var(--gold)" : "var(--accent)"}
            stroke="var(--bg)" strokeWidth={2}
          />
          {p.k === 3 && (
            <>
              <text
                x={p.x} y={p.y - 14}
                textAnchor="middle" fontSize={9}
                fontFamily="monospace" fill="var(--gold)"
              >
                ← Optimal k=3
              </text>
            </>
          )}
        </g>
      ))}

      {/* X axis labels */}
      {points.map(p => (
        <text
          key={p.k}
          x={p.x} y={H - 8}
          textAnchor="middle" fontSize={9}
          fontFamily="monospace"
          fill={p.k === 3 ? "var(--gold)" : "rgba(100,116,139,.8)"}
        >
          k={p.k}
        </text>
      ))}

      {/* Y axis label */}
      <text
        x={12} y={H / 2}
        textAnchor="middle" fontSize={8}
        fontFamily="monospace" fill="rgba(100,116,139,.6)"
        transform={`rotate(-90, 12, ${H / 2})`}
      >
        Inertia
      </text>
    </svg>
  );
}
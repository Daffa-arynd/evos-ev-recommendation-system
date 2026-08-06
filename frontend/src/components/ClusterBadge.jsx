// ═══════════════════════════════════════════════════════════════
// EVOS — ClusterBadge (K-Means User Profile Selector)
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";

const PROFILES = [
  {
    id: "budget",
    icon: "💰",
    name: "Budget Seeker",
    desc: "Value-focused. Best specs per dollar, reliability over luxury",
    color: "#10b981",
    badge: "Cluster A",
    stats: ["~$45k avg price", "Good range", "Solid safety"],
  },
  {
    id: "performance",
    icon: "⚡",
    name: "Performance",
    desc: "Speed, autonomy, safety tech and cutting-edge battery systems",
    color: "#f59e0b",
    badge: "Cluster B",
    stats: ["Premium specs", "High autonomy", "Top safety"],
  },
  {
    id: "longrange",
    icon: "🗺️",
    name: "Long Range",
    desc: "Maximum km per charge, fast charging, highway dominance",
    color: "#7c3aed",
    badge: "Cluster C",
    stats: ["500+ km range", "Fast charging", "Large battery"],
  },
];

export default function ClusterBadge({ selected, onSelect }) {
  return (
    <div>
      <div className="label">01 — User Profile / K-Means Cluster</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
      }}>
        {PROFILES.map(p => (
          <ProfileCard
            key={p.id}
            profile={p}
            active={selected === p.id}
            onClick={() => onSelect(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ProfileCard({ profile, active, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active
          ? `rgba(${hexToRgb(profile.color)}, .08)`
          : "var(--card)",
        border: `1px solid ${active || hovered ? profile.color : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "22px 18px",
        cursor: "pointer",
        transition: "all .25s ease",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        transform: hovered && !active ? "translateY(-2px)" : "none",
        boxShadow: active ? `0 0 24px -6px ${profile.color}` : "none",
      }}
    >
      {/* Glow overlay */}
      {active && (
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(circle at 50% 0%, ${profile.color}18, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      <div style={{ fontSize: 30, marginBottom: 10 }}>{profile.icon}</div>

      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: 20,
        letterSpacing: ".05em",
        color: active ? profile.color : "var(--text)",
        marginBottom: 6,
      }}>
        {profile.name}
      </div>

      <div style={{
        fontSize: 12,
        color: "var(--muted)",
        lineHeight: 1.5,
        marginBottom: 14,
      }}>
        {profile.desc}
      </div>

      {/* Mini stats */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
        {profile.stats.map(s => (
          <span key={s} style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            padding: "2px 7px",
            borderRadius: 4,
            background: `rgba(${hexToRgb(profile.color)}, .12)`,
            color: profile.color,
            letterSpacing: ".05em",
            border: `1px solid rgba(${hexToRgb(profile.color)}, .2)`,
          }}>{s}</span>
        ))}
      </div>

      <div style={{
        display: "inline-block",
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        padding: "3px 10px",
        borderRadius: 4,
        background: profile.color,
        color: "#000",
        fontWeight: 700,
        letterSpacing: ".08em",
      }}>
        {profile.badge}
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

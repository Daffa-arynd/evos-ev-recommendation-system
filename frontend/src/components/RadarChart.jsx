export default function RadarChart({ explainability, color = "var(--accent)" }) {
  if (!explainability || explainability.length === 0) return null;

  const W = 200, H = 200;
  const cx = W / 2, cy = H / 2;
  const R  = 75;
  const n  = explainability.length;

  // Angle for each feature
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  // Points on outer ring (labels)
  const labelPts = explainability.map((_, i) => ({
    x: cx + (R + 18) * Math.cos(angle(i)),
    y: cy + (R + 18) * Math.sin(angle(i)),
  }));

  // Grid rings (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const ringPoints = (ratio) =>
    explainability.map((_, i) => ({
      x: cx + R * ratio * Math.cos(angle(i)),
      y: cy + R * ratio * Math.sin(angle(i)),
    }));

  const toPolyline = (pts) =>
    pts.map(p => `${p.x},${p.y}`).join(" ");

  // Data points — use normalized_vehicle value (0-1)
  const dataPts = explainability.map((d, i) => {
    const val = Math.max(0, Math.min(1, d.normalized_vehicle));
    return {
      x: cx + R * val * Math.cos(angle(i)),
      y: cy + R * val * Math.sin(angle(i)),
    };
  });

  // Short feature labels
  const shortLabel = (feature) => {
    const map = {
      "Price":            "Price",
      "Range":            "Range",
      "Battery Capacity": "Battery",
      "Charge Time":      "Charge",
      "Safety Rating":    "Safety",
      "Autonomy Level":   "Autonomy",
    };
    return map[feature] || feature;
  };

  return (
    <svg
      width={W} height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ overflow: "visible" }}
    >
      {/* Grid rings */}
      {rings.map((ratio, ri) => (
        <polygon
          key={ri}
          points={toPolyline(ringPoints(ratio))}
          fill="none"
          stroke="rgba(255,255,255,.06)"
          strokeWidth={1}
        />
      ))}

      {/* Grid spokes */}
      {explainability.map((_, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={cx + R * Math.cos(angle(i))}
          y2={cy + R * Math.sin(angle(i))}
          stroke="rgba(255,255,255,.06)"
          strokeWidth={1}
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={toPolyline(dataPts)}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points dots */}
      {dataPts.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y}
          r={3}
          fill={color}
          stroke="var(--bg)"
          strokeWidth={1.5}
        />
      ))}

      {/* Labels */}
      {labelPts.map((p, i) => (
        <text
          key={i}
          x={p.x} y={p.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          fontFamily="var(--font-mono)"
          fill="rgba(100,116,139,.9)"
          letterSpacing=".05em"
        >
          {shortLabel(explainability[i].feature)}
        </text>
      ))}
    </svg>
  );
}
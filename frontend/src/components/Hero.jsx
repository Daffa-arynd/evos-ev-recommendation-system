// ═══════════════════════════════════════════════════════════════
// EVOS — Hero Component
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";

export default function Hero() {
  const titleRef = useRef(null);

  useEffect(() => {
    // Staggered letter reveal on mount
    const el = titleRef.current;
    if (!el) return;
    el.style.opacity = "1";
  }, []);

  return (
    <div style={{
      textAlign: "center",
      padding: "70px 0 48px",
      position: "relative",
    }}>
      {/* Badge */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(0,229,255,.08)",
        border: "1px solid rgba(0,229,255,.2)",
        borderRadius: 20,
        padding: "6px 18px",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color: "var(--accent)",
        letterSpacing: ".12em",
        textTransform: "uppercase",
        marginBottom: 28,
      }}>
        <span style={{
          width: 7, height: 7,
          background: "var(--accent)",
          borderRadius: "50%",
          animation: "pulse-dot 2s ease-in-out infinite",
          display: "inline-block",
        }}/>
        ML-Powered · Cosine Similarity · K-Means Clustering · Explainable AI
      </div>

      {/* Main Title */}
      <h1 ref={titleRef} style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(64px, 10vw, 108px)",
        letterSpacing: ".02em",
        lineHeight: .88,
        background: "linear-gradient(135deg, #fff 0%, var(--accent) 50%, var(--accent2) 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        marginBottom: 10,
        opacity: 0,
        transition: "opacity .6s",
      }}>
        EVOS
      </h1>

      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--muted)",
        letterSpacing: ".2em",
        textTransform: "uppercase",
        marginBottom: 20,
      }}>
        Electric Vehicle Optimization System
      </div>

      <p style={{
        color: "var(--muted)",
        fontSize: 14,
        maxWidth: 520,
        margin: "0 auto",
        lineHeight: 1.65,
      }}>
        AI-powered EV recommendations using content-based filtering on{" "}
        <span style={{ color: "var(--text)" }}>3,000+ electric vehicles</span>,
        feature-scaled with MinMaxScaler, clustered via K-Means,
        ranked by cosine similarity with full explainability output.
      </p>

      {/* Decorative bottom glow */}
      <div style={{
        position: "absolute",
        bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: 300, height: 1,
        background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
        opacity: .25,
      }} />
    </div>
  );
}

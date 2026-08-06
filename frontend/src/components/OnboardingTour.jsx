import { useState, useEffect } from "react";

const STEPS = [
  {
    title: "Selamat Datang di EVOS! ⚡",
    desc: "Electric Vehicle Oracle System — temukan EV terbaik untuk kamu menggunakan AI & Machine Learning.",
    emoji: "🚗",
  },
  {
    title: "Step 1: Pilih Profil Kamu",
    desc: "Pilih Budget, Performance, atau Long Range sesuai kebutuhan dan gaya hidup kamu.",
    emoji: "👤",
  },
  {
    title: "Step 2: Atur Preferensi",
    desc: "Geser slider untuk mengatur budget maksimal, jangkauan minimum, kapasitas baterai, dan lainnya.",
    emoji: "🎛️",
  },
  {
    title: "Step 3: Cari EV Terbaik!",
    desc: "Klik tombol FIND MY PERFECT EV dan sistem ML akan memberikan top 5 rekomendasi terpersonalisasi.",
    emoji: "🚀",
  },
  {
    title: "Fitur Tambahan",
    desc: "Kamu bisa bookmark EV favorit ❤️, bandingkan EV ⚖️, lihat statistik dataset 📊, dan ekspor hasil ke PDF!",
    emoji: "✨",
  },
];

export default function OnboardingTour() {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("evos_onboarding_done");
    if (!seen) {
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  const finish = () => {
    localStorage.setItem("evos_onboarding_done", "1");
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,.8)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--accent)",
        borderRadius: 24, padding: "40px 36px",
        maxWidth: 460, width: "100%",
        textAlign: "center",
        boxShadow: "0 0 60px rgba(0,229,255,.15)",
        animation: "fadeUp .4s ease",
      }}>
        {/* Emoji */}
        <div style={{ fontSize: 56, marginBottom: 20 }}>
          {current.emoji}
        </div>

        {/* Step indicator */}
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--accent)", letterSpacing: ".2em",
          textTransform: "uppercase", marginBottom: 14,
        }}>
          {step + 1} / {STEPS.length}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 26,
          letterSpacing: ".04em", marginBottom: 14, lineHeight: 1.1,
        }}>
          {current.title}
        </div>

        {/* Description */}
        <div style={{
          color: "var(--muted)", fontSize: 14,
          lineHeight: 1.7, marginBottom: 32,
        }}>
          {current.desc}
        </div>

        {/* Progress Dots */}
        <div style={{
          display: "flex", justifyContent: "center",
          gap: 8, marginBottom: 28,
        }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 28 : 8,
                height: 8, borderRadius: 4,
                background: i === step ? "var(--accent)" : "var(--border)",
                transition: "all .3s ease",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {/* Skip */}
          <button onClick={finish} style={{
            flex: 1,
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 10, color: "var(--muted)",
            fontFamily: "var(--font-mono)", fontSize: 11,
            padding: "11px", cursor: "pointer",
            letterSpacing: ".08em",
            transition: "all .2s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--muted)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            Skip Tour
          </button>

          {/* Prev (show after step 0) */}
          {step > 0 && (
            <button onClick={prev} style={{
              flex: 1,
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 10, color: "var(--muted)",
              fontFamily: "var(--font-mono)", fontSize: 11,
              padding: "11px", cursor: "pointer",
              letterSpacing: ".08em",
            }}>
              ← Back
            </button>
          )}

          {/* Next / Finish */}
          <button onClick={next} style={{
            flex: 2,
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            border: "none", borderRadius: 10,
            color: "#000", fontFamily: "var(--font-display)",
            fontSize: 18, padding: "11px",
            cursor: "pointer", letterSpacing: ".05em",
            transition: "all .2s",
          }}>
            {step < STEPS.length - 1 ? "Next →" : "Let's Go! 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";

export default function Navbar({ page, onNavigate, bookmarkCount, compareCount, onShowCompare }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("evos_theme") !== "light";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove("light-mode");
      localStorage.setItem("evos_theme", "dark");
    } else {
      document.documentElement.classList.add("light-mode");
      localStorage.setItem("evos_theme", "light");
    }
  }, [darkMode]);

  const navItems = [
    { id: "home",       label: "🏠 Home" },
    { id: "statistics", label: "📊 Statistics" },
    { id: "bookmarks",  label: `❤️ Saved${bookmarkCount > 0 ? ` (${bookmarkCount})` : ""}` },
  ];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(4,6,10,.88)", backdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border)",
      padding: "0 24px", height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 24,
        letterSpacing: ".1em",
        background: "linear-gradient(135deg, var(--accent), var(--accent2))",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        cursor: "default",            
      }}>
        ⚡ EVOS
      </div>

      {/* Nav Links */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)} style={{
            background: page === item.id ? "rgba(0,229,255,.1)" : "transparent",
            border: `1px solid ${page === item.id ? "var(--accent)" : "transparent"}`,
            borderRadius: 8,
            color: page === item.id ? "var(--accent)" : "var(--muted)",
            fontFamily: "var(--font-mono)", fontSize: 11,
            padding: "6px 14px", cursor: "pointer",
            letterSpacing: ".08em", transition: "all .2s",
          }}
            onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.borderColor = "var(--border)"; }}
            onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.borderColor = "transparent"; }}
          >
            {item.label}
          </button>
        ))}

        {/* Compare Button */}
        {compareCount > 0 && (
          <button onClick={onShowCompare} style={{
            background: "rgba(245,158,11,.15)",
            border: "1px solid var(--gold)",
            borderRadius: 8, color: "var(--gold)",
            fontFamily: "var(--font-mono)", fontSize: 11,
            padding: "6px 14px", cursor: "pointer",
            letterSpacing: ".08em", transition: "all .2s",
          }}>
            ⚖️ Compare ({compareCount})
          </button>
        )}

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={() => setDarkMode(d => !d)}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            background: darkMode ? "rgba(245,158,11,.1)" : "rgba(100,116,139,.1)",
            border: `1px solid ${darkMode ? "rgba(245,158,11,.3)" : "var(--border)"}`,
            borderRadius: 8, cursor: "pointer",
            padding: "6px 12px", fontSize: 16,
            transition: "all .3s",
          }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
}
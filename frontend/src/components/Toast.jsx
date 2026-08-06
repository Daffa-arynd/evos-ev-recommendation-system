import { useState, useEffect, createContext, useContext, useCallback } from "react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  }, []);

  const COLORS = {
    success: { bg: "rgba(16,185,129,.15)", border: "#10b981", icon: "✅" },
    info:    { bg: "rgba(0,229,255,.15)",  border: "var(--accent)", icon: "ℹ️" },
    warning: { bg: "rgba(245,158,11,.15)", border: "var(--gold)", icon: "⚠️" },
    error:   { bg: "rgba(239,68,68,.15)",  border: "#ef4444", icon: "❌" },
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      {/* Toast Container */}
      <div style={{
        position: "fixed", top: 70, right: 20, zIndex: 999,
        display: "flex", flexDirection: "column", gap: 8,
        pointerEvents: "none",
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.success;
          return (
            <div key={t.id} style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 10, padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 10,
              fontFamily: "var(--font-mono)", fontSize: 12,
              color: "var(--text)", backdropFilter: "blur(12px)",
              boxShadow: "0 4px 20px rgba(0,0,0,.4)",
              animation: "fadeUp .3s ease",
              minWidth: 220, maxWidth: 320,
              pointerEvents: "none",
            }}>
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
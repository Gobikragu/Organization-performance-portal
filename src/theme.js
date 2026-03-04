// ============================================================
// src/theme.js — PerformOS Theme System
// ============================================================

export const THEMES = {
  dark: {
    name: "dark",
    label: "Dark",
    // Backgrounds
    bg:         "#060e1a",
    bgSidebar:  "rgba(6,12,24,0.97)",
    bgCard:     "rgba(255,255,255,0.02)",
    bgCardHover:"rgba(255,255,255,0.04)",
    bgInput:    "rgba(255,255,255,0.04)",
    bgModal:    "#0a1628",
    bgTopbar:   "rgba(6,12,24,0.8)",
    bgTag:      "rgba(255,255,255,0.04)",
    // Borders
    border:     "rgba(255,255,255,0.07)",
    borderInput:"rgba(255,255,255,0.09)",
    borderSide: "rgba(255,255,255,0.06)",
    // Text
    textPrimary:  "#f1f5f9",
    textSecondary:"#94a3b8",
    textMuted:    "#64748b",
    textFaint:    "#475569",
    textDim:      "#334155",
    // Accents (same in both themes)
    accent:     "#4fd1c5",
    accentBlue: "#38bdf8",
    accentPurple:"#a78bfa",
    accentAmber:"#f59e0b",
    accentGreen:"#10b981",
    accentRed:  "#ef4444",
    accentPink: "#f472b6",
    accentOrange:"#fb923c",
    // Select bg
    selectBg:   "#0d1f35",
    // Scrollbar
    scrollThumb:"rgba(79,209,197,0.2)",
  },
  light: {
    name: "light",
    label: "Light",
    // Backgrounds
    bg:         "#f0f4f8",
    bgSidebar:  "#ffffff",
    bgCard:     "#ffffff",
    bgCardHover:"#f8fafc",
    bgInput:    "#f8fafc",
    bgModal:    "#ffffff",
    bgTopbar:   "rgba(255,255,255,0.9)",
    bgTag:      "#f1f5f9",
    // Borders
    border:     "rgba(0,0,0,0.08)",
    borderInput:"rgba(0,0,0,0.12)",
    borderSide: "rgba(0,0,0,0.07)",
    // Text
    textPrimary:  "#0f172a",
    textSecondary:"#475569",
    textMuted:    "#64748b",
    textFaint:    "#94a3b8",
    textDim:      "#cbd5e1",
    // Accents
    accent:     "#0891b2",
    accentBlue: "#0284c7",
    accentPurple:"#7c3aed",
    accentAmber:"#d97706",
    accentGreen:"#059669",
    accentRed:  "#dc2626",
    accentPink: "#db2777",
    accentOrange:"#ea580c",
    // Select bg
    selectBg:   "#f8fafc",
    // Scrollbar
    scrollThumb:"rgba(8,145,178,0.2)",
  }
};

export const getTheme = () => {
  try {
    const saved = localStorage.getItem('performos_theme');
    return THEMES[saved] || THEMES.dark;
  } catch { return THEMES.dark; }
};

export const setTheme = (name) => {
  try { localStorage.setItem('performos_theme', name); } catch {}
};
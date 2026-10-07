export interface VnTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bgGlass: string;
  border: string;
  glow: string;
  text: string;
}

export const VN_THEMES: Record<string, VnTheme> = {
  default: {
    id: "default",
    name: "Classic ADV",
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#ffd700",
    bgGlass: "rgba(15, 23, 42, 0.92)",
    border: "rgba(129, 140, 248, 0.5)",
    glow: "rgba(99, 102, 241, 0.35)",
    text: "#f8fafc",
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    primary: "#00f0ff",
    secondary: "#ff007f",
    accent: "#ffe600",
    bgGlass: "rgba(10, 15, 29, 0.94)",
    border: "rgba(0, 240, 255, 0.6)",
    glow: "rgba(0, 240, 255, 0.4)",
    text: "#e0f7fa",
  },
  midnight: {
    id: "midnight",
    name: "Midnight",
    primary: "#a855f7",
    secondary: "#6366f1",
    accent: "#c084fc",
    bgGlass: "rgba(8, 7, 20, 0.95)",
    border: "rgba(168, 85, 247, 0.4)",
    glow: "rgba(168, 85, 247, 0.3)",
    text: "#f3e8ff",
  },
  sakura: {
    id: "sakura",
    name: "Sakura Blossom",
    primary: "#f472b6",
    secondary: "#fb7185",
    accent: "#fef08a",
    bgGlass: "rgba(28, 15, 25, 0.92)",
    border: "rgba(244, 114, 182, 0.5)",
    glow: "rgba(244, 114, 182, 0.35)",
    text: "#fdf2f8",
  },
  sunset: {
    id: "sunset",
    name: "Sunset Gold",
    primary: "#f97316",
    secondary: "#e11d48",
    accent: "#fde047",
    bgGlass: "rgba(24, 14, 15, 0.93)",
    border: "rgba(249, 115, 22, 0.5)",
    glow: "rgba(249, 115, 22, 0.35)",
    text: "#fff7ed",
  },
};

export function applyVnTheme(rootEl: HTMLElement, themeId = "default"): void {
  const theme = VN_THEMES[themeId] || VN_THEMES["default"]!;
  rootEl.style.setProperty("--vn-primary", theme.primary);
  rootEl.style.setProperty("--vn-secondary", theme.secondary);
  rootEl.style.setProperty("--vn-accent", theme.accent);
  rootEl.style.setProperty("--vn-card-bg", theme.bgGlass);
  rootEl.style.setProperty("--vn-border", theme.border);
  rootEl.style.setProperty("--vn-glow", theme.glow);
  rootEl.style.setProperty("--vn-text", theme.text);
}

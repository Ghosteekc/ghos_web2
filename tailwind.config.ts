import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/{components/ui,components/home,components/battles,components/decks,pages,hooks,layout,api,types,utils}/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "cr-bg": "#0b0b14",
        "cr-surface": "#111128",
        "cr-card": "#181830",
        "cr-card-hover": "#1e1e38",
        "cr-gold": "#fbbf24",
        "cr-blue": "#60a5fa",
        "cr-win": "#22c55e",
        "cr-loss": "#ef4444",
        "cr-text": "#f3f4f6",
        "cr-muted": "#9ca3af",
        "cr-border": "rgba(255, 255, 255, 0.06)",
      },
      borderRadius: {
        "cr": "1.25rem",
        "cr-lg": "1.5rem",
      },
      boxShadow: {
        "glow": "0 0 20px rgba(251, 191, 36, 0.15)",
        "glow-blue": "0 0 20px rgba(96, 165, 250, 0.15)",
        "card": "0 8px 32px rgba(0, 0, 0, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
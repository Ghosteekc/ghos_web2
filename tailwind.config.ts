import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/{components/ui,components/home,components/battles,components/decks,pages,hooks,layout,api,types,utils}/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "cr-bg": "rgb(var(--cr-bg) / <alpha-value>)",
        "cr-surface": "rgb(var(--cr-surface) / <alpha-value>)",
        "cr-card": "rgb(var(--cr-card) / <alpha-value>)",
        "cr-card-hover": "rgb(var(--cr-card-hover) / <alpha-value>)",
        "cr-gold": "rgb(var(--cr-gold) / <alpha-value>)",
        "cr-blue": "rgb(var(--cr-blue) / <alpha-value>)",
        "cr-win": "rgb(var(--cr-win) / <alpha-value>)",
        "cr-loss": "rgb(var(--cr-loss) / <alpha-value>)",
        "cr-text": "rgb(var(--cr-text) / <alpha-value>)",
        "cr-muted": "rgb(var(--cr-muted) / <alpha-value>)",
        "cr-accent": "rgb(var(--cr-accent) / <alpha-value>)",
        "cr-border": "rgb(var(--cr-border) / var(--cr-border-alpha))",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
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
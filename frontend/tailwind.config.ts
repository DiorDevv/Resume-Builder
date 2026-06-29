import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A0A0F",
          foreground: "#F8FAFC",
        },
        surface: "#111118",
        border: "#1E1E2E",
        accent: {
          DEFAULT: "#6366F1",
          glow: "#818CF8",
        },
        success: "#10B981",
        warning: "#F59E0B",
        muted: "#94A3B8",
      },
      fontFamily: {
        display: ["Geist", "Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      fontSize: {
        xxs: "12px",
        xs: "14px",
        sm: "15px",
        base: "18px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      borderRadius: {
        card: "8px",
        input: "6px",
        badge: "4px",
      },
      backdropBlur: {
        glass: "12px",
      },
    },
  },
  plugins: [],
};

export default config;

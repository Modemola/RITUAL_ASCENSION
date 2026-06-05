import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0A0A",
        panel: "#111111",
        panel2: "#171717",
        cyan: "#00F5D4",
        aqua: "#67E8F9",
        purple: "#A855F7",
        green: "#22C55E",
        amber: "#F59E0B",
        gold: "#FACC15",
        ink: "#F1F5F9",
        muted: "#94A3B8"
      },
      boxShadow: {
        rune: "0 0 24px rgba(0,245,212,0.32)",
        purple: "0 0 28px rgba(168,85,247,0.28)",
        line: "0 1px 0 rgba(0,245,212,0.12)"
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      animation: {
        "fade-in": "fade-in 600ms ease-out forwards",
        "fade-in-delay": "fade-in 600ms ease-out 100ms forwards",
        "slide-up": "slide-up 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "slide-up-delay": "slide-up 500ms cubic-bezier(0.34, 1.56, 0.64, 1) 150ms forwards",
        "slide-down": "slide-down 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "scale-in": "scale-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "scale-in-slow": "scale-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
        "shimmer-slow": "shimmer 3s infinite",
        "ascend": "ascend 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "progress-fill": "progress-fill 1.2s ease-out forwards",
        "oracle-pulse": "oracle-pulse 2.4s ease-in-out infinite",
        "oracle-glow": "oracle-glow 3s ease-in-out infinite",
        "float-message": "float-message 600ms ease-out forwards",
        "unlock-celebration": "unlock-celebration 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "pop-in": "pop-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "input-glow": "input-glow 300ms ease-out forwards",
        "button-press": "button-press 200ms ease-out forwards",
        "skeleton-wave": "skeleton-wave 2s infinite",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "pulse-rune": "pulse-rune 2.8s ease-in-out infinite",
        "float-rune": "float-rune 7s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;

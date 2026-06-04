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
      }
    }
  },
  plugins: []
};

export default config;

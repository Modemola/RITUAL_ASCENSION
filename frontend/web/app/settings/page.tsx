"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

const PREFS_KEY = "ritual.ascension.prefs.v1";

const PREFERENCE_DEFS = [
  { key: "xpAnimations", label: "Show XP ignition animations" },
  { key: "achievementNotifications", label: "Enable achievement notifications" },
  { key: "leaderboardVisible", label: "Public leaderboard visibility" },
] as const;

type PrefKey = typeof PREFERENCE_DEFS[number]["key"];
type Prefs = Record<PrefKey, boolean>;

const DEFAULT_PREFS: Prefs = {
  xpAnimations: true,
  achievementNotifications: true,
  leaderboardVisible: true,
};

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      // ignore malformed storage
    }
  }, []);

  const toggle = (key: PrefKey) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const save = () => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // storage may be unavailable
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 fade-in">
      <p className="text-cipher text-xs uppercase tracking-[0.22em]">Settings</p>
      <h1 className="display-title text-aurora mt-2 text-4xl slide-up">Display preferences.</h1>
      <section className="rune-panel mt-6 p-5 hover-glow">
        {PREFERENCE_DEFS.map(({ key, label }, i) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between gap-4 border-b border-cyan/10 py-4 last:border-b-0 fade-in-delay-1 hover-lift"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span>{label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                prefs[key] ? "border-cyan/50 bg-cyan/25" : "border-white/10 bg-white/5"
              }`}
            >
              <span
                className={`inline-block size-4 rounded-full border transition-transform ${
                  prefs[key]
                    ? "translate-x-6 border-cyan bg-cyan"
                    : "translate-x-1 border-white/30 bg-white/30"
                }`}
              />
            </button>
          </label>
        ))}
      </section>
      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          className="rune-button inline-flex items-center gap-2 px-5 py-2.5 font-semibold button-press hover-lift"
        >
          <Save className="size-4" />
          {saved ? "Saved!" : "Save preferences"}
        </button>
        {saved && (
          <p className="font-mono text-sm text-green fade-in">Preferences updated.</p>
        )}
      </div>
    </main>
  );
}

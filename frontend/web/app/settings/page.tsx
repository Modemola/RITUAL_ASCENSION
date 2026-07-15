"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { DEFAULT_PREFERENCES, PREFS_STORAGE_KEY, type Preferences } from "@/lib/hooks";

const PREFERENCE_DEFS = [
  { key: "xpAnimations", label: "Show XP ignition animations", caption: undefined },
  { key: "achievementNotifications", label: "Enable achievement notifications", caption: undefined },
  {
    key: "leaderboardVisible",
    label: "Public leaderboard visibility",
    caption: "Saved for when the public leaderboard is powered by live rankings — it isn't wired up to real ranking data yet.",
  },
] as const satisfies ReadonlyArray<{ key: keyof Preferences; label: string; caption?: string }>;

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFERENCES, ...JSON.parse(raw) });
    } catch {
      // ignore malformed storage
    }
  }, []);

  const toggle = (key: keyof Preferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const save = () => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
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
        {PREFERENCE_DEFS.map(({ key, label, caption }, i) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between gap-4 border-b border-cyan/10 py-4 last:border-b-0 fade-in-delay-1 hover-lift"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span>
              <span className="block">{label}</span>
              {caption && <span className="mt-1 block text-xs text-muted">{caption}</span>}
            </span>
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

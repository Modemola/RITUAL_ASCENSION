export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 fade-in">
      <p className="text-cipher text-xs uppercase tracking-[0.22em]">Settings</p>
      <h1 className="display-title text-aurora mt-2 text-4xl slide-up">Display preferences.</h1>
      <section className="rune-panel mt-6 p-5 hover-glow">
        {["Show XP ignition animations", "Enable achievement notifications", "Public leaderboard visibility"].map((label, i) => (
          <label key={label} className="flex items-center justify-between gap-4 border-b border-cyan/10 py-4 last:border-b-0 fade-in-delay-1 hover-lift" style={{ animationDelay: `${i * 50}ms` }}>
            <span>{label}</span>
            <input type="checkbox" defaultChecked />
          </label>
        ))}
      </section>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Settings</p>
      <h1 className="mt-2 text-4xl font-semibold">Display preferences.</h1>
      <section className="rune-panel mt-6 p-5">
        {["Show XP ignition animations", "Enable achievement notifications", "Public leaderboard visibility"].map((label) => (
          <label key={label} className="flex items-center justify-between gap-4 border-b border-cyan/10 py-4 last:border-b-0">
            <span>{label}</span>
            <input type="checkbox" defaultChecked />
          </label>
        ))}
      </section>
    </main>
  );
}

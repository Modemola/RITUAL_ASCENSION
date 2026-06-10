import { achievements, appClass, appProgress, appReputation, demoPassport, quests } from "@/lib/data";

export default async function PublicProfilePage({ params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;
  const completed = quests.filter((quest) => demoPassport.completedQuestIds.includes(quest.id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 fade-in">
      <p className="text-cipher text-xs uppercase tracking-[0.22em]">Public profile</p>
      <h1 className="mt-2 break-all font-mono text-2xl font-semibold sm:text-4xl slide-up">{wallet}</h1>
      <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden passport-art art-surface pulse-rune min-h-96 border border-cyan/25 p-5 text-white shadow-rune scale-in hover-glow">
          <div aria-hidden="true" className="art-bg art-bg--identity art-bg--panel" />
          <div className="passport-frame relative z-10 flex h-full flex-col justify-between p-5">
            <div className="slide-up-delay">
              <p className="text-cipher text-xs uppercase tracking-[0.24em]">Passport #{demoPassport.tokenId}</p>
              <h2 className="display-title text-aurora mt-2 text-5xl">{appClass.name}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Level", appProgress.level],
                ["Stage", demoPassport.stage],
                ["Rep", appReputation]
              ].map(([label, value], i) => (
                <div key={label} className="metric-tile p-3 scale-in-stagger" style={{ "--index": i } as React.CSSProperties}>
                  <p className="text-sm text-white/60">{label}</p>
                  <p className="font-mono text-2xl font-semibold text-cyan">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-5">
          <section className="rune-panel p-5 fade-in-delay-1 hover-glow">
            <h2 className="section-title text-xl font-semibold">Unlocked achievements</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {achievements.filter((achievement) => achievement.unlocked).map((achievement, i) => (
                <span key={achievement.id} className="status-pill px-3 py-2 text-sm pop-in" style={{ animationDelay: `${i * 50}ms` }}>{achievement.name}</span>
              ))}
            </div>
          </section>
          <section className="rune-panel p-5 fade-in-delay-2 hover-glow">
            <h2 className="section-title text-xl font-semibold">Completed quests</h2>
            <div className="mt-4 grid gap-3">
              {completed.map((quest, i) => (
                <div key={quest.id} className="detail-cell p-3 float-message hover-lift" style={{ animationDelay: `${i * 50}ms` }}>
                  <p className="font-medium">{quest.title}</p>
                  <p className="font-mono text-sm text-cyan">{quest.xp} XP</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

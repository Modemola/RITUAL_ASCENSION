import { achievements, appClass, appProgress, appReputation, demoPassport, quests } from "@/lib/data";

export default async function PublicProfilePage({ params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;
  const completed = quests.filter((quest) => demoPassport.completedQuestIds.includes(quest.id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Public profile</p>
      <h1 className="mt-2 break-all font-mono text-2xl font-semibold sm:text-4xl">{wallet}</h1>
      <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="passport-art pulse-rune min-h-96 border border-cyan/25 p-5 text-white shadow-rune">
          <div className="flex h-full flex-col justify-between border border-white/15 bg-black/35 p-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan/75">Passport #{demoPassport.tokenId}</p>
              <h2 className="mt-2 text-5xl font-semibold">{appClass.name}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Level", appProgress.level],
                ["Stage", demoPassport.stage],
                ["Rep", appReputation]
              ].map(([label, value]) => (
                <div key={label} className="border border-cyan/20 bg-black/25 p-3">
                  <p className="text-sm text-white/60">{label}</p>
                  <p className="font-mono text-2xl font-semibold text-cyan">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-5">
          <section className="rune-panel p-5">
            <h2 className="text-xl font-semibold">Unlocked achievements</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {achievements.filter((achievement) => achievement.unlocked).map((achievement) => (
                <span key={achievement.id} className="border border-cyan/20 bg-cyan/10 px-3 py-2 text-sm text-cyan">{achievement.name}</span>
              ))}
            </div>
          </section>
          <section className="rune-panel p-5">
            <h2 className="text-xl font-semibold">Completed quests</h2>
            <div className="mt-4 grid gap-3">
              {completed.map((quest) => (
                <div key={quest.id} className="border border-cyan/10 bg-black/20 p-3">
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

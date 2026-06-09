import { Lock, Medal } from "lucide-react";
import { achievements } from "@/lib/data";
import { PrivateGate } from "@/lib/private-gate";

export default function AchievementsPage() {
  return (
    <PrivateGate>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="fade-in">
        <p className="text-cipher text-xs uppercase tracking-[0.22em]">Achievement system</p>
        <h1 className="display-title text-aurora mt-2 text-4xl">Permanent passport badges.</h1>
      </div>
      <section className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {achievements.map((achievement, i) => (
          <article key={achievement.id} className={achievement.unlocked ? "rune-panel card-shift mb-4 break-inside-avoid p-5 shadow-rune pop-in hover-lift hover-glow" : "rune-panel card-shift mb-4 break-inside-avoid p-5 opacity-55 grayscale fade-in-delay-2 hover-lift"} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between">
              {achievement.unlocked ? <Medal className="size-9 text-gold" /> : <Lock className="size-9 text-muted" />}
              <span className="status-pill px-2.5 py-1 font-mono text-xs">{achievement.rarity}</span>
            </div>
            <h2 className="section-title mt-5 text-xl font-semibold">{achievement.name}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-muted">{achievement.trigger}</p>
            <p className="mt-4 font-mono text-sm text-cyan">{achievement.xpBonus} XP bonus</p>
          </article>
        ))}
      </section>
    </main>
    </PrivateGate>
  );
}

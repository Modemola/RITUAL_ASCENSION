import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, Lock, Search } from "lucide-react";
import { quests } from "@/lib/data";

const statusIcon = {
  available: Clock3,
  in_progress: ArrowUpRight,
  completed: CheckCircle2,
  locked: Lock
};

const statusClass = {
  available: "text-cyan border-cyan/30 bg-cyan/10",
  in_progress: "text-amber border-amber/35 bg-amber/10",
  completed: "text-green border-green/35 bg-green/10",
  locked: "text-muted border-white/10 bg-white/5"
};

export default function QuestsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end fade-in">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Quest engine</p>
          <h1 className="mt-2 text-4xl font-semibold">Verify builder progress.</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {["All", "Class", "Completed", "Available"].map((item) => (
            <button key={item} className="border border-cyan/15 bg-panel/70 px-3 py-2 text-sm text-muted hover:text-cyan hover-lift">{item}</button>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3 border border-cyan/15 bg-panel/70 px-3 py-2 fade-in-delay-1">
        <Search className="size-4 text-cyan" />
        <input className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted" placeholder="Search quests, proof types, or XP rewards" />
      </div>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quests.map((quest, i) => {
          const Icon = statusIcon[quest.status];
          return (
            <article key={quest.id} className="rune-panel flex min-h-72 flex-col justify-between p-5 hover:border-cyan/45 scale-in-stagger hover-lift" style={{ "--index": i } as React.CSSProperties}>
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className="border border-cyan/15 px-2 py-1 font-mono text-xs text-cyan">{quest.type}</span>
                  <span className={`border p-2 ${statusClass[quest.status]}`}>
                    <Icon className="size-4" />
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-semibold">{quest.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">{quest.description}</p>
              </div>
              <div className="mt-5 border-t border-cyan/10 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-muted">{quest.verification}</span>
                  <span className="font-mono text-xl font-semibold text-cyan">{quest.xp} XP</span>
                </div>
                <Link href={`/quests/${quest.id}`} className="mt-4 inline-flex w-full justify-center border border-cyan/25 bg-cyan/10 px-3 py-2 text-sm font-medium text-cyan hover:border-cyan/60 hover-lift">
                  Submit Proof
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

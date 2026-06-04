import Link from "next/link";
import { Activity, BadgeCheck, Bot, ChevronRight, Flame, Hexagon, Shield, Sparkles } from "lucide-react";
import { appClass, appProgress, appReputation, appTier, demoPassport, evolutionStages, quests } from "@/lib/data";

export default function DashboardPage() {
  const activeQuest = quests.find((quest) => quest.status === "in_progress") ?? quests[0];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Builder dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold">Welcome back, {appClass.name}.</h1>
        </div>
        <Link href={`/profile/${demoPassport.wallet}`} className="inline-flex items-center gap-2 border border-cyan/20 bg-panel/70 px-4 py-2 text-sm font-medium text-cyan">
          Public profile <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="passport-art pulse-rune min-h-[460px] border border-cyan/25 p-5 text-white shadow-rune">
          <div className="flex h-full flex-col justify-between border border-white/15 bg-black/35 p-5 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan/75">Soulbound Passport</p>
                <h2 className="mt-2 text-5xl font-semibold">#{demoPassport.tokenId}</h2>
              </div>
              <div className="grid size-24 place-items-center rounded-full border border-cyan/30 bg-cyan/10 text-center shadow-rune">
                <span className="font-mono text-xs text-cyan">REP</span>
                <span className="font-mono text-3xl">{appReputation}</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-semibold">{appClass.name}</p>
              <p className="mt-2 max-w-xl text-white/68">{appClass.focus}</p>
              <div className="mt-6 h-4 overflow-hidden border border-cyan/25 bg-black/45">
                <div className="h-full bg-gradient-to-r from-cyan via-aqua to-green" style={{ width: `${appProgress.percent}%` }} />
              </div>
              <div className="mt-3 flex justify-between font-mono text-sm text-white/70">
                <span>LVL {appProgress.level} · {appTier}</span>
                <span>{demoPassport.xp} / {appProgress.nextXp} XP</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["XP Today", "+850", Flame],
              ["Streak", "7d", Activity],
              ["Stage", `0${demoPassport.stage}`, Hexagon]
            ].map(([label, value, Icon]) => (
              <div key={label as string} className="rune-panel p-4">
                <Icon className="size-5 text-cyan" />
                <p className="mt-4 text-sm text-muted">{label as string}</p>
                <p className="mt-1 font-mono text-3xl font-semibold text-ink">{value as string}</p>
              </div>
            ))}
          </div>

          <div className="rune-panel p-5">
            <div className="flex items-center gap-2">
              <Bot className="size-5 text-purple" />
              <h2 className="text-xl font-semibold">Oracle recommendation</h2>
            </div>
            <p className="mt-3 leading-7 text-muted">
              Finish <span className="font-medium text-cyan">{activeQuest.title}</span>. It is already in progress and moves your passport toward the next evolution stage.
            </p>
            <Link href="/oracle" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan">
              Open Oracle <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="rune-panel p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-cyan" />
              <h2 className="text-xl font-semibold">Recent activity</h2>
            </div>
            <div className="mt-4 grid gap-3 font-mono text-sm">
              {["+500 XP · Deploy Contract verified", "ACH_001 · First Blood unlocked", "Stage 2 · Initiate ignition complete"].map((item) => (
                <div key={item} className="border border-cyan/10 bg-black/20 p-3 text-muted">{item}</div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="mt-5 rune-panel p-5">
        <h2 className="text-2xl font-semibold">Evolution timeline</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {evolutionStages.map((stage) => (
            <div key={stage.id} className={stage.id === demoPassport.stage ? "border border-cyan/40 bg-cyan/10 p-4 shadow-rune" : "border border-cyan/15 bg-black/20 p-4"}>
              <div className="flex items-center gap-2">
                {stage.id <= demoPassport.stage ? <BadgeCheck className="size-5 text-green" /> : <Shield className="size-5 text-muted" />}
                <span className="font-mono text-sm text-cyan">0{stage.id}</span>
              </div>
              <h3 className="mt-3 font-semibold">{stage.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{stage.trigger}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

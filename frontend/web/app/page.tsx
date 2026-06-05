import Link from "next/link";
import { ArrowRight, BadgeCheck, Bot, CircleGauge, HelpCircle, ShieldCheck, Sparkles, Trophy, Wallet } from "lucide-react";
import { appProgress, appReputation, appTier, builderClasses, evolutionStages, leaderboard, quests } from "@/lib/data";

const features = [
  { icon: ShieldCheck, title: "Soulbound identity", text: "A non-transferable builder passport that binds class, stage, XP, and reputation to one wallet." },
  { icon: Bot, title: "Oracle guidance", text: "AI mentorship shaped by your class, unlocked achievements, completed quests, and available Ritual actions." },
  { icon: CircleGauge, title: "Progression engine", text: "Segmented XP, level tiers, verifiable proofs, and evolution triggers that make every action visible." },
  { icon: Trophy, title: "Public standing", text: "Leaderboard and profile surfaces that turn building into reputation across the Ritual ecosystem." }
];

const faqs = [
  ["Is the Passport transferable?", "No. It is designed as a soulbound identity layer for a single wallet."],
  ["What proves quest completion?", "V1 centers on transaction hashes, then expands into AI and manual review flows."],
  ["What evolves the Passport?", "Milestones like first deployment, LLM precompile use, full projects, and high reputation."]
];

export default function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-cyan/15">
        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div className="space-y-7 fade-in">
            <div className="inline-flex items-center gap-2 border border-cyan/20 bg-cyan/5 px-3 py-2 font-mono text-xs text-cyan shadow-rune fade-in-delay-1">
              <Sparkles className="size-4" />
              ASCENSION RITUAL ONLINE
            </div>
            <div className="space-y-5 slide-up-delay">
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-normal text-ink sm:text-6xl lg:text-7xl">
                Mint Your Soulbound Identity.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted">
                Ritual Ascension turns a wallet into a living builder passport: class, quests, XP, achievements, evolution, Oracle mentorship, and public reputation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row fade-in-delay-3">
              <Link href="/onboarding" className="rune-button inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold hover-lift">
                <Wallet className="size-4" />
                Mint Your Passport
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 border border-cyan/20 bg-panel/70 px-5 py-3 font-semibold text-cyan hover:border-cyan/50 hover-lift">
                Enter Demo Temple <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="passport-art pulse-rune relative min-h-[520px] border border-cyan/25 p-4 shadow-rune scale-in">
            <div className="flex h-full flex-col justify-between border border-white/15 bg-black/35 p-5 backdrop-blur">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan/75">Soulbound Passport #42</p>
                  <h2 className="mt-2 text-4xl font-semibold">Builder</h2>
                </div>
                <div className="grid size-20 place-items-center rounded-full border border-cyan/35 bg-cyan/10 text-center shadow-rune">
                  <span className="font-mono text-sm text-cyan">REP</span>
                  <span className="font-mono text-2xl">{appReputation}</span>
                </div>
              </div>
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Level", appProgress.level, appTier],
                    ["XP", "3.4k", `${appProgress.percent}% to next`],
                    ["Stage", "II", "Initiate"]
                  ].map(([label, value, detail]) => (
                    <div key={label} className="border border-cyan/20 bg-black/30 p-4">
                      <p className="text-sm text-muted">{label}</p>
                      <p className="mt-1 font-mono text-3xl font-semibold text-cyan">{value}</p>
                      <p className="text-sm text-white/65">{detail}</p>
                    </div>
                  ))}
                </div>
                <div className="h-3 overflow-hidden border border-cyan/25 bg-black/45">
                  <div className="h-full bg-gradient-to-r from-cyan to-aqua" style={{ width: `${appProgress.percent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-cyan/15 py-14">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-4">
          {features.map((item, i) => (
            <article key={item.title} className="rune-panel p-5 hover:border-cyan/45 scale-in-stagger hover-lift" style={{ "--index": i } as React.CSSProperties}>
              <item.icon className="size-6 text-cyan" />
              <h2 className="mt-5 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b border-cyan/15 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Builder classes</p>
            <h2 className="mt-3 text-3xl font-semibold">Choose your permanent path.</h2>
            <p className="mt-3 leading-7 text-muted">Class selection defines your quest lane, class achievement, and passport metadata at mint time.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {builderClasses.map((builderClass) => (
              <div key={builderClass.id} className="rune-panel p-4">
                <p className="font-mono text-xs text-cyan">CLASS {builderClass.id}</p>
                <h3 className="mt-2 text-xl font-semibold">{builderClass.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{builderClass.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-cyan/15 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div className="rune-panel p-5">
            <h2 className="text-3xl font-semibold">Evolution timeline</h2>
            <div className="mt-6 grid gap-4">
              {evolutionStages.map((stage) => (
                <div key={stage.id} className="grid grid-cols-[44px_1fr] items-center gap-4">
                  <span className="grid size-11 place-items-center rounded-full border border-cyan/30 bg-cyan/10 font-mono text-cyan">{stage.id}</span>
                  <div>
                    <h3 className="font-semibold">{stage.name}</h3>
                    <p className="text-sm text-muted">{stage.trigger}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rune-panel p-5">
            <h2 className="text-3xl font-semibold">Quest examples</h2>
            <div className="mt-6 grid gap-3">
              {quests.slice(0, 4).map((quest) => (
                <div key={quest.id} className="border border-cyan/15 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{quest.title}</h3>
                    <span className="font-mono text-sm text-cyan">{quest.xp} XP</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{quest.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="text-3xl font-semibold">Live leaderboard preview</h2>
            <div className="mt-5 overflow-hidden border border-cyan/15 bg-panel/60">
              {leaderboard.map((builder, index) => (
                <div key={builder.wallet} className="grid grid-cols-[52px_1fr_90px] items-center border-b border-cyan/10 px-4 py-3 last:border-b-0">
                  <span className="font-mono text-xl text-cyan">{index + 1}</span>
                  <div>
                    <p className="font-mono text-sm text-ink">{builder.wallet}</p>
                    <p className="text-sm text-muted">{builder.className} · Level {builder.level}</p>
                  </div>
                  <p className="text-right font-mono text-2xl text-green">{builder.reputation}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rune-panel p-5">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-5 text-purple" />
              <h2 className="text-2xl font-semibold">FAQ</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {faqs.map(([question, answer]) => (
                <div key={question} className="border border-cyan/10 p-3">
                  <p className="font-semibold">{question}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

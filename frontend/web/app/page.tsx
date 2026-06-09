import Link from "next/link";
import { ArrowRight, BadgeCheck, Bot, CircleGauge, ExternalLink, HelpCircle, ShieldCheck, Sparkles, Trophy, Wallet } from "lucide-react";
import { appProgress, appReputation, appTier, builderClasses, evolutionStages, leaderboard, quests, verifiedRitualProducts } from "@/lib/data";

const features = [
  { icon: ShieldCheck, title: "Soulbound identity", text: "A non-transferable builder passport that binds class, stage, XP, and reputation to one wallet." },
  { icon: Bot, title: "Oracle guidance", text: "AI mentorship shaped by your class, unlocked achievements, completed quests, and available Ritual actions." },
  { icon: CircleGauge, title: "Progression engine", text: "Segmented XP, level tiers, verifiable proofs, and evolution triggers that make every action visible." },
  { icon: Trophy, title: "Builder ranking", text: "Rankings only count builder tasks, keeping tester and Discord progress out of competitive standing." }
];

const faqs = [
  ["Is the Passport transferable?", "No. It is designed as a soulbound identity layer for a single wallet."],
  ["What proves quest completion?", "V1 centers on transaction hashes, then expands into AI and manual review flows."],
  ["What evolves the Passport?", "Milestones like first deployment, LLM precompile use, full projects, and high reputation."]
];

const productRail = [...verifiedRitualProducts, ...verifiedRitualProducts];

export default function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-cyan/15">
        <div className="identity-flow pointer-events-none absolute inset-x-0 top-8 mx-auto hidden h-40 max-w-5xl md:block" aria-hidden="true">
          <span className="flow-node left-[6%] top-10">WALLET</span>
          <span className="flow-node left-[42%] top-2">SBT</span>
          <span className="flow-node right-[6%] top-10">DISCORD</span>
          <span className="flow-packet packet-a" />
          <span className="flow-packet packet-b" />
        </div>
        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div className="space-y-7 fade-in">
            <div className="eyebrow shine-line fade-in-delay-1">
              <Sparkles className="size-4" />
              ASCENSION RITUAL ONLINE
            </div>
            <div className="space-y-5 slide-up-delay">
              <h1 className="display-title text-aurora max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
                Mint Your Soulbound Identity.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted">
                Ritual Ascension turns one connected wallet and one linked Discord into a living builder passport: class, quests, XP, achievements, evolution, Oracle mentorship, and builder-only reputation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row fade-in-delay-3">
              <Link href="/onboarding" className="rune-button inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold hover-lift">
                <Wallet className="size-4" />
                Mint Your Passport
              </Link>
              <Link href="/dashboard" className="quiet-button inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold hover-lift">
                Enter Demo Temple <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="passport-art pulse-rune breath-scale relative min-h-[520px] border border-cyan/25 p-4 shadow-rune scale-in">
            <div className="motion-lattice pointer-events-none absolute inset-x-4 top-10 h-24 opacity-60" aria-hidden="true" />
            <div className="passport-frame flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-cipher text-xs uppercase tracking-[0.24em]">Soulbound Passport #42</p>
                  <h2 className="section-title text-aurora mt-2 text-4xl font-semibold">Builder</h2>
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
                    <div key={label} className="metric-tile p-4 card-shift">
                      <p className="text-sm text-muted">{label}</p>
                      <p className="mt-1 font-mono text-3xl font-semibold text-cyan">{value}</p>
                      <p className="text-sm text-white/65">{detail}</p>
                    </div>
                  ))}
                </div>
                <div className="h-3 overflow-hidden rounded-full border border-cyan/25 bg-black/45">
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
              <h2 className="section-title mt-5 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b border-cyan/15 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-cipher text-xs uppercase tracking-[0.22em]">Builder classes</p>
            <h2 className="section-title energy-thread mt-3 inline-block text-3xl font-semibold">Choose your permanent path.</h2>
            <p className="mt-3 leading-7 text-muted">Class selection defines your quest lane, class achievement, and passport metadata at mint time.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {builderClasses.map((builderClass) => (
              <div key={builderClass.id} className="rune-panel p-4">
                <p className="status-pill inline-flex px-2.5 py-1 font-mono text-xs">CLASS {builderClass.id}</p>
                <h3 className="section-title mt-3 text-xl font-semibold">{builderClass.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{builderClass.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-cyan/15 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div className="rune-panel p-5">
            <h2 className="section-title text-3xl font-semibold">Evolution timeline</h2>
            <div className="mt-6 grid gap-4">
              {evolutionStages.map((stage) => (
                <div key={stage.id} className="grid grid-cols-[44px_1fr] items-center gap-4 soft-drift">
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
            <h2 className="section-title text-3xl font-semibold">Quest examples</h2>
            <div className="mt-6 grid gap-3">
              {quests.slice(0, 4).map((quest) => (
                <div key={quest.id} className="detail-cell p-4 card-shift">
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

      <section className="border-b border-cyan/15 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-cipher text-xs uppercase tracking-[0.22em]">Verified Ritual products</p>
              <h2 className="section-title mt-3 text-3xl font-semibold">Approved products for using Ritual.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-muted">
                When a submitted Ritual product is reviewed and approved by the backend, it appears here so users can discover tools, apps, and protocols that help them interact with the Ritual blockchain.
              </p>
            </div>
            <Link href="/quests/full-project" className="quiet-button inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold hover-lift">
              Submit a product <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="product-rail mt-7 overflow-hidden">
            <div className="product-track flex w-max gap-4">
              {productRail.map((product, index) => (
                <article key={`${product.id}-${index}`} className="rune-panel flex min-h-80 w-[min(82vw,360px)] shrink-0 flex-col justify-between p-5 hover-lift">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="status-pill px-2.5 py-1 font-mono text-xs">{product.category}</span>
                      <span className="inline-flex items-center gap-1 border border-green/30 bg-green/10 px-2 py-1 text-xs text-green">
                        <BadgeCheck className="size-3" />
                        {product.verificationBadge}
                      </span>
                    </div>
                    <h3 className="section-title mt-5 text-xl font-semibold">{product.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{product.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <span key={tag} className="border border-white/10 bg-white/5 px-2 py-1 text-xs text-muted">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 border-t border-cyan/10 pt-4">
                    <p className="font-mono text-xs text-muted">APPROVED {product.approvedAt}</p>
                    <Link href={product.url} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:text-aqua">
                      Open product <ExternalLink className="size-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="section-title text-3xl font-semibold">Builder task rankings</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Only builder quests affect this ranking. Tester milestones and Discord roles still grant progression, but they do not move this board.</p>
            <div className="rune-panel mt-5 overflow-hidden">
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
              <h2 className="section-title text-2xl font-semibold">FAQ</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {faqs.map(([question, answer]) => (
                <div key={question} className="detail-cell p-3">
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

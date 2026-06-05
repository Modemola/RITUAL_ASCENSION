import Link from "next/link";
import { Check, LoaderCircle, Wallet } from "lucide-react";
import { builderClasses } from "@/lib/data";

export default function OnboardingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 grid gap-3 md:grid-cols-3 fade-in">
        {["Connect Wallet", "Choose Class", "Mint Passport"].map((step, index) => (
          <div key={step} className="rune-panel flex items-center gap-3 p-4 scale-in-stagger hover-lift" style={{ "--index": index } as React.CSSProperties}>
            <span className="grid size-9 place-items-center rounded-full border border-cyan/30 font-mono text-cyan">0{index + 1}</span>
            <span className="font-medium">{step}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="rune-panel h-fit p-6 fade-in-delay-1">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Onboarding ritual</p>
          <h1 className="mt-3 text-4xl font-semibold slide-up">Mint your Soulbound Passport.</h1>
          <p className="mt-4 leading-7 text-muted">
            Connect a wallet, select a permanent class, then send the mint transaction. Production will wire this into Wagmi, SIWE, and PassportNFT.mintPassport.
          </p>
          <button className="rune-button mt-6 inline-flex items-center gap-2 px-4 py-3 font-semibold button-press hover-lift">
            <Wallet className="size-4" />
            Connect Wallet
          </button>
          <div className="mt-6 border border-cyan/15 bg-black/25 p-4 pulse-subtle">
            <div className="flex items-center gap-3 text-sm text-muted">
              <LoaderCircle className="size-4 animate-spin text-cyan" />
              Awaiting ritual signature
            </div>
          </div>
        </section>
        <section className="grid gap-3 md:grid-cols-2">
          {builderClasses.map((builderClass, i) => (
            <article key={builderClass.id} className={builderClass.id === 1 ? "rune-panel border-cyan/45 p-5 shadow-rune scale-in-stagger hover-lift hover-glow" : "rune-panel p-5 scale-in-stagger hover-lift"} style={{ "--index": i } as React.CSSProperties}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-cyan">CLASS {builderClass.id}</p>
                  <h2 className="mt-2 text-xl font-semibold">{builderClass.name}</h2>
                </div>
                {builderClass.id === 1 ? <Check className="size-5 text-green pop-in" /> : null}
              </div>
              <p className="mt-3 min-h-20 text-sm leading-6 text-muted">{builderClass.focus}</p>
              <p className="mt-4 border-t border-cyan/10 pt-3 text-sm font-medium text-cyan">{builderClass.achievement}</p>
            </article>
          ))}
          <Link href="/dashboard" className="rune-button inline-flex items-center justify-center px-4 py-3 font-semibold button-press hover-lift md:col-span-2">
            Continue with Builder
          </Link>
        </section>
      </div>
    </main>
  );
}

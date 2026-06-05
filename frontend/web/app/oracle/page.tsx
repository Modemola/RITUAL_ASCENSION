import { Bot, Clock, Send, Sparkles } from "lucide-react";

export default function OraclePage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[330px_1fr]">
      <aside className="rune-panel p-5 fade-in oracle-pulse">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full border border-purple/35 bg-purple/10 shadow-purple oracle-pulse">
            <Bot className="size-6 text-purple" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-purple">Oracle mentor</p>
            <h1 className="text-xl font-semibold">The Oracle</h1>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-muted">
          The production service injects your profile, quest list, achievements, and last 10 turns into the Oracle context.
        </p>
        <div className="mt-5 border border-purple/20 bg-purple/10 p-4">
          <div className="flex items-center gap-2 text-sm text-purple">
            <Clock className="size-4" />
            19 messages remaining today
          </div>
          <div className="mt-3 h-2 overflow-hidden border border-purple/20 bg-black/30">
            <div className="h-full w-[95%] bg-purple" />
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          {["Current path", "Deployment help", "Class quests"].map((thread) => (
            <button key={thread} className="border border-cyan/10 bg-black/20 px-3 py-2 text-left text-sm text-muted hover:text-cyan">{thread}</button>
          ))}
        </div>
      </aside>
      <section className="rune-panel flex min-h-[640px] flex-col overflow-hidden fade-in-delay-1 hover-glow">
        <div className="border-b border-cyan/10 p-4">
          <h2 className="font-semibold">Current thread</h2>
        </div>
        <div className="flex-1 space-y-4 p-4">
          <div className="max-w-2xl border border-cyan/20 bg-cyan/5 p-4 shadow-rune float-message hover-glow">
            <div className="mb-2 flex items-center gap-2 text-cyan">
              <Sparkles className="size-4 oracle-glow" />
              <span className="font-mono text-xs oracle-glow">ORACLE</span>
            </div>
            <p className="text-sm leading-6 text-ink">
              Your next highest-leverage move is to finish the LLM precompile quest. It advances your passport toward the Builder stage and teaches the Ritual AI primitive directly.
            </p>
            <div className="mt-4 border border-cyan/20 bg-black/25 p-3 hover-glow">
              <p className="font-semibold text-cyan">Call the Ritual LLM Precompile</p>
              <p className="mt-1 text-sm text-muted">Recommended because it is already in progress and unlocks an evolution trigger.</p>
            </div>
          </div>
          <div className="ml-auto max-w-2xl border border-purple/25 bg-purple/10 p-4 text-white float-message" style={{ animationDelay: "200ms" }}>
            <p className="text-sm leading-6">What should I do after deploying my first contract?</p>
          </div>
        </div>
        <form className="flex gap-3 border-t border-cyan/10 p-4">
          <input className="min-w-0 flex-1 border border-cyan/15 bg-void px-3 py-2 outline-none placeholder:text-muted focus:border-cyan/50 focus:ring-2 focus:ring-cyan/30" placeholder="Ask the Oracle..." />
          <button className="rune-button grid size-11 place-items-center button-press hover-lift" aria-label="Send message">
            <Send className="size-4" />
          </button>
        </form>
      </section>
    </main>
  );
}

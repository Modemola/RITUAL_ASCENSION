import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { quests } from "@/lib/data";

export default async function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quest = quests.find((item) => item.id === id);
  if (!quest) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 fade-in">
      <Link href="/quests" className="text-sm font-medium text-cyan hover-lift">Back to quests</Link>
      <article className="rune-panel mt-4 p-6 scale-in hover-glow">
        <div className="flex flex-col justify-between gap-3 border-b border-cyan/10 pb-5 sm:flex-row slide-up-delay">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">{quest.type} · {quest.verification}</p>
            <h1 className="mt-3 text-4xl font-semibold">{quest.title}</h1>
          </div>
          <span className="h-fit border border-cyan/25 bg-cyan/10 px-3 py-2 font-mono text-sm font-semibold text-cyan pop-in">{quest.xp} XP</span>
        </div>
        <p className="mt-5 leading-7 text-muted fade-in-delay-1">{quest.description}</p>
        <section className="mt-6 border border-cyan/15 bg-black/25 p-4 fade-in-delay-2 hover-glow">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-green" />
            <h2 className="font-semibold">Verification instructions</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{quest.expectedProof}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input className="min-w-0 flex-1 border border-cyan/15 bg-void px-3 py-2 font-mono text-sm outline-none placeholder:text-muted focus:border-cyan/50 focus:ring-2 focus:ring-cyan/30" placeholder="0x transaction hash or proof URL" />
            <button className="rune-button px-4 py-2 font-semibold button-press hover-lift">Validate Proof</button>
          </div>
        </section>
      </article>
    </main>
  );
}

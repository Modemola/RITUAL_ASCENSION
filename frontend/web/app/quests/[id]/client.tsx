"use client";

import Link from "next/link";
import { ChevronLeft, Share2, Zap } from "lucide-react";
import { useRitual } from "@/lib/store";
import { useForm, validators } from "@/lib/hooks";
import { LoadingSpinner, Toast } from "@/lib/components";
import { useState } from "react";

interface Quest {
  id: string;
  title: string;
  reward: number;
  difficulty: "common" | "uncommon" | "rare" | "legendary";
  category: string;
  description: string;
  steps: string[];
  completedAt?: number;
}

const questData: Record<string, Quest> = {
  "1": {
    id: "1",
    title: "Deploy your first contract",
    reward: 250,
    difficulty: "common",
    category: "Contracts",
    description: "Deploy a simple contract to verify your Hardhat setup works.",
    steps: [
      "Create a new Hardhat project",
      "Write a basic contract",
      "Run deploy script",
      "Submit transaction hash",
    ],
  },
  "2": {
    id: "2",
    title: "Verify a contract on Etherscan",
    reward: 150,
    difficulty: "uncommon",
    category: "Verification",
    description: "Publish your contract source code for transparency.",
    steps: [
      "Get contract address from deployment",
      "Prepare verification inputs",
      "Verify with Etherscan API",
      "Submit verification link",
    ],
  },
  "3": {
    id: "3",
    title: "Build a multi-sig wallet",
    reward: 500,
    difficulty: "rare",
    category: "Advanced",
    description: "Create a contract requiring multiple signatures.",
    steps: [
      "Design authorization logic",
      "Implement proposal system",
      "Deploy and test",
      "Submit proof of execution",
    ],
  },
};

export const QuestDetailClient = ({ questId }: { questId: string }) => {
  const { wallet, isConnected } = useRitual();
  const [submitted, setSubmitted] = useState(false);
  const quest = questData[questId] || questData["1"];

  const form = useForm(
    { proof: "" },
    async (values) => {
      // In production, this would call an API endpoint
      console.log("Submitting proof:", values.proof, "for quest:", questId);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  );

  const difficultyColors: Record<Quest["difficulty"], string> = {
    common: "text-gray-400 border-gray-500/30",
    uncommon: "text-green-400 border-green-500/30",
    rare: "text-blue-400 border-blue-500/30",
    legendary: "text-purple-400 border-purple-500/30",
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/quests" className="inline-flex items-center gap-2 text-muted hover:text-cyan mb-8 fade-in">
        <ChevronLeft className="size-4" />
        Back to Quests
      </Link>

      <header className="mb-8 fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Quest</p>
            <h1 className="mt-2 text-4xl font-semibold">{quest.title}</h1>
            <p className="mt-2 text-muted">{quest.category}</p>
          </div>
          <div className={`rounded border px-3 py-1 font-mono text-xs uppercase tracking-widest ${difficultyColors[quest.difficulty]}`}>
            {quest.difficulty}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <section className="space-y-6">
          {/* Description */}
          <div className="rune-panel p-6 fade-in-delay-1">
            <h2 className="text-xl font-semibold mb-3">Description</h2>
            <p className="text-muted leading-relaxed">{quest.description}</p>
          </div>

          {/* Steps */}
          <div className="rune-panel p-6 fade-in-delay-2">
            <h2 className="text-xl font-semibold mb-4">Steps</h2>
            <ol className="space-y-3">
              {quest.steps.map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 font-mono text-sm font-bold text-cyan">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-muted">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Proof Submission */}
          <div className="rune-panel p-6 fade-in-delay-3">
            <h2 className="text-xl font-semibold mb-4">Submit Proof</h2>
            {!isConnected ? (
              <div className="border border-orange-500/30 bg-orange-500/5 rounded p-4 text-center text-muted">
                Connect your wallet to submit proof.
              </div>
            ) : (
              <form onSubmit={form.handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Proof (transaction hash or URL)
                  </label>
                  <textarea
                    name="proof"
                    value={form.values.proof}
                    onChange={form.handleChange}
                    placeholder="0x... or https://..."
                    className="w-full border border-cyan/15 bg-void px-3 py-2 outline-none placeholder:text-muted focus:border-cyan/50 focus:ring-2 focus:ring-cyan/30 rounded font-mono text-sm"
                    rows={4}
                  />
                  {form.errors.proof && (
                    <p className="mt-1 text-sm text-red-400">{form.errors.proof}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={form.isSubmitting}
                  className="w-full rune-button px-4 py-2 font-semibold button-press hover-lift disabled:opacity-50"
                >
                  {form.isSubmitting ? "Submitting..." : "Submit Proof"}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Reward Card */}
          <div className="rune-panel p-5 text-center fade-in-delay-1">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan mb-1">Reward</p>
            <p className="text-3xl font-semibold flex items-center justify-center gap-2">
              <Zap className="size-6 text-gold" />
              {quest.reward}
            </p>
            <p className="mt-2 text-xs text-muted">Experience Points</p>
          </div>

          {/* Status */}
          <div className="rune-panel p-5 fade-in-delay-2">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan mb-2">Status</p>
            {quest.completedAt ? (
              <div className="rounded border border-green-500/30 bg-green-500/5 px-3 py-2 text-center">
                <p className="text-sm text-green-400">Completed</p>
              </div>
            ) : (
              <div className="rounded border border-cyan/30 bg-cyan/5 px-3 py-2 text-center">
                <p className="text-sm text-cyan">In Progress</p>
              </div>
            )}
          </div>

          {/* Share */}
          <button className="rune-button w-full inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold button-press hover-lift">
            <Share2 className="size-4" />
            Share Quest
          </button>
        </aside>
      </div>

      {/* Success Toast */}
      {submitted && (
        <Toast
          type="success"
          message="Proof submitted! Validators are reviewing..."
          onClose={() => setSubmitted(false)}
        />
      )}
    </main>
  );
};

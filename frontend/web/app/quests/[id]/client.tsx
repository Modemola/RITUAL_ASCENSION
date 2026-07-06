"use client";

import Link from "next/link";
import { ChevronLeft, MessageCircle, Share2, TestTube2, Wallet, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { apiClient, QuestAttempt, VerificationData } from "@/lib/api";
import { quests } from "@/lib/data";
import { Toast } from "@/lib/components";
import { useForm } from "@/lib/hooks";
import { useRitual } from "@/lib/store";

const difficultyColors = {
  common: "text-gray-400 border-gray-500/30",
  uncommon: "text-green-400 border-green-500/30",
  rare: "text-blue-400 border-blue-500/30",
  epic: "text-purple-400 border-purple-500/30",
  legendary: "text-gold border-gold/40",
};

export const QuestDetailClient = ({ questId }: { questId: string }) => {
  const { wallet, authToken, isConnected, identityLink, connectDiscord } = useRitual();
  const [discordId, setDiscordId] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [verification, setVerification] = useState<VerificationData["verification"] | null>(null);
  const [attempt, setAttempt] = useState<QuestAttempt | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const quest = useMemo(() => quests.find((item) => item.id === questId) ?? quests[0], [questId]);

  const form = useForm(
    { proof: "" },
    async (values) => {
      const response = await apiClient.verifyQuest(
        quest.id,
        {
          wallet: wallet ?? undefined,
          discordId: identityLink?.discordId,
          proof: values.proof,
        },
        authToken ?? undefined
      );

      if (response.error || !response.data) {
        throw new Error(response.error || "Verification failed");
      }

      setAttempt(response.data.attempt ?? null);
      setVerification(response.data.verification);
      setToast({
        type: response.data.verification.ok ? "success" : "error",
        message: response.data.verification.reason,
      });
    }
  );

  const handleDiscordConnect = async () => {
    try {
      const link = await connectDiscord(discordId, discordUsername);
      setToast({ type: "success", message: `${link.discordUsername} is linked to this passport.` });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Discord connection failed" });
    }
  };

  const handleStartQuest = async () => {
    if (!wallet) {
      setToast({ type: "error", message: "Connect your wallet before starting this task." });
      return;
    }

    const response = await apiClient.startQuest(quest.id, wallet, authToken ?? undefined);
    if (response.error || !response.data) {
      setToast({ type: "error", message: response.error || "Failed to start quest" });
      return;
    }

    setAttempt(response.data.attempt);
    setToast({ type: "success", message: "Quest started for this passport." });
  };

  const needsWallet = quest.category === "testers" || quest.category === "builders";
  const needsDiscord = quest.category === "discord";
  const canVerify = (!needsWallet || isConnected) && (!needsDiscord || Boolean(identityLink));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/quests" className="mb-8 inline-flex items-center gap-2 text-muted hover:text-cyan fade-in">
        <ChevronLeft className="size-4" />
        Back to quests
      </Link>

      <header className="mb-8 fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-cipher text-xs uppercase tracking-[0.22em]">{quest.category} task</p>
            <h1 className="display-title text-aurora mt-2 text-4xl">{quest.title}</h1>
            <p className="mt-2 text-muted">{quest.verification}</p>
          </div>
          <div className={`status-pill px-3 py-1 font-mono text-xs uppercase tracking-widest ${difficultyColors[quest.difficulty]}`}>
            {quest.difficulty}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="space-y-6">
          <div className="rune-panel p-6 fade-in-delay-1">
            <h2 className="section-title mb-3 text-xl font-semibold">Description</h2>
            <p className="copy-muted">{quest.description}</p>
          </div>

          <div className="rune-panel p-6 fade-in-delay-2">
            <h2 className="section-title mb-4 text-xl font-semibold">Steps</h2>
            <ol className="space-y-3">
              {quest.steps.map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 font-mono text-sm font-bold text-cyan">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-muted">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {quest.category === "testers" ? (
            <div className="rune-panel p-6 fade-in-delay-3">
              <div className="flex items-center gap-2">
                <TestTube2 className="size-5 text-cyan" />
                <h2 className="section-title text-xl font-semibold">Ritual testnet wallet check</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                This verifier only considers indexed activity from the Ritual blockchain testnet. Production should
                connect this to a Ritual RPC, explorer, or indexer.
              </p>
            </div>
          ) : null}

          {quest.category === "discord" ? (
            <div className="rune-panel p-6 fade-in-delay-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5 text-cyan" />
                <h2 className="section-title text-xl font-semibold">Linked Discord</h2>
              </div>
              {identityLink ? (
                <div className="detail-cell mt-4 border-green/30 bg-green/10 p-4 text-sm">
                  <p className="font-mono text-green">{identityLink.discordUsername}</p>
                  <p className="mt-1 text-muted">{identityLink.discordId}</p>
                  <p className="mt-3 text-muted">Discord tasks will always check this linked Discord account.</p>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input
                      value={discordId}
                      onChange={(event) => setDiscordId(event.target.value)}
                      className="detail-cell px-3 py-2 outline-none placeholder:text-muted focus:border-cyan/50 focus:ring-2 focus:ring-cyan/30"
                      placeholder="Discord ID"
                    />
                    <input
                      value={discordUsername}
                      onChange={(event) => setDiscordUsername(event.target.value)}
                      className="detail-cell px-3 py-2 outline-none placeholder:text-muted focus:border-cyan/50 focus:ring-2 focus:ring-cyan/30"
                      placeholder="Discord username"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDiscordConnect}
                    disabled={!isConnected}
                    className="rune-button mt-4 inline-flex items-center gap-2 px-4 py-2 font-semibold button-press hover-lift disabled:opacity-50"
                  >
                    <MessageCircle className="size-4" />
                    Link Discord to Passport
                  </button>
                </>
              )}
            </div>
          ) : null}

          <div className="rune-panel p-6 fade-in-delay-3">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="section-title text-xl font-semibold">Verify Task</h2>
              {attempt ? (
                <span className="status-pill px-2.5 py-1 font-mono text-xs uppercase">
                  {attempt.status}
                </span>
              ) : null}
            </div>
            {needsWallet && !isConnected ? (
              <div className="detail-cell border-orange-500/30 bg-orange-500/5 p-4 text-center text-muted">
                Connect your wallet before verifying this task.
              </div>
            ) : needsDiscord && !identityLink ? (
              <div className="detail-cell border-orange-500/30 bg-orange-500/5 p-4 text-center text-muted">
                Link the Discord account tied to this passport before verifying this task.
              </div>
            ) : (
              <form onSubmit={form.handleSubmit} className="space-y-4">
                {!attempt ? (
                  <button
                    type="button"
                    onClick={handleStartQuest}
                    className="quiet-button w-full px-4 py-2 font-semibold"
                  >
                    Start Quest
                  </button>
                ) : null}
                <div>
                  <label className="mb-2 block text-sm font-medium">Proof or note</label>
                  <textarea
                    name="proof"
                    value={form.values.proof}
                    onChange={form.handleChange}
                    placeholder={quest.expectedProof}
                    className="detail-cell w-full px-3 py-2 font-mono text-sm outline-none placeholder:text-muted focus:border-cyan/50 focus:ring-2 focus:ring-cyan/30"
                    rows={4}
                  />
                </div>
                <button
                  type="submit"
                  disabled={form.isSubmitting || !canVerify}
                  className="w-full rune-button px-4 py-2 font-semibold button-press hover-lift disabled:opacity-50"
                >
                  {form.isSubmitting ? "Verifying..." : "Run Verification"}
                </button>
              </form>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rune-panel p-5 text-center fade-in-delay-1">
            <p className="text-cipher mb-1 text-xs uppercase tracking-widest">Reward</p>
            <p className="section-title flex items-center justify-center gap-2 text-3xl font-semibold">
              <Zap className="size-6 text-gold" />
              {quest.xp}
            </p>
            <p className="mt-2 text-xs text-muted">Experience Points</p>
          </div>

          <div className="rune-panel p-5 fade-in-delay-2">
            <p className="text-cipher mb-2 text-xs uppercase tracking-widest">Verification</p>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted">Method</span>
                <span className="font-mono">{quest.verification}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Limit</span>
                <span className="font-mono">{quest.limit ? `${quest.limit} claim` : "Review based"}</span>
              </div>
              {quest.target ? (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Target</span>
                  <span className="font-mono">{quest.target}</span>
                </div>
              ) : null}
            </div>
          </div>

          {verification ? (
            <div className={`rune-panel p-5 fade-in-delay-2 ${verification.ok ? "border-green/35" : "border-red-500/35"}`}>
              <p className="text-cipher mb-2 text-xs uppercase tracking-widest">Result</p>
              <p className={verification.ok ? "text-green" : "text-red-400"}>{verification.reason}</p>
              {verification.value !== undefined ? (
                <p className="mt-3 font-mono text-sm text-muted">
                  {verification.value} / {verification.required}
                </p>
              ) : null}
            </div>
          ) : null}

          <button className="rune-button inline-flex w-full items-center justify-center gap-2 px-4 py-2 font-semibold button-press hover-lift">
            <Share2 className="size-4" />
            Share Task
          </button>

          {isConnected ? (
            <div className="rune-panel grid gap-3 p-4 text-xs text-muted">
              <div className="flex items-center gap-2 min-w-0">
                <Wallet className="size-4 text-cyan" />
                <span className="break-all font-mono">{wallet}</span>
              </div>
              {identityLink ? (
                <div className="flex items-center gap-2 min-w-0">
                  <MessageCircle className="size-4 text-cyan" />
                  <span className="break-all font-mono">{identityLink.discordId}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>

      {toast ? <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} /> : null}
    </main>
  );
};

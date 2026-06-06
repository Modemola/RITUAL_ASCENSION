"use client";

import Link from "next/link";
import { Activity, BadgeCheck, Bot, ChevronRight, Flame, Hexagon, MessageCircle, Shield, Sparkles, Wallet } from "lucide-react";
import { useEffect } from "react";
import { appClass, appProgress, appReputation, appTier, demoIdentityLink, demoPassport, evolutionStages, quests } from "@/lib/data";
import { useRitual } from "@/lib/store";
import { LoadingSpinner, Skeleton, SkeletonText } from "@/lib/components";
import { PrivateGate } from "@/lib/private-gate";

export default function DashboardPage() {
  const { wallet, isConnected, passport, isLoading, identityLink } = useRitual();
  const activeQuest = quests.find((quest) => quest.status === "in_progress") ?? quests[0];

  // In production, passport would come from API
  const displayPassport = passport || demoPassport;
  const displayClass = appClass;
  const displayProgress = appProgress;
  const displayReputation = appReputation;
  const displayTier = appTier;
  const displayIdentity = identityLink ?? demoIdentityLink;
  const displayWallet = wallet ?? displayPassport.wallet;
  const discordInitial = displayIdentity.discordUsername.slice(0, 1).toUpperCase();

  return (
    <PrivateGate>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end fade-in">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Builder dashboard</p>
          {isLoading ? (
            <SkeletonText width={300} className="mt-2" />
          ) : (
            <h1 className="mt-2 text-4xl font-semibold">
              Welcome back, {displayClass.name}.
            </h1>
          )}
        </div>
        {isConnected && (
          <Link
            href={`/profile/${wallet}`}
            className="inline-flex items-center gap-2 border border-cyan/20 bg-panel/70 px-4 py-2 text-sm font-medium text-cyan hover-lift"
          >
            Public profile <ChevronRight className="size-4" />
          </Link>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        {isLoading ? (
          <Skeleton height={460} className="min-h-[460px]" />
        ) : (
          <section className="passport-art pulse-rune min-h-[460px] border border-cyan/25 p-5 text-white shadow-rune scale-in">
            <div className="flex h-full flex-col justify-between border border-white/15 bg-black/35 p-5 backdrop-blur">
              <div className="flex items-start justify-between">
                <div className="slide-up-delay">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan/75">
                    Soulbound Passport
                  </p>
                  <h2 className="mt-2 text-5xl font-semibold">#{displayPassport.tokenId}</h2>
                </div>
                <div className="grid size-24 place-items-center rounded-full border border-cyan/30 bg-cyan/10 text-center shadow-rune pop-in">
                  <span className="font-mono text-xs text-cyan">REP</span>
                  <span className="font-mono text-3xl">{displayReputation}</span>
                </div>
              </div>
              <div className="ascend">
                <p className="text-3xl font-semibold">{displayClass.name}</p>
                <p className="mt-2 max-w-xl text-white/68">{displayClass.focus}</p>
                <div className="mt-6 h-4 overflow-hidden border border-cyan/25 bg-black/45">
                  <div
                    className="h-full bg-gradient-to-r from-cyan via-aqua to-green progress-fill"
                    style={{ width: `${displayProgress.percent}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between font-mono text-sm text-white/70">
                  <span>LVL {displayProgress.level} - {displayTier}</span>
                  <span>{displayPassport.xp} / {displayProgress.nextXp} XP</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["XP Today", "+850", Flame],
              ["Streak", "7d", Activity],
              ["Stage", `0${displayPassport.stage}`, Hexagon],
            ].map(([label, value, Icon], i) => (
              <div
                key={label as string}
                className="rune-panel p-4 scale-in-stagger hover-lift"
                style={{ "--index": i } as React.CSSProperties}
              >
                {isLoading ? (
                  <>
                    <Skeleton width={20} height={20} />
                    <SkeletonText width={80} className="mt-4" />
                    <SkeletonText width={40} className="mt-1" />
                  </>
                ) : (
                  <>
                    <Icon className="size-5 text-cyan" />
                    <p className="mt-4 text-sm text-muted">{label as string}</p>
                    <p className="mt-1 font-mono text-3xl font-semibold text-ink">{value as string}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="rune-panel p-5 fade-in-delay-1 hover-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Linked identity</p>
              </div>
              <BadgeCheck className="size-6 text-green" />
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="border border-cyan/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center gap-2 text-muted">
                  <Wallet className="size-4 text-cyan" />
                  <span>Bound wallet</span>
                </div>
                <p className="break-all font-mono text-ink">{displayWallet}</p>
              </div>
              <div className="border border-cyan/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center gap-2 text-muted">
                  <MessageCircle className="size-4 text-cyan" />
                  <span>Linked Discord</span>
                </div>
                <div className="flex items-center gap-3">
                  {displayIdentity.discordAvatarUrl ? (
                    <img
                      src={displayIdentity.discordAvatarUrl}
                      alt=""
                      className="size-11 rounded-full border border-cyan/25 bg-black/40"
                    />
                  ) : (
                    <span className="grid size-11 place-items-center rounded-full border border-cyan/25 bg-cyan/10 font-mono text-sm text-cyan">
                      {discordInitial}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-ink">{displayIdentity.discordUsername}</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted">{displayIdentity.discordId}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border border-cyan/10 bg-black/20 p-3 font-mono text-sm">
                <span className="text-muted">Passport token</span>
                <span className="text-cyan">#{displayPassport.tokenId}</span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              Wallet and Discord verifications only check these linked accounts.
            </p>
          </div>

          <div className="rune-panel p-5 fade-in-delay-2 hover-glow">
            <div className="flex items-center gap-2">
              <Bot className="size-5 text-purple" />
              <h2 className="text-xl font-semibold">Oracle recommendation</h2>
            </div>
            <p className="mt-3 leading-7 text-muted">
              Finish <span className="font-medium text-cyan">{activeQuest.title}</span>. It is already in
              progress and moves your passport toward the next evolution stage.
            </p>
            <Link href="/oracle" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan hover-lift">
              Open Oracle <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="rune-panel p-5 fade-in-delay-3 hover-glow">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-cyan" />
              <h2 className="text-xl font-semibold">Recent activity</h2>
            </div>
            <div className="mt-4 grid gap-3 font-mono text-sm">
              {["+500 XP - Deploy Contract verified", "ACH_001 - First Blood unlocked", "Stage 2 - Initiate ignition complete"].map(
                (item, i) => (
                  <div
                    key={item}
                    className="border border-cyan/10 bg-black/20 p-3 text-muted float-message"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="mt-5 rune-panel p-5 fade-in-delay-2">
        <h2 className="text-2xl font-semibold">Evolution timeline</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {evolutionStages.map((stage, i) => (
            <div
              key={stage.id}
              className={
                stage.id === displayPassport.stage
                  ? "border border-cyan/40 bg-cyan/10 p-4 shadow-rune scale-in-stagger hover-lift"
                  : "border border-cyan/15 bg-black/20 p-4 scale-in-stagger hover-lift"
              }
              style={{ "--index": i } as React.CSSProperties}
            >
              <div className="flex items-center gap-2">
                {stage.id <= displayPassport.stage ? (
                  <BadgeCheck className="size-5 text-green" />
                ) : (
                  <Shield className="size-5 text-muted" />
                )}
                <span className="font-mono text-sm text-cyan">0{stage.id}</span>
              </div>
              <h3 className="mt-3 font-semibold">{stage.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{stage.trigger}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
    </PrivateGate>
  );
}

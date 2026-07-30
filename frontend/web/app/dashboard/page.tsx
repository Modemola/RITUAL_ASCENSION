"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, BadgeCheck, Bot, ChevronRight, Flame, Hexagon, MessageCircle, Shield, Wallet } from "lucide-react";
import { appClass, appProgress, appReputation, appTier, demoIdentityLink, demoPassport, evolutionStages, getTier, quests as staticQuests } from "@/lib/data";
import { apiClient, ActivityFeedItem } from "@/lib/api";
import type { Quest } from "@ritual/domain";
import { useRitual } from "@/lib/store";
import { usePreferences } from "@/lib/hooks";
import { Skeleton, SkeletonText } from "@/lib/components";
import { PrivateGate } from "@/lib/private-gate";

export default function DashboardPage() {
  const { wallet, authToken, isConnected, passport, isLoading, identityLink } = useRitual();
  const prefs = usePreferences();
  const [activity, setActivity] = useState<ActivityFeedItem[]>([]);
  const [liveQuests, setLiveQuests] = useState<Quest[]>(staticQuests);

  useEffect(() => {
    if (!wallet || !isConnected) return;
    apiClient.getActivity(wallet, authToken ?? undefined, 8).then(res => {
      if (res.data) setActivity(res.data.activity);
    });
    apiClient.getQuests({ wallet }).then(res => {
      if (res.data) setLiveQuests(res.data.quests);
    });
  }, [wallet, isConnected, authToken]);

  const activeQuest =
    liveQuests.find((quest) => quest.status === "in_progress") ??
    liveQuests.find((quest) => quest.status === "available") ??
    liveQuests[0];

  const today = new Date().toDateString();
  const xpToday = activity
    .filter(item => item.type === "xp_awarded" && new Date(item.createdAt).toDateString() === today)
    .reduce((sum, item) => sum + (Number(item.metadata?.amount) || 0), 0);
  const xpTodayDisplay = activity.length === 0 ? "—" : xpToday > 0 ? `+${xpToday}` : "0";

  const displayPassport = passport || demoPassport;
  const displayClass = passport?.class ?? appClass;
  const displayProgress = passport?.levelProgress ?? appProgress;
  const displayReputation = passport?.reputation ?? appReputation;
  const displayTier = passport ? getTier(passport.level) : appTier;
  const displayIdentity = identityLink ?? demoIdentityLink;
  const displayWallet = wallet ?? displayPassport.wallet;
  const discordInitial = displayIdentity.discordUsername.slice(0, 1).toUpperCase();

  return (
    <PrivateGate>
    <main className="art-surface mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end fade-in">
        <div>
          <p className="text-cipher text-xs uppercase tracking-[0.22em]">Builder dashboard</p>
          {isLoading ? (
            <SkeletonText width={300} className="mt-2" />
          ) : (
            <h1 className="display-title text-aurora mt-2 text-4xl">
              Welcome back, {displayClass.name}.
            </h1>
          )}
        </div>
        {isConnected && (
          <Link
            href={`/profile/${wallet}`}
            className="quiet-button inline-flex items-center gap-2 px-4 py-2 text-sm font-medium hover-lift"
          >
            Public profile <ChevronRight className="size-4" />
          </Link>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        {isLoading ? (
          <Skeleton height={460} className="min-h-[460px]" />
        ) : (
          <section className="passport-art art-surface pulse-rune min-h-[460px] border border-cyan/25 p-5 text-white shadow-rune scale-in">
            <div className="passport-frame flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between">
                <div className="slide-up-delay">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan/75">
                    Soulbound Passport
                  </p>
                  <h2 className="display-title text-aurora mt-2 text-5xl">#{displayPassport.tokenId}</h2>
                </div>
                <div className="grid size-24 place-items-center rounded-full border border-cyan/30 bg-cyan/10 text-center shadow-rune pop-in">
                  <span className="font-mono text-xs text-cyan">REP</span>
                  <span className="font-mono text-3xl">{displayReputation}</span>
                </div>
              </div>
              <div className="ascend">
                <p className="section-title text-3xl font-semibold">{displayClass.name}</p>
                <p className="mt-2 max-w-xl text-white/68">{displayClass.focus}</p>
                <div className="mt-6 h-4 overflow-hidden rounded-full border border-cyan/25 bg-black/45">
                  <div
                    className={`h-full bg-gradient-to-r from-cyan via-aqua to-green ${prefs.xpAnimations ? "progress-fill" : ""}`}
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
              ["XP Today", xpTodayDisplay, Flame],
              ["Active weeks", `${displayPassport.activeWeeks}w`, Activity],
              ["Stage", `0${displayPassport.stage}`, Hexagon],
            ].map(([label, value, Icon], i) => (
              <div
                key={label as string}
                className="rune-panel card-shift p-4 scale-in-stagger hover-lift"
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
                <p className="text-cipher text-xs uppercase tracking-[0.22em]">Linked identity</p>
              </div>
              <BadgeCheck className="size-6 text-green" />
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="detail-cell p-3">
                <div className="mb-2 flex items-center gap-2 text-muted">
                  <Wallet className="size-4 text-cyan" />
                  <span>Bound wallet</span>
                </div>
                <p className="break-all font-mono text-ink">{displayWallet}</p>
              </div>
              <div className="detail-cell p-3">
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
              <div className="detail-cell flex items-center justify-between p-3 font-mono text-sm">
                <span className="text-muted">Passport token</span>
                <span className="text-cyan">#{displayPassport.tokenId}</span>
              </div>
            </div>
            <p className="copy-muted mt-4 text-sm">
              Wallet and Discord verifications only check these linked accounts.
            </p>
          </div>

          <div className="rune-panel p-5 fade-in-delay-2 hover-glow">
            <div className="flex items-center gap-2">
              <Bot className="size-5 text-purple" />
              <h2 className="section-title text-xl font-semibold">Oracle recommendation</h2>
            </div>
            <p className="mt-3 leading-7 text-muted">
              {activeQuest ? (
                <>
                  {activeQuest.status === "in_progress" ? "Finish" : "Try"}{" "}
                  <span className="font-medium text-cyan">{activeQuest.title}</span> next. It moves your passport
                  toward the next evolution stage.
                </>
              ) : (
                "You're caught up on every available quest — check back soon for more."
              )}
            </p>
            <Link href="/oracle" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan hover-lift">
              Open Oracle <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="rune-panel p-5 fade-in-delay-3 hover-glow">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-cyan" />
              <h2 className="section-title text-xl font-semibold">Recent activity</h2>
            </div>
            <div className="mt-4 grid gap-3 font-mono text-sm">
              {activity.length === 0 ? (
                <p className="text-muted py-2">No activity yet. Complete a quest to get started.</p>
              ) : (
                activity.slice(0, 5).map((item, i) => (
                  <div
                    key={item.id}
                    className="detail-cell p-3 text-muted float-message"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <span className={item.type === "xp_awarded" ? "text-cyan" : item.type === "achievement_unlocked" ? "text-gold" : "text-purple"}>
                      {item.title}
                    </span>
                    {item.description && item.description !== item.title && (
                      <span className="ml-2 text-white/50">{item.description}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="mt-5 rune-panel p-5 fade-in-delay-2">
        <h2 className="section-title energy-thread inline-block text-2xl font-semibold">Evolution timeline</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {evolutionStages.map((stage, i) => (
            <div
              key={stage.id}
              className={
                stage.id === displayPassport.stage
                  ? "detail-cell card-shift border-cyan/40 bg-cyan/10 p-4 shadow-rune scale-in-stagger hover-lift"
                  : "detail-cell card-shift p-4 scale-in-stagger hover-lift"
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
              <h3 className="section-title mt-3 font-semibold">{stage.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{stage.trigger}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
    </PrivateGate>
  );
}

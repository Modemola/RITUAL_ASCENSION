"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LoadingSpinner } from "@/lib/components";
import { apiClient, ProfileData } from "@/lib/api";
import { achievements as allAchievements, appClass, appProgress, appReputation, demoPassport, quests } from "@/lib/data";

export default function PublicProfilePage() {
  const params = useParams();
  const walletParam = (params?.wallet ?? "") as string;
  const [profile, setProfile] = useState<ProfileData["profile"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!walletParam) return;
    setIsLoading(true);
    apiClient.getProfile(walletParam)
      .then(res => {
        if (res.data) {
          setProfile(res.data.profile);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [walletParam]);

  const displayPassport = profile?.passport ?? demoPassport;
  const className = profile?.passport?.class?.name ?? appClass.name;
  const level = profile?.passport?.level ?? appProgress.level;
  const reputation = profile?.passport?.reputation ?? appReputation;
  const completed = quests.filter(q => displayPassport.completedQuestIds.includes(q.id));
  // Only fall back to demo "unlocked" badges when there's no real profile at all —
  // a real profile with zero achievements should show zero, not someone else's demo badges.
  const unlockedAchievements = profile
    ? (profile.achievements ?? [])
    : allAchievements.filter(a => a.unlocked);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 text-center">
        <LoadingSpinner size="lg" message="Loading profile..." />
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 fade-in">
        <p className="text-cipher text-xs uppercase tracking-[0.22em]">Public profile</p>
        <h1 className="mt-2 break-all font-mono text-2xl font-semibold sm:text-4xl slide-up">{walletParam}</h1>
        <div className="rune-panel mt-8 p-8 text-center">
          <p className="section-title text-xl font-semibold">No passport found</p>
          <p className="copy-muted mt-2">This wallet has not minted a Soulbound Passport yet.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 fade-in">
      <p className="text-cipher text-xs uppercase tracking-[0.22em]">Public profile</p>
      <h1 className="mt-2 break-all font-mono text-2xl font-semibold sm:text-4xl slide-up">{walletParam}</h1>
      <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden passport-art art-surface pulse-rune min-h-96 border border-cyan/25 p-5 text-white shadow-rune scale-in hover-glow">
          <div aria-hidden="true" className="art-bg art-bg--identity art-bg--panel" />
          <div className="passport-frame relative z-10 flex h-full flex-col justify-between p-5">
            <div className="slide-up-delay">
              <p className="text-cipher text-xs uppercase tracking-[0.24em]">Passport #{displayPassport.tokenId}</p>
              <h2 className="display-title text-aurora mt-2 text-5xl">{className}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Level", level],
                ["Stage", displayPassport.stage],
                ["Rep", reputation],
              ].map(([label, value], i) => (
                <div key={label as string} className="metric-tile p-3 scale-in-stagger" style={{ "--index": i } as React.CSSProperties}>
                  <p className="text-sm text-white/60">{label}</p>
                  <p className="font-mono text-2xl font-semibold text-cyan">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-5">
          <section className="rune-panel p-5 fade-in-delay-1 hover-glow">
            <h2 className="section-title text-xl font-semibold">Unlocked achievements</h2>
            {unlockedAchievements.length === 0 ? (
              <p className="copy-muted mt-3 text-sm">No achievements unlocked yet.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {unlockedAchievements.map((achievement, i) => (
                  <span
                    key={achievement.id}
                    className="status-pill px-3 py-2 text-sm pop-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {achievement.name}
                  </span>
                ))}
              </div>
            )}
          </section>
          <section className="rune-panel p-5 fade-in-delay-2 hover-glow">
            <h2 className="section-title text-xl font-semibold">Completed quests</h2>
            {completed.length === 0 ? (
              <p className="copy-muted mt-3 text-sm">No quests completed yet.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {completed.map((quest, i) => (
                  <div key={quest.id} className="detail-cell p-3 float-message hover-lift" style={{ animationDelay: `${i * 50}ms` }}>
                    <p className="font-medium">{quest.title}</p>
                    <p className="font-mono text-sm text-cyan">{quest.xp} XP</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

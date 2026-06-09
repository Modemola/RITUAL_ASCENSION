"use client";

import { useEffect, useState } from "react";
import { leaderboard as defaultLeaderboard } from "@/lib/data";
import { apiClient, LeaderboardEntry } from "@/lib/api";
import { LoadingSpinner, Skeleton } from "@/lib/components";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(defaultLeaderboard);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getLeaderboard();
        if (response.error) {
          console.warn("Failed to fetch leaderboard, using default data:", response.error);
          setLeaderboard(defaultLeaderboard);
        } else if (response.data) {
          setLeaderboard(response.data.builders);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setLeaderboard(defaultLeaderboard);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const topThree = leaderboard.slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="fade-in">
        <p className="text-cipher text-xs uppercase tracking-[0.22em]">Builder rankings</p>
        <h1 className="display-title text-aurora mt-2 text-4xl">Top Ritual builders.</h1>
        <p className="copy-muted mt-3 max-w-2xl">
          Ranking is calculated from builder tasks only. Tester milestones and Discord tasks still progress the passport, but they do not affect this board.
        </p>
      </div>

      <section className="mt-7 grid items-end gap-4 md:grid-cols-3">
        {isLoading
          ? [0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                height={i === 0 ? 300 : 240}
                className={i === 0 ? "md:-mt-6" : ""}
              />
            ))
          : topThree.map((builder, index) => (
              <article
                key={builder.wallet}
                className={
                  index === 0
                    ? "passport-art min-h-72 border border-gold/40 p-4 shadow-rune md:-mt-6 scale-in-stagger hover-lift hover-glow"
                    : "passport-art min-h-60 border border-cyan/25 p-4 scale-in-stagger hover-lift hover-glow"
                }
                style={{ "--index": index } as React.CSSProperties}
              >
                <div className="passport-frame flex h-full flex-col justify-between p-4">
                  <p className="display-title text-aurora text-4xl pop-in">#{index + 1}</p>
                  <div className="ascend">
                    <p className="font-mono text-sm">{builder.wallet}</p>
                    <p className="text-sm text-white/65">
                      {builder.className} - Level {builder.level}
                    </p>
                    {builder.builderXp ? <p className="text-sm text-white/65">{builder.builderXp} builder XP</p> : null}
                    <p className="mt-3 font-mono text-3xl text-green">{builder.reputation} REP</p>
                  </div>
                </div>
              </article>
            ))}
      </section>

      <section className="rune-panel mt-6 overflow-hidden fade-in-delay-1">
        {isLoading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="md" message="Loading leaderboard..." />
          </div>
        ) : (
          leaderboard.map((builder, index) => (
            <div
              key={builder.wallet}
              className="grid grid-cols-[56px_1fr_80px_90px] items-center gap-3 border-b border-cyan/10 p-4 last:border-b-0 float-message hover-lift"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <span className="font-mono text-xl text-cyan">#{index + 1}</span>
              <div>
                <p className="font-mono text-sm">{builder.wallet}</p>
                <p className="text-sm text-muted">{builder.className}</p>
                {builder.builderXp ? <p className="text-xs text-muted">{builder.builderXp} builder XP</p> : null}
              </div>
              <p className="font-mono text-sm text-muted">LVL {builder.level}</p>
              <p className="text-right font-mono text-2xl text-green">{builder.reputation}</p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

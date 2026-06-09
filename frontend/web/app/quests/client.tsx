"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, Lock, MessageCircle, Search, TestTube2, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { demoDiscordActivity, demoTestnetActivity, questCategories, quests } from "@/lib/data";

const statusIcon = {
  available: Clock3,
  in_progress: ArrowUpRight,
  completed: CheckCircle2,
  locked: Lock,
};

const statusClass = {
  available: "text-cyan border-cyan/30 bg-cyan/10",
  in_progress: "text-amber border-amber/35 bg-amber/10",
  completed: "text-green border-green/35 bg-green/10",
  locked: "text-muted border-white/10 bg-white/5",
};

const categoryIcon = {
  builders: Wrench,
  testers: TestTube2,
  discord: MessageCircle,
};

export function QuestsClient() {
  const [activeCategory, setActiveCategory] = useState("builders");
  const [search, setSearch] = useState("");

  const filteredQuests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return quests.filter((quest) => {
      const matchesCategory = quest.category === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        quest.title.toLowerCase().includes(normalizedSearch) ||
        quest.description.toLowerCase().includes(normalizedSearch) ||
        quest.verification.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const activeCategoryData = questCategories.find((category) => category.id === activeCategory) ?? questCategories[0];
  const ActiveIcon = categoryIcon[activeCategoryData.id];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end fade-in">
        <div>
          <p className="text-cipher text-xs uppercase tracking-[0.22em]">Quest engine</p>
          <h1 className="display-title text-aurora mt-2 text-4xl">Verify progress across Ritual.</h1>
        </div>
      </div>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        {questCategories.map((category) => {
          const Icon = categoryIcon[category.id];
          const isActive = category.id === activeCategory;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`rune-panel card-shift p-4 text-left transition-all hover-lift ${
                isActive ? "border-cyan/45 bg-cyan/10 shadow-rune" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="size-5 text-cyan" />
                <div>
                  <p className="font-semibold">{category.shortName}</p>
                  <p className="text-xs text-muted">{quests.filter((quest) => quest.category === category.id).length} tasks</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{category.description}</p>
            </button>
          );
        })}
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rune-panel p-5">
          <div className="flex items-start gap-3">
            <ActiveIcon className="mt-1 size-5 text-cyan" />
            <div>
              <h2 className="section-title text-2xl font-semibold">{activeCategoryData.name}</h2>
              <p className="mt-2 leading-7 text-muted">{activeCategoryData.verificationSummary}</p>
            </div>
          </div>
        </div>

        <div className="rune-panel grid gap-3 p-5 font-mono text-sm">
          {activeCategory === "testers" ? (
            <>
              <div className="flex justify-between gap-3"><span className="text-muted">Network</span><span>Ritual testnet only</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted">Tasks</span><span>{demoTestnetActivity.completedTasks}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted">Contracts</span><span>{demoTestnetActivity.uniqueContracts}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted">Active days</span><span>{demoTestnetActivity.activeDays}</span></div>
            </>
          ) : activeCategory === "discord" ? (
            <>
              <div className="flex justify-between gap-3"><span className="text-muted">Discord</span><span>{demoDiscordActivity.username}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted">Messages</span><span>{demoDiscordActivity.messages}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted">Roles</span><span>{demoDiscordActivity.roles.join(", ") || "None"}</span></div>
            </>
          ) : (
            <>
              <div className="flex justify-between gap-3"><span className="text-muted">Proofs</span><span>TX / URL / review</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted">Cap</span><span>Manual review</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted">Scope</span><span>Products built on Ritual</span></div>
            </>
          )}
        </div>
      </section>

      <div className="detail-cell mt-5 flex items-center gap-3 px-3 py-2 fade-in-delay-1">
        <Search className="size-4 text-cyan" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted"
          placeholder="Search tasks, proof types, or XP rewards"
        />
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredQuests.map((quest, i) => {
          const Icon = statusIcon[quest.status];
          return (
            <article
              key={quest.id}
              className="rune-panel card-shift flex min-h-72 flex-col justify-between p-5 hover:border-cyan/45 scale-in-stagger hover-lift"
              style={{ "--index": i } as React.CSSProperties}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className="status-pill px-2.5 py-1 font-mono text-xs">{quest.verification}</span>
                  <span className={`rounded-md border p-2 ${statusClass[quest.status]}`}>
                    <Icon className="size-4" />
                  </span>
                </div>
                <h2 className="section-title mt-5 text-xl font-semibold">{quest.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">{quest.description}</p>
              </div>
              <div className="mt-5 border-t border-cyan/10 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-muted">{quest.limit ? `LIMIT ${quest.limit}` : quest.difficulty}</span>
                  <span className="font-mono text-xl font-semibold text-cyan">{quest.xp} XP</span>
                </div>
                <Link
                  href={`/quests/${quest.id}`}
                  className="quiet-button mt-4 inline-flex w-full justify-center px-3 py-2 text-sm font-medium hover-lift"
                >
                  Verify Task
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

import {
  achievements,
  calculateReputation,
  getQuest
} from "@ritual/domain";
import type { Achievement, PassportProfile, Quest } from "@ritual/domain";
import type { PassportRepository } from "../repositories/passport-repository.js";
import { getPassportProgressCounters } from "../repositories/passport-repository.js";
import type { QuestAttempt } from "../repositories/quest-attempt-repository.js";
import type {
  AchievementUnlock,
  EvolutionEvent,
  ProgressionRepository,
  XpEvent
} from "../repositories/progression-repository.js";
import { DisabledRitualChainWriter } from "../chain/ritual-chain-client.js";
import type { RitualChainWriter } from "../chain/ritual-chain-client.js";

export interface ProgressionResult {
  passport: ReturnType<typeof formatProgressionPassport>;
  xpEvents: XpEvent[];
  unlockedAchievements: Achievement[];
  evolutionEvents: EvolutionEvent[];
}

export class ProgressionService {
  constructor(
    private readonly passports: PassportRepository,
    private readonly progression: ProgressionRepository,
    private readonly chainWriter: RitualChainWriter = new DisabledRitualChainWriter()
  ) {}

  // Off-chain repositories are the source of truth for the API response —
  // the on-chain settlement happens after and never blocks or fails the request.
  // Always attach a catch handler (even when disabled) so the rejection from
  // DisabledRitualChainWriter never surfaces as an unhandled promise rejection.
  private settleOnChain(promise: Promise<unknown>, context: Record<string, unknown>) {
    promise.catch((error) => {
      if (!this.chainWriter.isConfigured()) return;
      console.error(JSON.stringify({
        level: "error",
        event: "chain_write_failed",
        message: error instanceof Error ? error.message : String(error),
        ...context
      }));
    });
  }

  async applyQuestCompletion(attempt: QuestAttempt): Promise<ProgressionResult | null> {
    const quest = getQuest(attempt.questId);
    if (!quest) return null;

    const passport = await this.passports.findByWallet(attempt.wallet);
    if (!passport) return null;

    const xpEvents: XpEvent[] = [];
    const unlockedAchievements: Achievement[] = [];
    const evolutionEvents: EvolutionEvent[] = [];
    const completedQuestIds = passport.completedQuestIds.includes(quest.id)
      ? passport.completedQuestIds
      : [...passport.completedQuestIds, quest.id];

    const questXp = await this.progression.awardXp({
      wallet: passport.wallet,
      amount: quest.xp,
      reason: `Quest completed: ${quest.title}`,
      sourceRef: `quest:${passport.wallet}:${quest.id}`,
      questAttemptId: attempt.id
    });
    xpEvents.push(questXp.event);
    if (questXp.created) {
      this.settleOnChain(
        this.chainWriter.awardXP(passport.wallet, quest.xp, questXp.event.reason, questXp.event.sourceRef),
        { action: "awardXP", wallet: passport.wallet, sourceRef: questXp.event.sourceRef }
      );
    }

    let nextXp = questXp.created ? passport.xp + quest.xp : passport.xp;
    let nextAchievements = passport.achievements;

    const achievementCandidates = getAchievementCandidates(quest, passport, completedQuestIds);
    for (const achievement of achievementCandidates) {
      const unlock = await this.progression.unlockAchievement({
        wallet: passport.wallet,
        achievementId: achievement.id,
        xpBonus: achievement.xpBonus,
        sourceRef: `achievement:${passport.wallet}:${achievement.id}`
      });

      if (unlock.created) {
        unlockedAchievements.push({ ...achievement, unlocked: true });
        nextAchievements = markAchievementUnlocked(nextAchievements, unlock.unlock);

        if (achievement.xpBonus > 0) {
          const bonusXp = await this.progression.awardXp({
            wallet: passport.wallet,
            amount: achievement.xpBonus,
            reason: `Achievement unlocked: ${achievement.name}`,
            sourceRef: `achievement-bonus:${passport.wallet}:${achievement.id}`
          });
          xpEvents.push(bonusXp.event);
          if (bonusXp.created) {
            nextXp += achievement.xpBonus;
            this.settleOnChain(
              this.chainWriter.awardXP(passport.wallet, achievement.xpBonus, bonusXp.event.reason, bonusXp.event.sourceRef),
              { action: "awardXP", wallet: passport.wallet, sourceRef: bonusXp.event.sourceRef }
            );
          }
        }
      } else {
        nextAchievements = markAchievementUnlocked(nextAchievements, unlock.unlock);
      }
    }

    const counters = getPassportProgressCounters(completedQuestIds);
    let nextPassport: PassportProfile = {
      ...passport,
      xp: nextXp,
      completedQuestIds,
      achievements: nextAchievements,
      ...counters
    };
    const targetStage = getTargetStage(quest, nextPassport);

    if (targetStage > passport.stage) {
      for (let stage = passport.stage + 1; stage <= targetStage; stage += 1) {
        const event = await this.progression.recordEvolution({
          wallet: passport.wallet,
          tokenId: passport.tokenId,
          fromStage: stage - 1,
          toStage: stage,
          reason: getEvolutionReason(stage)
        });
        evolutionEvents.push(event);
      }

      nextPassport = {
        ...nextPassport,
        stage: targetStage
      };
      this.settleOnChain(
        this.chainWriter.updateStage(passport.tokenId, targetStage),
        { action: "updateStage", wallet: passport.wallet, tokenId: passport.tokenId, targetStage }
      );

      const ascendant = achievements.find((achievement) => achievement.id === "ACH_010");
      if (targetStage >= 5 && ascendant) {
        const unlock = await this.progression.unlockAchievement({
          wallet: passport.wallet,
          achievementId: ascendant.id,
          xpBonus: ascendant.xpBonus,
          sourceRef: `achievement:${passport.wallet}:${ascendant.id}`
        });

        nextAchievements = markAchievementUnlocked(nextAchievements, unlock.unlock);
        if (unlock.created) {
          unlockedAchievements.push({ ...ascendant, unlocked: true });
          if (ascendant.xpBonus > 0) {
            const bonusXp = await this.progression.awardXp({
              wallet: passport.wallet,
              amount: ascendant.xpBonus,
              reason: `Achievement unlocked: ${ascendant.name}`,
              sourceRef: `achievement-bonus:${passport.wallet}:${ascendant.id}`
            });
            xpEvents.push(bonusXp.event);
            if (bonusXp.created) {
              nextPassport = { ...nextPassport, xp: nextPassport.xp + ascendant.xpBonus };
              this.settleOnChain(
                this.chainWriter.awardXP(passport.wallet, ascendant.xpBonus, bonusXp.event.reason, bonusXp.event.sourceRef),
                { action: "awardXP", wallet: passport.wallet, sourceRef: bonusXp.event.sourceRef }
              );
            }
          }
        }
        nextPassport = { ...nextPassport, achievements: nextAchievements };
      }
    }

    const updatedPassport = await this.passports.updateProgress(nextPassport);
    return {
      passport: formatProgressionPassport(updatedPassport),
      xpEvents: xpEvents.filter((event) => event.wallet === passport.wallet),
      unlockedAchievements,
      evolutionEvents
    };
  }
}

function getAchievementCandidates(
  quest: Quest,
  passport: PassportProfile,
  completedQuestIds: string[]
) {
  const candidates: Achievement[] = [];
  const byId = new Map(achievements.map((achievement) => [achievement.id, achievement]));

  if (quest.id === "deploy-contract") candidates.push(byId.get("ACH_001")!);
  if (quest.id === "llm-precompile") candidates.push(byId.get("ACH_002")!);
  if (quest.type === "FULL_PROJECT" && !hasCompletedFullProject(passport.completedQuestIds)) {
    candidates.push(byId.get("ACH_004")!);
  }
  if (completedQuestIds.length >= 50) candidates.push(byId.get("ACH_006")!);

  return candidates.filter(Boolean);
}

function hasCompletedFullProject(completedQuestIds: string[]) {
  return completedQuestIds.some((questId) => getQuest(questId)?.type === "FULL_PROJECT");
}

function markAchievementUnlocked(
  achievementList: Achievement[],
  unlock: AchievementUnlock
) {
  const existingIds = new Set(achievementList.map((achievement) => achievement.id));
  const source = achievements.find((achievement) => achievement.id === unlock.achievementId);
  const next = achievementList.map((achievement) =>
    achievement.id === unlock.achievementId ? { ...achievement, unlocked: true } : achievement
  );

  if (source && !existingIds.has(source.id)) {
    next.push({ ...source, unlocked: true });
  }

  return next;
}

function getTargetStage(quest: Quest, passport: PassportProfile) {
  let stage = passport.stage;
  if (passport.completedQuestIds.includes("deploy-contract")) stage = Math.max(stage, 2);
  if (passport.completedQuestIds.includes("llm-precompile")) stage = Math.max(stage, 3);
  if (hasCompletedFullProject(passport.completedQuestIds)) stage = Math.max(stage, 4);
  if (quest.id === "discord-radiant-ritualist-role" || calculateReputation(passport) >= 90) {
    stage = Math.max(stage, 5);
  }
  return stage;
}

function getEvolutionReason(stage: number) {
  if (stage === 2) return "First contract deployment quest completed";
  if (stage === 3) return "First Ritual LLM precompile call verified";
  if (stage === 4) return "First full project quest completed";
  if (stage === 5) return "Ascendant reputation or community approval reached";
  return "Passport evolved";
}

function formatProgressionPassport(passport: PassportProfile) {
  return {
    wallet: passport.wallet,
    tokenId: passport.tokenId,
    classId: passport.classId,
    xp: passport.xp,
    stage: passport.stage,
    achievements: passport.achievements,
    completedQuestIds: passport.completedQuestIds,
    activeWeeks: passport.activeWeeks,
    projectsCompleted: passport.projectsCompleted,
    agentsDeployed: passport.agentsDeployed
  };
}

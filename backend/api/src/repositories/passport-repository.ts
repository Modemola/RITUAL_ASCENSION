import type { Pool } from "pg";
import { achievements, demoPassport, getQuest } from "@ritual/domain";
import type { BuilderClassId, PassportProfile } from "@ritual/domain";

export interface CreatePassportInput {
  wallet: string;
  tokenId: number;
  classId: BuilderClassId;
}

export interface UpsertPassportInput extends CreatePassportInput {
  xp?: number;
  stage?: number;
}

export interface UpdatePassportProgressInput {
  wallet: string;
  xp: number;
  stage: number;
  achievements?: PassportProfile["achievements"];
  completedQuestIds?: string[];
  activeWeeks?: number;
  projectsCompleted?: number;
  agentsDeployed?: number;
}

export interface PassportRepository {
  findByWallet(wallet: string): Promise<PassportProfile | undefined>;
  create(input: CreatePassportInput): Promise<PassportProfile>;
  upsert(input: UpsertPassportInput): Promise<PassportProfile>;
  updateProgress(input: UpdatePassportProgressInput): Promise<PassportProfile>;
}

export class InMemoryPassportRepository implements PassportRepository {
  private readonly passportsByWallet = new Map<string, PassportProfile>();

  constructor(seedPassport: PassportProfile = demoPassport) {
    this.passportsByWallet.set(seedPassport.wallet.toLowerCase(), seedPassport);
  }

  async findByWallet(wallet: string) {
    return this.passportsByWallet.get(wallet.toLowerCase());
  }

  async create(input: CreatePassportInput) {
    const normalizedWallet = input.wallet.toLowerCase();
    const passport: PassportProfile = {
      wallet: normalizedWallet,
      tokenId: input.tokenId,
      classId: input.classId,
      xp: 0,
      stage: 1,
      achievements: achievements.map((achievement) => ({ ...achievement, unlocked: false })),
      completedQuestIds: [],
      activeWeeks: 0,
      projectsCompleted: 0,
      agentsDeployed: 0
    };

    this.passportsByWallet.set(normalizedWallet, passport);
    return passport;
  }

  async upsert(input: UpsertPassportInput) {
    const normalizedWallet = input.wallet.toLowerCase();
    const existing = this.passportsByWallet.get(normalizedWallet);
    const passport: PassportProfile = {
      wallet: normalizedWallet,
      tokenId: input.tokenId,
      classId: input.classId,
      xp: input.xp ?? existing?.xp ?? 0,
      stage: input.stage ?? existing?.stage ?? 1,
      achievements: existing?.achievements ?? [],
      completedQuestIds: existing?.completedQuestIds ?? [],
      activeWeeks: existing?.activeWeeks ?? 0,
      projectsCompleted: existing?.projectsCompleted ?? 0,
      agentsDeployed: existing?.agentsDeployed ?? 0
    };

    this.passportsByWallet.set(normalizedWallet, passport);
    return passport;
  }

  async updateProgress(input: UpdatePassportProgressInput) {
    const normalizedWallet = input.wallet.toLowerCase();
    const existing = this.passportsByWallet.get(normalizedWallet);
    if (!existing) {
      throw new Error("Passport not found");
    }

    const passport: PassportProfile = {
      ...existing,
      xp: input.xp,
      stage: input.stage,
      achievements: input.achievements ?? existing.achievements,
      completedQuestIds: input.completedQuestIds ?? existing.completedQuestIds,
      activeWeeks: input.activeWeeks ?? existing.activeWeeks,
      projectsCompleted: input.projectsCompleted ?? existing.projectsCompleted,
      agentsDeployed: input.agentsDeployed ?? existing.agentsDeployed
    };

    this.passportsByWallet.set(normalizedWallet, passport);
    return passport;
  }
}

export class PostgresPassportRepository implements PassportRepository {
  constructor(private readonly pool: Pool) {}

  async findByWallet(wallet: string) {
    const result = await this.pool.query<PassportRow>(
      `
        SELECT wallet, token_id, class_id, xp, stage, active_weeks, projects_completed, agents_deployed
        FROM passports
        WHERE wallet = $1
      `,
      [wallet.toLowerCase()]
    );

    return result.rows[0] ? this.toPassportProfile(result.rows[0]) : undefined;
  }

  async create(input: CreatePassportInput) {
    const result = await this.pool.query<PassportRow>(
      `
        INSERT INTO passports (
          wallet,
          token_id,
          class_id,
          xp,
          stage,
          active_weeks,
          projects_completed,
          agents_deployed
        )
        VALUES ($1, $2, $3, 0, 1, 0, 0, 0)
        RETURNING wallet, token_id, class_id, xp, stage, active_weeks, projects_completed, agents_deployed
      `,
      [input.wallet.toLowerCase(), input.tokenId, input.classId]
    );

    return this.toPassportProfile(result.rows[0]);
  }

  async upsert(input: UpsertPassportInput) {
    const result = await this.pool.query<PassportRow>(
      `
        INSERT INTO passports (
          wallet,
          token_id,
          class_id,
          xp,
          stage,
          active_weeks,
          projects_completed,
          agents_deployed
        )
        VALUES ($1, $2, $3, $4, $5, 0, 0, 0)
        ON CONFLICT (wallet) DO UPDATE SET
          token_id = EXCLUDED.token_id,
          class_id = EXCLUDED.class_id,
          xp = EXCLUDED.xp,
          stage = EXCLUDED.stage,
          updated_at = now()
        RETURNING wallet, token_id, class_id, xp, stage, active_weeks, projects_completed, agents_deployed
      `,
      [
        input.wallet.toLowerCase(),
        input.tokenId,
        input.classId,
        input.xp ?? 0,
        input.stage ?? 1
      ]
    );

    return this.toPassportProfile(result.rows[0]);
  }

  async updateProgress(input: UpdatePassportProgressInput) {
    const result = await this.pool.query<PassportRow>(
      `
        UPDATE passports
        SET
          xp = $2,
          stage = $3,
          active_weeks = $4,
          projects_completed = $5,
          agents_deployed = $6,
          updated_at = now()
        WHERE wallet = $1
        RETURNING wallet, token_id, class_id, xp, stage, active_weeks, projects_completed, agents_deployed
      `,
      [
        input.wallet.toLowerCase(),
        input.xp,
        input.stage,
        input.activeWeeks ?? 0,
        input.projectsCompleted ?? 0,
        input.agentsDeployed ?? 0
      ]
    );

    if (!result.rows[0]) {
      throw new Error("Passport not found");
    }

    return this.toPassportProfile(result.rows[0]);
  }

  private async toPassportProfile(row: PassportRow): Promise<PassportProfile> {
    const [completedQuestIds, unlockedAchievementIds] = await Promise.all([
      this.listCompletedQuestIds(row.wallet),
      this.listUnlockedAchievementIds(row.wallet)
    ]);

    return {
      ...basePassportProfile(row),
      completedQuestIds,
      achievements: achievements.map((achievement) => ({
        ...achievement,
        unlocked: unlockedAchievementIds.has(achievement.id)
      }))
    };
  }

  private async listCompletedQuestIds(wallet: string) {
    const result = await this.pool.query<{ quest_id: string }>(
      `
        SELECT quest_id
        FROM quest_attempts
        WHERE wallet = $1 AND status = 'completed'
        ORDER BY completed_at ASC NULLS LAST, updated_at ASC
      `,
      [wallet.toLowerCase()]
    );

    return result.rows.map((row) => row.quest_id);
  }

  private async listUnlockedAchievementIds(wallet: string) {
    const result = await this.pool.query<{ achievement_id: string }>(
      `
        SELECT achievement_id
        FROM achievement_unlocks
        WHERE wallet = $1
      `,
      [wallet.toLowerCase()]
    );

    return new Set(result.rows.map((row) => row.achievement_id));
  }
}

interface PassportRow {
  wallet: string;
  token_id: string;
  class_id: number;
  xp: string;
  stage: number;
  active_weeks: number;
  projects_completed: number;
  agents_deployed: number;
}

function basePassportProfile(row: PassportRow): PassportProfile {
  const completedQuestIds = row.token_id === String(demoPassport.tokenId) ? demoPassport.completedQuestIds : [];
  const unlockedAchievementIds = new Set(
    row.token_id === String(demoPassport.tokenId)
      ? achievements.filter((achievement) => achievement.unlocked).map((achievement) => achievement.id)
      : []
  );

  return {
    wallet: row.wallet,
    tokenId: Number(row.token_id),
    classId: row.class_id as BuilderClassId,
    xp: Number(row.xp),
    stage: row.stage,
    achievements: achievements.map((achievement) => ({
      ...achievement,
      unlocked: unlockedAchievementIds.has(achievement.id)
    })),
    completedQuestIds,
    activeWeeks: row.active_weeks,
    projectsCompleted: row.projects_completed,
    agentsDeployed: row.agents_deployed
  };
}

export function getPassportProgressCounters(completedQuestIds: string[]) {
  return completedQuestIds.reduce(
    (counters, questId) => {
      const quest = getQuest(questId);
      if (quest?.type === "FULL_PROJECT") counters.projectsCompleted += 1;
      if (questId === "build-agent") counters.agentsDeployed += 1;
      if (quest?.metric === "activeDays" && quest.target) {
        counters.activeWeeks = Math.max(counters.activeWeeks, Math.floor(quest.target / 7));
      }
      return counters;
    },
    { activeWeeks: 0, projectsCompleted: 0, agentsDeployed: 0 }
  );
}

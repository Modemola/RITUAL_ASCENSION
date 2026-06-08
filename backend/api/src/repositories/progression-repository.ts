import type { Pool } from "pg";

export interface XpEvent {
  id: string;
  wallet: string;
  amount: number;
  reason: string;
  sourceRef: string;
  questAttemptId?: string;
  awardedAt: Date;
}

export interface AchievementUnlock {
  id: string;
  wallet: string;
  achievementId: string;
  xpBonus: number;
  sourceRef: string;
  unlockedAt: Date;
}

export interface EvolutionEvent {
  id: string;
  wallet: string;
  tokenId: number;
  fromStage: number;
  toStage: number;
  reason: string;
  txHash?: string;
  createdAt: Date;
}

export type ActivityFeedItemType = "xp_awarded" | "achievement_unlocked" | "passport_evolved";

export interface ActivityFeedItem {
  id: string;
  wallet: string;
  type: ActivityFeedItemType;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface AwardXpInput {
  wallet: string;
  amount: number;
  reason: string;
  sourceRef: string;
  questAttemptId?: string;
}

export interface UnlockAchievementInput {
  wallet: string;
  achievementId: string;
  xpBonus: number;
  sourceRef: string;
}

export interface RecordEvolutionInput {
  wallet: string;
  tokenId: number;
  fromStage: number;
  toStage: number;
  reason: string;
  txHash?: string;
}

export interface ProgressionRepository {
  awardXp(input: AwardXpInput): Promise<{ event: XpEvent; created: boolean }>;
  unlockAchievement(input: UnlockAchievementInput): Promise<{ unlock: AchievementUnlock; created: boolean }>;
  recordEvolution(input: RecordEvolutionInput): Promise<EvolutionEvent>;
  listActivityFeed(wallet: string, limit: number): Promise<ActivityFeedItem[]>;
}

export class InMemoryProgressionRepository implements ProgressionRepository {
  private readonly xpEventsBySourceRef = new Map<string, XpEvent>();
  private readonly achievementUnlocksBySourceRef = new Map<string, AchievementUnlock>();
  private readonly evolutionEvents: EvolutionEvent[] = [];

  async awardXp(input: AwardXpInput) {
    const existing = this.xpEventsBySourceRef.get(input.sourceRef);
    if (existing) return { event: existing, created: false };

    const event: XpEvent = {
      id: `xp-${input.sourceRef}`,
      wallet: input.wallet.toLowerCase(),
      amount: input.amount,
      reason: input.reason,
      sourceRef: input.sourceRef,
      questAttemptId: input.questAttemptId,
      awardedAt: new Date()
    };

    this.xpEventsBySourceRef.set(input.sourceRef, event);
    return { event, created: true };
  }

  async unlockAchievement(input: UnlockAchievementInput) {
    const existingBySource = this.achievementUnlocksBySourceRef.get(input.sourceRef);
    if (existingBySource) return { unlock: existingBySource, created: false };

    const existingByAchievement = Array.from(this.achievementUnlocksBySourceRef.values()).find(
      (unlock) => unlock.wallet === input.wallet.toLowerCase() && unlock.achievementId === input.achievementId
    );
    if (existingByAchievement) return { unlock: existingByAchievement, created: false };

    const unlock: AchievementUnlock = {
      id: `achievement-${input.sourceRef}`,
      wallet: input.wallet.toLowerCase(),
      achievementId: input.achievementId,
      xpBonus: input.xpBonus,
      sourceRef: input.sourceRef,
      unlockedAt: new Date()
    };

    this.achievementUnlocksBySourceRef.set(input.sourceRef, unlock);
    return { unlock, created: true };
  }

  async recordEvolution(input: RecordEvolutionInput) {
    const event: EvolutionEvent = {
      id: `evolution-${input.wallet.toLowerCase()}-${input.fromStage}-${input.toStage}`,
      wallet: input.wallet.toLowerCase(),
      tokenId: input.tokenId,
      fromStage: input.fromStage,
      toStage: input.toStage,
      reason: input.reason,
      txHash: input.txHash,
      createdAt: new Date()
    };

    this.evolutionEvents.push(event);
    return event;
  }

  async listActivityFeed(wallet: string, limit: number) {
    const normalizedWallet = wallet.toLowerCase();
    const xpItems = Array.from(this.xpEventsBySourceRef.values())
      .filter((event) => event.wallet === normalizedWallet)
      .map((event): ActivityFeedItem => ({
        id: event.id,
        wallet: event.wallet,
        type: "xp_awarded",
        title: `+${event.amount} XP`,
        description: event.reason,
        metadata: {
          amount: event.amount,
          sourceRef: event.sourceRef,
          questAttemptId: event.questAttemptId
        },
        createdAt: event.awardedAt
      }));
    const achievementItems = Array.from(this.achievementUnlocksBySourceRef.values())
      .filter((unlock) => unlock.wallet === normalizedWallet)
      .map((unlock): ActivityFeedItem => ({
        id: unlock.id,
        wallet: unlock.wallet,
        type: "achievement_unlocked",
        title: "Achievement unlocked",
        description: unlock.achievementId,
        metadata: {
          achievementId: unlock.achievementId,
          xpBonus: unlock.xpBonus,
          sourceRef: unlock.sourceRef
        },
        createdAt: unlock.unlockedAt
      }));
    const evolutionItems = this.evolutionEvents
      .filter((event) => event.wallet === normalizedWallet)
      .map((event): ActivityFeedItem => ({
        id: event.id,
        wallet: event.wallet,
        type: "passport_evolved",
        title: `Stage ${event.toStage} reached`,
        description: event.reason,
        metadata: {
          tokenId: event.tokenId,
          fromStage: event.fromStage,
          toStage: event.toStage,
          txHash: event.txHash
        },
        createdAt: event.createdAt
      }));

    return [...xpItems, ...achievementItems, ...evolutionItems]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);
  }
}

export class PostgresProgressionRepository implements ProgressionRepository {
  constructor(private readonly pool: Pool) {}

  async awardXp(input: AwardXpInput) {
    const result = await this.pool.query<XpEventRow>(
      `
        INSERT INTO xp_events (wallet, amount, reason, source_ref, quest_attempt_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (source_ref) DO NOTHING
        RETURNING id, wallet, amount, reason, source_ref, quest_attempt_id, awarded_at
      `,
      [
        input.wallet.toLowerCase(),
        input.amount,
        input.reason,
        input.sourceRef,
        input.questAttemptId ?? null
      ]
    );

    if (result.rows[0]) {
      return { event: toXpEvent(result.rows[0]), created: true };
    }

    const existing = await this.pool.query<XpEventRow>(
      `
        SELECT id, wallet, amount, reason, source_ref, quest_attempt_id, awarded_at
        FROM xp_events
        WHERE source_ref = $1
      `,
      [input.sourceRef]
    );

    return { event: toXpEvent(existing.rows[0]), created: false };
  }

  async unlockAchievement(input: UnlockAchievementInput) {
    const result = await this.pool.query<AchievementUnlockRow>(
      `
        INSERT INTO achievement_unlocks (wallet, achievement_id, xp_bonus, source_ref)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (wallet, achievement_id) DO NOTHING
        RETURNING id, wallet, achievement_id, xp_bonus, source_ref, unlocked_at
      `,
      [
        input.wallet.toLowerCase(),
        input.achievementId,
        input.xpBonus,
        input.sourceRef
      ]
    );

    if (result.rows[0]) {
      return { unlock: toAchievementUnlock(result.rows[0]), created: true };
    }

    const existing = await this.pool.query<AchievementUnlockRow>(
      `
        SELECT id, wallet, achievement_id, xp_bonus, source_ref, unlocked_at
        FROM achievement_unlocks
        WHERE wallet = $1 AND achievement_id = $2
      `,
      [input.wallet.toLowerCase(), input.achievementId]
    );

    return { unlock: toAchievementUnlock(existing.rows[0]), created: false };
  }

  async recordEvolution(input: RecordEvolutionInput) {
    const result = await this.pool.query<EvolutionEventRow>(
      `
        INSERT INTO evolution_events (wallet, token_id, from_stage, to_stage, reason, tx_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, wallet, token_id, from_stage, to_stage, reason, tx_hash, created_at
      `,
      [
        input.wallet.toLowerCase(),
        input.tokenId,
        input.fromStage,
        input.toStage,
        input.reason,
        input.txHash ?? null
      ]
    );

    return toEvolutionEvent(result.rows[0]);
  }

  async listActivityFeed(wallet: string, limit: number) {
    const result = await this.pool.query<ActivityFeedItemRow>(
      `
        SELECT id, wallet, type, title, description, metadata, created_at
        FROM (
          SELECT
            id::text AS id,
            wallet,
            'xp_awarded' AS type,
            '+' || amount::text || ' XP' AS title,
            reason AS description,
            jsonb_build_object(
              'amount', amount,
              'sourceRef', source_ref,
              'questAttemptId', quest_attempt_id
            ) AS metadata,
            awarded_at AS created_at
          FROM xp_events
          WHERE wallet = $1

          UNION ALL

          SELECT
            id::text AS id,
            wallet,
            'achievement_unlocked' AS type,
            'Achievement unlocked' AS title,
            achievement_id AS description,
            jsonb_build_object(
              'achievementId', achievement_id,
              'xpBonus', xp_bonus,
              'sourceRef', source_ref
            ) AS metadata,
            unlocked_at AS created_at
          FROM achievement_unlocks
          WHERE wallet = $1

          UNION ALL

          SELECT
            id::text AS id,
            wallet,
            'passport_evolved' AS type,
            'Stage ' || to_stage::text || ' reached' AS title,
            reason AS description,
            jsonb_build_object(
              'tokenId', token_id,
              'fromStage', from_stage,
              'toStage', to_stage,
              'txHash', tx_hash
            ) AS metadata,
            created_at
          FROM evolution_events
          WHERE wallet = $1
        ) feed
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [wallet.toLowerCase(), limit]
    );

    return result.rows.map(toActivityFeedItem);
  }
}

interface XpEventRow {
  id: string;
  wallet: string;
  amount: string;
  reason: string;
  source_ref: string;
  quest_attempt_id: string | null;
  awarded_at: Date;
}

interface AchievementUnlockRow {
  id: string;
  wallet: string;
  achievement_id: string;
  xp_bonus: string;
  source_ref: string;
  unlocked_at: Date;
}

interface EvolutionEventRow {
  id: string;
  wallet: string;
  token_id: string;
  from_stage: number;
  to_stage: number;
  reason: string;
  tx_hash: string | null;
  created_at: Date;
}

interface ActivityFeedItemRow {
  id: string;
  wallet: string;
  type: ActivityFeedItemType;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

function toXpEvent(row: XpEventRow): XpEvent {
  return {
    id: row.id,
    wallet: row.wallet,
    amount: Number(row.amount),
    reason: row.reason,
    sourceRef: row.source_ref,
    questAttemptId: row.quest_attempt_id ?? undefined,
    awardedAt: row.awarded_at
  };
}

function toAchievementUnlock(row: AchievementUnlockRow): AchievementUnlock {
  return {
    id: row.id,
    wallet: row.wallet,
    achievementId: row.achievement_id,
    xpBonus: Number(row.xp_bonus),
    sourceRef: row.source_ref,
    unlockedAt: row.unlocked_at
  };
}

function toEvolutionEvent(row: EvolutionEventRow): EvolutionEvent {
  return {
    id: row.id,
    wallet: row.wallet,
    tokenId: Number(row.token_id),
    fromStage: row.from_stage,
    toStage: row.to_stage,
    reason: row.reason,
    txHash: row.tx_hash ?? undefined,
    createdAt: row.created_at
  };
}

function toActivityFeedItem(row: ActivityFeedItemRow): ActivityFeedItem {
  return {
    id: row.id,
    wallet: row.wallet,
    type: row.type,
    title: row.title,
    description: row.description,
    metadata: row.metadata,
    createdAt: row.created_at
  };
}

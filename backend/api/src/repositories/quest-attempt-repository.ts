import type { Pool } from "pg";

export type QuestAttemptStatus = "started" | "submitted" | "verified" | "rejected" | "completed";

export interface QuestAttempt {
  id: string;
  wallet: string;
  questId: string;
  status: QuestAttemptStatus;
  proof?: string;
  verificationSource?: string;
  verificationResult: Record<string, unknown>;
  submittedAt?: Date;
  verifiedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertQuestAttemptInput {
  wallet: string;
  questId: string;
  status: QuestAttemptStatus;
  proof?: string;
  verificationSource?: string;
  verificationResult?: Record<string, unknown>;
  submittedAt?: Date;
  verifiedAt?: Date;
  completedAt?: Date;
}

export interface QuestAttemptRepository {
  findById(id: string): Promise<QuestAttempt | undefined>;
  findByWalletAndQuest(wallet: string, questId: string): Promise<QuestAttempt | undefined>;
  listByWallet(wallet: string): Promise<QuestAttempt[]>;
  upsert(input: UpsertQuestAttemptInput): Promise<QuestAttempt>;
}

export class InMemoryQuestAttemptRepository implements QuestAttemptRepository {
  private readonly attemptsByKey = new Map<string, QuestAttempt>();

  async findById(id: string) {
    return Array.from(this.attemptsByKey.values()).find((attempt) => attempt.id === id);
  }

  async findByWalletAndQuest(wallet: string, questId: string) {
    return this.attemptsByKey.get(getAttemptKey(wallet, questId));
  }

  async listByWallet(wallet: string) {
    const normalizedWallet = wallet.toLowerCase();
    return Array.from(this.attemptsByKey.values()).filter((attempt) => attempt.wallet === normalizedWallet);
  }

  async upsert(input: UpsertQuestAttemptInput) {
    const key = getAttemptKey(input.wallet, input.questId);
    const now = new Date();
    const existing = this.attemptsByKey.get(key);
    const attempt: QuestAttempt = {
      id: existing?.id ?? `attempt-${input.wallet.toLowerCase()}-${input.questId}`,
      wallet: input.wallet.toLowerCase(),
      questId: input.questId,
      status: input.status,
      proof: input.proof ?? existing?.proof,
      verificationSource: input.verificationSource ?? existing?.verificationSource,
      verificationResult: input.verificationResult ?? existing?.verificationResult ?? {},
      submittedAt: input.submittedAt ?? existing?.submittedAt,
      verifiedAt: input.verifiedAt ?? existing?.verifiedAt,
      completedAt: input.completedAt ?? existing?.completedAt,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    this.attemptsByKey.set(key, attempt);
    return attempt;
  }
}

export class PostgresQuestAttemptRepository implements QuestAttemptRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string) {
    const result = await this.pool.query<QuestAttemptRow>(
      `
        SELECT id, wallet, quest_id, status, proof, verification_source, verification_result,
          submitted_at, verified_at, completed_at, created_at, updated_at
        FROM quest_attempts
        WHERE id = $1
      `,
      [id]
    );

    return result.rows[0] ? toQuestAttempt(result.rows[0]) : undefined;
  }

  async findByWalletAndQuest(wallet: string, questId: string) {
    const result = await this.pool.query<QuestAttemptRow>(
      `
        SELECT id, wallet, quest_id, status, proof, verification_source, verification_result,
          submitted_at, verified_at, completed_at, created_at, updated_at
        FROM quest_attempts
        WHERE wallet = $1 AND quest_id = $2
      `,
      [wallet.toLowerCase(), questId]
    );

    return result.rows[0] ? toQuestAttempt(result.rows[0]) : undefined;
  }

  async listByWallet(wallet: string) {
    const result = await this.pool.query<QuestAttemptRow>(
      `
        SELECT id, wallet, quest_id, status, proof, verification_source, verification_result,
          submitted_at, verified_at, completed_at, created_at, updated_at
        FROM quest_attempts
        WHERE wallet = $1
        ORDER BY updated_at DESC
      `,
      [wallet.toLowerCase()]
    );

    return result.rows.map(toQuestAttempt);
  }

  async upsert(input: UpsertQuestAttemptInput) {
    const result = await this.pool.query<QuestAttemptRow>(
      `
        INSERT INTO quest_attempts (
          wallet,
          quest_id,
          status,
          proof,
          verification_source,
          verification_result,
          submitted_at,
          verified_at,
          completed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
        ON CONFLICT (wallet, quest_id) DO UPDATE SET
          status = EXCLUDED.status,
          proof = COALESCE(EXCLUDED.proof, quest_attempts.proof),
          verification_source = COALESCE(EXCLUDED.verification_source, quest_attempts.verification_source),
          verification_result = EXCLUDED.verification_result,
          submitted_at = COALESCE(EXCLUDED.submitted_at, quest_attempts.submitted_at),
          verified_at = COALESCE(EXCLUDED.verified_at, quest_attempts.verified_at),
          completed_at = COALESCE(EXCLUDED.completed_at, quest_attempts.completed_at),
          updated_at = now()
        RETURNING id, wallet, quest_id, status, proof, verification_source, verification_result,
          submitted_at, verified_at, completed_at, created_at, updated_at
      `,
      [
        input.wallet.toLowerCase(),
        input.questId,
        input.status,
        input.proof ?? null,
        input.verificationSource ?? null,
        JSON.stringify(input.verificationResult ?? {}),
        input.submittedAt ?? null,
        input.verifiedAt ?? null,
        input.completedAt ?? null
      ]
    );

    return toQuestAttempt(result.rows[0]);
  }
}

interface QuestAttemptRow {
  id: string;
  wallet: string;
  quest_id: string;
  status: QuestAttemptStatus;
  proof: string | null;
  verification_source: string | null;
  verification_result: Record<string, unknown>;
  submitted_at: Date | null;
  verified_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function toQuestAttempt(row: QuestAttemptRow): QuestAttempt {
  return {
    id: row.id,
    wallet: row.wallet,
    questId: row.quest_id,
    status: row.status,
    proof: row.proof ?? undefined,
    verificationSource: row.verification_source ?? undefined,
    verificationResult: row.verification_result,
    submittedAt: row.submitted_at ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getAttemptKey(wallet: string, questId: string) {
  return `${wallet.toLowerCase()}:${questId}`;
}

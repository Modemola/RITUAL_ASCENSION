import type { Pool } from "pg";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewRecord {
  id: string;
  wallet: string;
  questAttemptId: string;
  productId?: string;
  reviewerWallet?: string;
  status: ReviewStatus;
  notes?: string;
  createdAt: Date;
  decidedAt?: Date;
}

export interface CreateReviewRecordInput {
  wallet: string;
  questAttemptId: string;
  productId?: string;
}

export interface DecideReviewRecordInput {
  id: string;
  reviewerWallet: string;
  status: Exclude<ReviewStatus, "pending">;
  notes?: string;
}

export interface ReviewRecordRepository {
  createForAttempt(input: CreateReviewRecordInput): Promise<ReviewRecord>;
  findById(id: string): Promise<ReviewRecord | undefined>;
  findByAttemptId(questAttemptId: string): Promise<ReviewRecord | undefined>;
  listPending(limit: number): Promise<ReviewRecord[]>;
  listAll(limit: number): Promise<ReviewRecord[]>;
  decide(input: DecideReviewRecordInput): Promise<ReviewRecord>;
}

export class InMemoryReviewRecordRepository implements ReviewRecordRepository {
  private readonly recordsById = new Map<string, ReviewRecord>();
  private readonly recordsByAttemptId = new Map<string, ReviewRecord>();

  async createForAttempt(input: CreateReviewRecordInput) {
    const existing = this.recordsByAttemptId.get(input.questAttemptId);
    if (existing) return existing;

    const record: ReviewRecord = {
      id: `review-${input.questAttemptId}`,
      wallet: input.wallet.toLowerCase(),
      questAttemptId: input.questAttemptId,
      productId: input.productId,
      status: "pending",
      createdAt: new Date()
    };

    this.recordsById.set(record.id, record);
    this.recordsByAttemptId.set(record.questAttemptId, record);
    return record;
  }

  async findById(id: string) {
    return this.recordsById.get(id);
  }

  async findByAttemptId(questAttemptId: string) {
    return this.recordsByAttemptId.get(questAttemptId);
  }

  async listPending(limit: number) {
    return Array.from(this.recordsById.values())
      .filter((record) => record.status === "pending")
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .slice(0, limit);
  }

  async listAll(limit: number) {
    return Array.from(this.recordsById.values())
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);
  }

  async decide(input: DecideReviewRecordInput) {
    const existing = this.recordsById.get(input.id);
    if (!existing) throw new Error("Review record not found");

    const record: ReviewRecord = {
      ...existing,
      reviewerWallet: input.reviewerWallet.toLowerCase(),
      status: input.status,
      notes: input.notes,
      decidedAt: new Date()
    };

    this.recordsById.set(record.id, record);
    this.recordsByAttemptId.set(record.questAttemptId, record);
    return record;
  }
}

export class PostgresReviewRecordRepository implements ReviewRecordRepository {
  constructor(private readonly pool: Pool) {}

  async createForAttempt(input: CreateReviewRecordInput) {
    const result = await this.pool.query<ReviewRecordRow>(
      `
        INSERT INTO review_records (wallet, quest_attempt_id, product_id, status)
        VALUES ($1, $2, $3, 'pending')
        ON CONFLICT (quest_attempt_id) DO UPDATE SET
          quest_attempt_id = EXCLUDED.quest_attempt_id
        RETURNING id, wallet, quest_attempt_id, product_id, reviewer_wallet,
          status, notes, created_at, decided_at
      `,
      [input.wallet.toLowerCase(), input.questAttemptId, input.productId ?? null]
    );

    return toReviewRecord(result.rows[0]);
  }

  async findById(id: string) {
    const result = await this.pool.query<ReviewRecordRow>(
      `
        SELECT id, wallet, quest_attempt_id, product_id, reviewer_wallet,
          status, notes, created_at, decided_at
        FROM review_records
        WHERE id = $1
      `,
      [id]
    );

    return result.rows[0] ? toReviewRecord(result.rows[0]) : undefined;
  }

  async findByAttemptId(questAttemptId: string) {
    const result = await this.pool.query<ReviewRecordRow>(
      `
        SELECT id, wallet, quest_attempt_id, product_id, reviewer_wallet,
          status, notes, created_at, decided_at
        FROM review_records
        WHERE quest_attempt_id = $1
      `,
      [questAttemptId]
    );

    return result.rows[0] ? toReviewRecord(result.rows[0]) : undefined;
  }

  async listPending(limit: number) {
    const result = await this.pool.query<ReviewRecordRow>(
      `
        SELECT id, wallet, quest_attempt_id, product_id, reviewer_wallet,
          status, notes, created_at, decided_at
        FROM review_records
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT $1
      `,
      [limit]
    );

    return result.rows.map(toReviewRecord);
  }

  async listAll(limit: number) {
    const result = await this.pool.query<ReviewRecordRow>(
      `
        SELECT id, wallet, quest_attempt_id, product_id, reviewer_wallet,
          status, notes, created_at, decided_at
        FROM review_records
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit]
    );

    return result.rows.map(toReviewRecord);
  }

  async decide(input: DecideReviewRecordInput) {
    const result = await this.pool.query<ReviewRecordRow>(
      `
        UPDATE review_records
        SET
          reviewer_wallet = $2,
          status = $3,
          notes = $4,
          decided_at = now()
        WHERE id = $1
        RETURNING id, wallet, quest_attempt_id, product_id, reviewer_wallet,
          status, notes, created_at, decided_at
      `,
      [input.id, input.reviewerWallet.toLowerCase(), input.status, input.notes ?? null]
    );

    if (!result.rows[0]) throw new Error("Review record not found");
    return toReviewRecord(result.rows[0]);
  }
}

interface ReviewRecordRow {
  id: string;
  wallet: string;
  quest_attempt_id: string;
  product_id: string | null;
  reviewer_wallet: string | null;
  status: ReviewStatus;
  notes: string | null;
  created_at: Date;
  decided_at: Date | null;
}

function toReviewRecord(row: ReviewRecordRow): ReviewRecord {
  return {
    id: row.id,
    wallet: row.wallet,
    questAttemptId: row.quest_attempt_id,
    productId: row.product_id ?? undefined,
    reviewerWallet: row.reviewer_wallet ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    decidedAt: row.decided_at ?? undefined
  };
}

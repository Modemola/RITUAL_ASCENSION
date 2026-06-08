import { demoPassport, getQuest } from "@ritual/domain";
import type {
  QuestAttempt,
  QuestAttemptRepository
} from "../repositories/quest-attempt-repository.js";
import type {
  ReviewRecord,
  ReviewRecordRepository,
  ReviewStatus
} from "../repositories/review-record-repository.js";
import type { ProgressionResult, ProgressionService } from "./progression-service.js";

export interface ReviewQueueItem {
  review: ReviewRecord;
  attempt: QuestAttempt;
  quest: ReturnType<typeof getQuest>;
}

export class AdminReviewService {
  private readonly adminWallets: Set<string>;

  constructor(
    private readonly reviews: ReviewRecordRepository,
    private readonly attempts: QuestAttemptRepository,
    private readonly progression: ProgressionService,
    adminWallets: string[] = []
  ) {
    const normalized = adminWallets.map((wallet) => wallet.toLowerCase()).filter(Boolean);
    this.adminWallets = new Set(normalized.length ? normalized : [demoPassport.wallet.toLowerCase()]);
  }

  isAdminWallet(wallet?: string) {
    return wallet ? this.adminWallets.has(wallet.toLowerCase()) : false;
  }

  async enqueueAttempt(attempt: QuestAttempt) {
    return this.reviews.createForAttempt({
      wallet: attempt.wallet,
      questAttemptId: attempt.id
    });
  }

  async listQueue(limit?: number) {
    const records = await this.reviews.listPending(clampLimit(limit));
    const queue: ReviewQueueItem[] = [];

    for (const record of records) {
      const attempt = await this.attempts.findById(record.questAttemptId);
      if (!attempt) continue;
      queue.push({
        review: record,
        attempt,
        quest: getQuest(attempt.questId)
      });
    }

    return {
      ok: true as const,
      body: {
        reviews: queue,
        total: queue.length
      }
    };
  }

  async decideReview(input: {
    reviewId?: string;
    reviewerWallet?: string;
    status?: string;
    notes?: string;
  }) {
    if (!input.reviewId) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidReview",
          message: "Review ID is required"
        }
      };
    }

    if (input.status !== "approved" && input.status !== "rejected") {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidReviewDecision",
          message: "Review decision must be approved or rejected"
        }
      };
    }

    const review = await this.reviews.findById(input.reviewId);
    if (!review) {
      return {
        ok: false as const,
        statusCode: 404,
        body: {
          error: "ReviewNotFound",
          message: "Review record not found"
        }
      };
    }

    if (review.status !== "pending") {
      return {
        ok: false as const,
        statusCode: 409,
        body: {
          error: "ReviewAlreadyDecided",
          message: "This review has already been decided",
          review
        }
      };
    }

    const attempt = await this.attempts.findById(review.questAttemptId);
    if (!attempt) {
      return {
        ok: false as const,
        statusCode: 404,
        body: {
          error: "ReviewAttemptNotFound",
          message: "The quest attempt attached to this review was not found"
        }
      };
    }

    if (attempt.status !== "submitted") {
      return {
        ok: false as const,
        statusCode: 409,
        body: {
          error: "AttemptNotReviewable",
          message: "Only submitted quest attempts can be reviewed",
          attempt
        }
      };
    }

    const now = new Date();
    const decidedReview = await this.reviews.decide({
      id: review.id,
      reviewerWallet: input.reviewerWallet ?? "",
      status: input.status as Exclude<ReviewStatus, "pending">,
      notes: input.notes
    });
    const decidedAttempt = await this.attempts.upsert({
      wallet: attempt.wallet,
      questId: attempt.questId,
      status: input.status === "approved" ? "completed" : "rejected",
      proof: attempt.proof,
      verificationSource: "admin-review",
      verificationResult: {
        ok: input.status === "approved",
        reason: input.notes ?? (input.status === "approved" ? "Proof approved by admin review" : "Proof rejected by admin review"),
        source: "admin-review",
        reviewerWallet: input.reviewerWallet
      },
      submittedAt: attempt.submittedAt,
      verifiedAt: now,
      completedAt: input.status === "approved" ? now : undefined
    });
    const progression: ProgressionResult | null = input.status === "approved"
      ? await this.progression.applyQuestCompletion(decidedAttempt)
      : null;

    return {
      ok: true as const,
      body: {
        review: decidedReview,
        attempt: decidedAttempt,
        progression
      }
    };
  }
}

function clampLimit(limit?: number) {
  if (!Number.isFinite(limit)) return 50;
  return Math.min(100, Math.max(1, Math.floor(limit ?? 50)));
}

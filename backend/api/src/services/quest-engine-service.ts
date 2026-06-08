import { getQuest } from "@ritual/domain";
import type { QuestAttemptRepository } from "../repositories/quest-attempt-repository.js";
import type { AdminReviewService } from "./admin-review-service.js";
import type { ProgressionService } from "./progression-service.js";
import type { QuestVerificationService } from "./quest-verification-service.js";
import { normalizeWallet } from "../validators.js";

interface QuestInput {
  wallet?: string;
  questId: string;
}

interface SubmitQuestInput extends QuestInput {
  proof?: string;
  discordId?: string;
}

export class QuestEngineService {
  constructor(
    private readonly attempts: QuestAttemptRepository,
    private readonly verifier: QuestVerificationService,
    private readonly progression?: ProgressionService,
    private readonly adminReviews?: AdminReviewService
  ) {}

  async listAttempts(wallet?: string) {
    const normalizedWallet = normalizeWallet(wallet);
    if (!normalizedWallet) return [];
    return this.attempts.listByWallet(normalizedWallet);
  }

  async startQuest(input: QuestInput) {
    const validation = await this.validateQuestInput(input);
    if (!validation.ok) return validation;

    const existing = await this.attempts.findByWalletAndQuest(validation.wallet, input.questId);
    if (existing?.status === "completed") {
      return {
        ok: false as const,
        statusCode: 409,
        body: {
          error: "QuestAlreadyCompleted",
          message: "This quest has already been completed by this passport wallet",
          attempt: existing
        }
      };
    }

    const attempt = existing ?? await this.attempts.upsert({
      wallet: validation.wallet,
      questId: input.questId,
      status: "started"
    });

    return {
      ok: true as const,
      body: { attempt }
    };
  }

  async submitQuest(input: SubmitQuestInput) {
    const validation = await this.validateQuestInput(input);
    if (!validation.ok) return validation;

    const existing = await this.attempts.findByWalletAndQuest(validation.wallet, input.questId);
    if (existing?.status === "completed") {
      return {
        ok: false as const,
        statusCode: 409,
        body: {
          error: "QuestAlreadyCompleted",
          message: "This quest has already been completed by this passport wallet",
          attempt: existing
        }
      };
    }

    const attempt = await this.attempts.upsert({
      wallet: validation.wallet,
      questId: input.questId,
      status: "submitted",
      proof: input.proof,
      submittedAt: new Date()
    });
    const review = isReviewableQuest(validation.quest.verification)
      ? await this.adminReviews?.enqueueAttempt(attempt)
      : null;

    return {
      ok: true as const,
      body: { attempt, review }
    };
  }

  async verifyQuest(input: SubmitQuestInput) {
    const submitted = await this.submitQuest(input);
    if (!submitted.ok) return submitted;
    if (submitted.body.review) {
      return {
        ok: true as const,
        statusCode: 202,
        body: {
          questId: input.questId,
          proof: input.proof,
          attempt: submitted.body.attempt,
          review: submitted.body.review,
          verification: {
            ok: false,
            reason: "Quest proof submitted for admin review",
            source: "admin-review-queue"
          },
          progression: null
        }
      };
    }

    const verification = await this.verifier.verifyQuest(
      input.questId,
      submitted.body.attempt.wallet,
      input.discordId,
      input.proof
    );
    const completed = Boolean(verification.ok);
    const now = new Date();
    const attempt = await this.attempts.upsert({
      wallet: submitted.body.attempt.wallet,
      questId: input.questId,
      status: completed ? "completed" : "rejected",
      proof: input.proof,
      verificationSource: verification.source,
      verificationResult: { ...verification },
      submittedAt: submitted.body.attempt.submittedAt,
      verifiedAt: now,
      completedAt: completed ? now : undefined
    });
    const progression = completed ? await this.progression?.applyQuestCompletion(attempt) : null;

    return {
      ok: verification.ok,
      statusCode: verification.ok ? 200 : 422,
      body: {
        questId: input.questId,
        proof: input.proof,
        attempt,
        verification,
        progression
      }
    };
  }

  private async validateQuestInput(input: QuestInput) {
    const normalizedWallet = normalizeWallet(input.wallet);
    if (!normalizedWallet) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidWallet",
          message: "A valid wallet is required"
        }
      };
    }

    const quest = getQuest(input.questId);
    if (!quest) {
      return {
        ok: false as const,
        statusCode: 404,
        body: {
          error: "QuestNotFound",
          message: "Quest not found"
        }
      };
    }

    const existing = await this.attempts.findByWalletAndQuest(normalizedWallet, input.questId);
    if (quest.limit === 1 && existing?.status === "completed") {
      return {
        ok: false as const,
        statusCode: 409,
        body: {
          error: "QuestAlreadyCompleted",
          message: "This capped quest has already been completed by this passport wallet",
          attempt: existing
        }
      };
    }

    return {
      ok: true as const,
      wallet: normalizedWallet,
      quest
    };
  }
}

function isReviewableQuest(verification: string) {
  return verification === "MANUAL_REVIEW" || verification === "AI_REVIEW";
}

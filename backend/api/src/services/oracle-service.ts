import {
  getBuilderClass,
  getLevelProgress,
  getQuest,
  quests
} from "@ritual/domain";
import type { PassportProfile, Quest } from "@ritual/domain";
import type { OracleConfig } from "../config.js";
import type { PassportService } from "./passport-service.js";
import type { QuestEngineService } from "./quest-engine-service.js";

interface OracleInput {
  wallet: string;
  message?: string;
}

interface OracleProviderResponse {
  conversationId?: string;
  message: string;
  recommendedQuest?: {
    id: string;
    title: string;
    reason: string;
  };
  learningOutcome?: string;
  nextMilestone?: string;
}

export class OracleService {
  constructor(
    private readonly passport: PassportService,
    private readonly questsService: QuestEngineService,
    private readonly config: OracleConfig = { provider: "local", model: "local-ritual-mentor" }
  ) {}

  async chat(input: OracleInput) {
    const passport = await this.passport.getPassport(input.wallet);
    if (!passport) {
      return {
        ok: false as const,
        statusCode: 403,
        body: {
          error: "PassportRequired",
          message: "Mint a Soulbound Passport before using the Oracle"
        }
      };
    }

    const attempts = await this.questsService.listAttempts(input.wallet);
    const context = buildOracleContext(passport, attempts.map((attempt) => attempt.questId));
    const providerResponse = this.config.provider === "openai-compatible"
      ? await this.askOpenAiCompatibleProvider(input.message ?? "", context).catch(() => null)
      : null;
    const response = providerResponse ?? buildLocalOracleResponse(input.message ?? "", context);

    return {
      ok: true as const,
      body: {
        conversationId: response.conversationId ?? `oracle-${input.wallet}-${Date.now()}`,
        message: response.message,
        recommendedQuest: response.recommendedQuest ?? toRecommendedQuest(context.recommendedQuest),
        learningOutcome: response.learningOutcome ?? getLearningOutcome(context.recommendedQuest),
        nextMilestone: response.nextMilestone ?? getNextMilestone(passport),
        rateLimitRemaining: this.config.provider === "local" ? 99 : 19,
        source: providerResponse ? this.config.provider : "local"
      }
    };
  }

  private async askOpenAiCompatibleProvider(message: string, context: OracleContext): Promise<OracleProviderResponse | null> {
    if (!this.config.endpoint || !this.config.apiKey) return null;

    const response = await fetch(this.config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.config.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "You are the Ritual Ascension Oracle Mentor.",
              "Recommend exactly one existing quest from the provided context.",
              "Return JSON with message, recommendedQuest, learningOutcome, and nextMilestone."
            ].join(" ")
          },
          {
            role: "user",
            content: JSON.stringify({
              userMessage: message,
              passport: context.passportSummary,
              recommendedQuest: context.recommendedQuest,
              availableQuests: context.availableQuests.slice(0, 8)
            })
          }
        ]
      })
    });

    if (!response.ok) return null;

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    try {
      const parsed = JSON.parse(content) as Partial<OracleProviderResponse>;
      return typeof parsed.message === "string" ? parsed as OracleProviderResponse : null;
    } catch {
      return null;
    }
  }
}

interface OracleContext {
  availableQuests: Quest[];
  passportSummary: {
    className: string;
    completedQuestCount: number;
    level: number;
    reputation: number;
    stage: number;
    wallet: string;
    xp: number;
  };
  recommendedQuest: Quest;
}

function buildOracleContext(passport: ReturnType<PassportService["getPassport"]> extends Promise<infer T> ? NonNullable<T> : PassportProfile, attemptedQuestIds: string[]): OracleContext {
  const completedQuestIds = new Set(passport.completedQuestIds ?? []);
  const attempted = new Set(attemptedQuestIds);
  const availableQuests = quests.filter((quest) => !completedQuestIds.has(quest.id));
  const inProgressQuest = quests.find((quest) => attempted.has(quest.id) && !completedQuestIds.has(quest.id));
  const recommendedQuest =
    inProgressQuest ??
    availableQuests.find((quest) => quest.id === "llm-precompile") ??
    availableQuests.find((quest) => quest.classId === passport.classId) ??
    availableQuests[0] ??
    quests[0];
  const progress = getLevelProgress(passport.xp);

  return {
    availableQuests,
    passportSummary: {
      className: getBuilderClass(passport.classId).name,
      completedQuestCount: passport.completedQuestIds?.length ?? 0,
      level: progress.level,
      reputation: passport.reputation,
      stage: passport.stage,
      wallet: passport.wallet,
      xp: passport.xp
    },
    recommendedQuest
  };
}

function buildLocalOracleResponse(userMessage: string, context: OracleContext): OracleProviderResponse {
  const quest = context.recommendedQuest;
  const className = context.passportSummary.className;
  const promptSignal = userMessage.trim()
    ? `I heard the shape of your question: "${userMessage.trim().slice(0, 140)}".`
    : "You did not ask for a specific direction, so I am optimizing for the next progression unlock.";

  return {
    conversationId: "local-oracle",
    message: `${promptSignal} As a ${className}, your highest-leverage next move is ${quest.title}. It is worth ${quest.xp} XP and fits your current Stage ${context.passportSummary.stage} passport progression.`,
    recommendedQuest: toRecommendedQuest(quest),
    learningOutcome: getLearningOutcome(quest),
    nextMilestone: getNextMilestoneFromQuest(quest)
  };
}

function toRecommendedQuest(quest: Quest) {
  return {
    id: quest.id,
    title: quest.title,
    reason: `${quest.verification} proof, ${quest.xp} XP, ${quest.difficulty} difficulty`
  };
}

function getLearningOutcome(quest: Quest) {
  if (quest.verification === "TX_HASH") return "You will practice proving real Ritual testnet execution from wallet activity.";
  if (quest.verification === "TESTNET_ACTIVITY") return "You will turn Ritual testnet usage into passport progress.";
  if (quest.verification === "DISCORD_ACTIVITY" || quest.verification === "DISCORD_ROLE") {
    return "You will connect community identity to the same soulbound passport.";
  }
  return "You will package a builder artifact for review and durable reputation.";
}

function getNextMilestone(passport: PassportProfile | ReturnType<typeof buildOracleContext>["passportSummary"]) {
  const stage = "stage" in passport ? passport.stage : 1;
  if (stage <= 1) return "Complete your first deployment to reach Stage 2.";
  if (stage === 2) return "Complete the LLM precompile quest to reach Stage 3.";
  if (stage === 3) return "Ship a full project to reach Stage 4.";
  return "Build reputation toward Ascendant status.";
}

function getNextMilestoneFromQuest(quest: Quest) {
  const resolved = getQuest(quest.id);
  if (resolved?.id === "deploy-contract") return "Confirm the deployment proof and push the passport into Stage 2.";
  if (resolved?.id === "llm-precompile") return "Confirm the LLM precompile call and push the passport into Stage 3.";
  if (resolved?.type === "FULL_PROJECT") return "Submit a complete project artifact for review and Stage 4 progress.";
  return "Complete the proof loop and bank the XP without changing wallets.";
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import {
  calculateReputation,
  getBuilderClass,
  getLevelProgress,
  quests
} from "@ritual/domain";
import type { PassportProfile, Quest } from "@ritual/domain";
import type { OracleConfig } from "../config.js";
import type { IdentityService } from "./identity-service.js";
import {
  OracleKnowledgeService,
  type OracleKnowledgeBundle
} from "./oracle-knowledge-service.js";
import type { PassportService } from "./passport-service.js";
import type { QuestEngineService } from "./quest-engine-service.js";

// ---------------------------------------------------------------------------
// Conversation store
// ---------------------------------------------------------------------------

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ConversationSession {
  wallet: string;
  messages: ConversationMessage[];
  lastActivity: number;
}

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_HISTORY = 40;

class ConversationStore {
  private sessions = new Map<string, ConversationSession>();

  get(conversationId: string, wallet: string): ConversationSession | null {
    const session = this.sessions.get(conversationId);
    if (!session) return null;
    if (session.wallet.toLowerCase() !== wallet.toLowerCase()) return null;
    if (Date.now() - session.lastActivity > SESSION_TTL_MS) {
      this.sessions.delete(conversationId);
      return null;
    }
    return session;
  }

  create(wallet: string): { conversationId: string; session: ConversationSession } {
    for (const [id, s] of this.sessions) {
      if (Date.now() - s.lastActivity > SESSION_TTL_MS) this.sessions.delete(id);
    }
    const conversationId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const session: ConversationSession = { wallet, messages: [], lastActivity: Date.now() };
    this.sessions.set(conversationId, session);
    return { conversationId, session };
  }

  append(conversationId: string, ...messages: ConversationMessage[]) {
    const session = this.sessions.get(conversationId);
    if (!session) return;
    session.messages.push(...messages);
    if (session.messages.length > MAX_HISTORY) {
      session.messages = session.messages.slice(-MAX_HISTORY);
    }
    session.lastActivity = Date.now();
  }
}

const store = new ConversationStore();

// ---------------------------------------------------------------------------
// Oracle context
// ---------------------------------------------------------------------------

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

function buildOracleContext(
  passport: PassportProfile,
  attemptedQuestIds: string[]
): OracleContext {
  const completedQuestIds = new Set(passport.completedQuestIds ?? []);
  const attempted = new Set(attemptedQuestIds);
  const availableQuests = quests.filter((q) => !completedQuestIds.has(q.id));
  const inProgress = quests.find((q) => attempted.has(q.id) && !completedQuestIds.has(q.id));
  const recommendedQuest =
    inProgress ??
    availableQuests.find((q) => q.id === "llm-precompile") ??
    availableQuests.find((q) => q.classId === passport.classId) ??
    availableQuests[0] ??
    quests[0];
  const progress = getLevelProgress(passport.xp);

  return {
    availableQuests,
    passportSummary: {
      className: getBuilderClass(passport.classId).name,
      completedQuestCount: passport.completedQuestIds?.length ?? 0,
      level: progress.level,
      reputation: calculateReputation(passport),
      stage: passport.stage,
      wallet: passport.wallet,
      xp: passport.xp
    },
    recommendedQuest
  };
}

// ---------------------------------------------------------------------------
// System prompt — warm mentor, not a machine printing a report
// ---------------------------------------------------------------------------

const STAGE_NAMES: Record<number, string> = {
  1: "Genesis",
  2: "Initiate",
  3: "Builder",
  4: "Architect",
  5: "Ascendant"
};

function buildSystemPrompt(context: OracleContext, _knowledge: OracleKnowledgeBundle): string {
  const p = context.passportSummary;
  const rq = context.recommendedQuest;
  const otherQuests = context.availableQuests
    .filter((q) => q.id !== rq?.id)
    .slice(0, 4)
    .map((q) => q.title)
    .join(", ");

  const progressLine =
    p.completedQuestCount === 0
      ? "No quests completed yet — just getting started."
      : p.completedQuestCount === 1
        ? "1 quest completed, momentum is building."
        : `${p.completedQuestCount} quests completed.`;

  const stageName = STAGE_NAMES[p.stage] ?? `Stage ${p.stage}`;

  const lines = [
    "You are the Oracle — the guiding intelligence of Ritual Ascension, an on-chain reputation platform for builders on the Ritual network.",
    "",
    "Your character: warm, perceptive, direct. You care about this builder's growth. You speak with wisdom but no pretension. You never pad responses — say what matters and stop.",
    "",
    "This builder's profile:",
    `  Wallet: ${p.wallet.slice(0, 6)}...${p.wallet.slice(-4)}`,
    `  Class: ${p.className}`,
    `  Level ${p.level} | ${stageName} (Stage ${p.stage}) | ${p.xp.toLocaleString()} XP | Reputation ${p.reputation}/100`,
    `  ${progressLine}`,
    rq ? `  Best next quest: "${rq.title}" — ${rq.xp} XP, ${rq.difficulty} difficulty` : "",
    otherQuests ? `  Other quests available: ${otherQuests}` : "",
    "",
    "How to respond:",
    "- Answer what they actually asked. Don't pivot to quest recommendations unless they're asking for direction.",
    "- Keep it to 2–4 sentences unless they ask for more.",
    "- If recommending a quest, name it and say why it fits this specific builder — not a generic pitch.",
    "- If they sound frustrated or stuck, acknowledge it before helping.",
    "- Never say 'As an AI' or anything that breaks character.",
    "- No bullet lists, JSON, or code blocks unless they explicitly ask."
  ];

  return lines.filter((l) => l !== undefined).join("\n");
}

// ---------------------------------------------------------------------------
// Local fallback — used when no AI provider is configured or all fail
// ---------------------------------------------------------------------------

function buildLocalFallback(userMessage: string, context: OracleContext): string {
  const p = context.passportSummary;
  const rq = context.recommendedQuest;
  const stageName = STAGE_NAMES[p.stage] ?? `Stage ${p.stage}`;

  if (!userMessage.trim()) {
    return `Welcome, ${p.className}. You're at Level ${p.level}, ${stageName}. Your clearest next move is "${rq.title}" — ${rq.xp} XP that will push you forward.`;
  }

  const lower = userMessage.toLowerCase();
  if (/how|what|explain|tell me/i.test(lower)) {
    return `Good question. Right now the Oracle's live connection isn't configured, so I can't give you a full answer — but I can say this: as a ${p.className} at ${stageName}, "${rq.title}" is where I'd put your energy next. It's ${rq.xp} XP and ${rq.difficulty} difficulty.`;
  }
  if (/stuck|help|confused|lost|don't know|dont know/i.test(lower)) {
    return `Everyone hits that wall. Here's what I'd do: step back, pick one thing. For you right now, that one thing is "${rq.title}". Start there — the path becomes clearer once you're moving.`;
  }
  if (/thanks|thank you|appreciate/i.test(lower)) {
    return `The work you're doing matters. Keep going — ${stageName} is just the beginning.`;
  }

  return `I hear you. The Oracle's live intelligence isn't connected right now, but your profile is clear: ${p.className}, Level ${p.level}, ${stageName}. Next move: "${rq.title}" — ${rq.xp} XP. Complete it and something shifts.`;
}

// ---------------------------------------------------------------------------
// OracleService
// ---------------------------------------------------------------------------

export class OracleService {
  constructor(
    private readonly passport: PassportService,
    private readonly questsService: QuestEngineService,
    private readonly identity: IdentityService,
    private readonly knowledge: OracleKnowledgeService = new OracleKnowledgeService(),
    private readonly config: OracleConfig = { provider: "local", model: "gemini-2.0-flash" }
  ) {}

  async chat(input: { wallet: string; message?: string; conversationId?: string }) {
    const passport = await this.passport.getPassport(input.wallet);
    if (!passport) {
      return {
        ok: false as const,
        statusCode: 403,
        body: {
          error: "PassportRequired",
          message: "Mint a Soulbound Passport before using the Oracle."
        }
      };
    }

    const userMessage = (input.message ?? "").trim();
    if (!userMessage) {
      return {
        ok: false as const,
        statusCode: 400,
        body: { error: "EmptyMessage", message: "Say something to the Oracle." }
      };
    }

    // Resolve or create conversation session
    let conversationId = input.conversationId;
    let session = conversationId ? store.get(conversationId, input.wallet) : null;
    if (!session) {
      const created = store.create(input.wallet);
      conversationId = created.conversationId;
      session = created.session;
    }

    const [attempts, identityLink] = await Promise.all([
      this.questsService.listAttempts(input.wallet),
      this.identity.getIdentityLink(input.wallet)
    ]);

    const context = buildOracleContext(passport, attempts.map((a) => a.questId));
    const knowledgeBundle = await this.knowledge.buildContext({
      identityLink,
      message: userMessage,
      wallet: input.wallet
    });

    const systemPrompt = buildSystemPrompt(context, knowledgeBundle);
    const pastMessages = session.messages.slice();

    let responseText: string | null = null;
    let source = "local";

    // Try every configured provider in priority order until one answers.
    // This means adding more API keys directly increases resilience —
    // each one is a fallback, independent of ORACLE_PROVIDER.
    const candidates: Array<{
      name: string;
      available: boolean;
      ask: () => Promise<string>;
    }> = [
      {
        name: "gemini",
        available: Boolean(this.config.geminiApiKey),
        ask: () => this.askGemini(userMessage, pastMessages, systemPrompt)
      },
      {
        name: "openai",
        available: Boolean(this.config.openaiApiKey),
        ask: () => this.askOpenAI(userMessage, pastMessages, systemPrompt)
      },
      {
        name: "groq",
        available: Boolean(this.config.groqApiKey),
        ask: () => this.askGroq(userMessage, pastMessages, systemPrompt)
      },
      {
        name: "openrouter",
        available: Boolean(this.config.openrouterApiKey),
        ask: () => this.askOpenRouter(userMessage, pastMessages, systemPrompt)
      },
      {
        name: "anthropic",
        available: Boolean(this.config.apiKey) && this.config.provider === "anthropic",
        ask: () => this.askAnthropicCompat(userMessage, pastMessages, systemPrompt)
      },
      {
        name: "openai-compatible",
        available: Boolean(this.config.apiKey) && Boolean(this.config.endpoint) && this.config.provider === "openai-compatible",
        ask: () => this.askOpenAiCompatible(userMessage, pastMessages, systemPrompt)
      }
    ];

    for (const candidate of candidates) {
      if (!candidate.available) continue;

      responseText = await candidate.ask().catch((err) => {
        console.error(JSON.stringify({
          level: "error",
          event: `oracle_${candidate.name}_error`,
          message: err instanceof Error ? err.message : String(err)
        }));
        return null;
      });

      if (responseText) {
        source = candidate.name;
        break;
      }
    }

    if (!responseText) {
      responseText = buildLocalFallback(userMessage, context);
      source = "local";
    }

    store.append(conversationId!, { role: "user", content: userMessage }, { role: "assistant", content: responseText });

    return {
      ok: true as const,
      body: {
        conversationId,
        message: responseText,
        source
      }
    };
  }

  private async askGemini(
    userMessage: string,
    history: ConversationMessage[],
    systemPrompt: string
  ): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.config.geminiApiKey!);
    const model = genAI.getGenerativeModel({
      model: this.config.geminiModel ?? "gemini-2.0-flash",
      systemInstruction: systemPrompt
    });

    const geminiHistory = history.map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(userMessage);
    const text = result.response.text().trim();
    if (!text) throw new Error("Gemini returned empty response");
    return text;
  }

  private async askOpenAI(
    userMessage: string,
    history: ConversationMessage[],
    systemPrompt: string
  ): Promise<string> {
    return this.askOpenAiStyle({
      apiKey: this.config.openaiApiKey!,
      model: this.config.openaiModel ?? "gpt-4o-mini",
      providerLabel: "OpenAI",
      userMessage,
      history,
      systemPrompt
    });
  }

  private async askGroq(
    userMessage: string,
    history: ConversationMessage[],
    systemPrompt: string
  ): Promise<string> {
    return this.askOpenAiStyle({
      apiKey: this.config.groqApiKey!,
      baseURL: "https://api.groq.com/openai/v1",
      model: this.config.groqModel ?? "llama-3.3-70b-versatile",
      providerLabel: "Groq",
      userMessage,
      history,
      systemPrompt
    });
  }

  private async askOpenRouter(
    userMessage: string,
    history: ConversationMessage[],
    systemPrompt: string
  ): Promise<string> {
    return this.askOpenAiStyle({
      apiKey: this.config.openrouterApiKey!,
      baseURL: "https://openrouter.ai/api/v1",
      model: this.config.openrouterModel ?? "meta-llama/llama-3.3-70b-instruct:free",
      providerLabel: "OpenRouter",
      userMessage,
      history,
      systemPrompt
    });
  }

  // Groq and OpenRouter both speak the OpenAI chat-completions API shape,
  // so the same SDK client works against their base URLs.
  private async askOpenAiStyle(input: {
    apiKey: string;
    baseURL?: string;
    model: string;
    providerLabel: string;
    userMessage: string;
    history: ConversationMessage[];
    systemPrompt: string;
  }): Promise<string> {
    const client = new OpenAI({ apiKey: input.apiKey, baseURL: input.baseURL });
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: input.systemPrompt },
      ...input.history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })),
      { role: "user", content: input.userMessage }
    ];

    const completion = await client.chat.completions.create({
      model: input.model,
      messages,
      max_tokens: 512
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error(`${input.providerLabel} returned empty response`);
    return text;
  }

  private async askAnthropicCompat(
    userMessage: string,
    history: ConversationMessage[],
    systemPrompt: string
  ): Promise<string> {
    // Dynamic import so the package is optional at runtime if not installed
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: this.config.apiKey });
    const response = await client.messages.create({
      model: this.config.model ?? "claude-opus-4-8",
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        ...history.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })),
        { role: "user", content: userMessage }
      ]
    });
    const block = response.content.find((b) => b.type === "text");
    const text = block && block.type === "text" ? block.text.trim() : "";
    if (!text) throw new Error("Anthropic returned empty response");
    return text;
  }

  private async askOpenAiCompatible(
    userMessage: string,
    history: ConversationMessage[],
    systemPrompt: string
  ): Promise<string> {
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: "user", content: userMessage }
    ];

    const response = await fetch(this.config.endpoint!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: this.config.model, messages })
    });

    if (!response.ok) throw new Error(`OpenAI-compatible provider returned HTTP ${response.status}`);

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("OpenAI-compatible provider returned empty content");
    return text;
  }
}

import {
  builderClasses,
  demoDiscordActivity,
  demoTestnetActivity,
  evolutionStages,
  questCategories,
  quests,
  verifiedRitualProducts
} from "@ritual/domain";
import type { DiscordActivity, IdentityLink, TestnetActivity } from "@ritual/domain";
import type { ChainConfig, OracleKnowledgeConfig } from "../config.js";

export interface OracleKnowledgeSource {
  id: string;
  label: string;
  kind: "ritual_docs" | "chain" | "discord" | "passport" | "quests" | "products" | "indexer" | "social";
  freshness: "static" | "live" | "demo" | "unconfigured";
  summary: string;
  data?: unknown;
}

export interface OracleKnowledgeInput {
  message: string;
  wallet: string;
  identityLink?: IdentityLink | null;
}

export interface OracleKnowledgeBundle {
  queryIntent: OracleQueryIntent;
  sources: OracleKnowledgeSource[];
  unavailable: string[];
}

type OracleQueryIntent =
  | "discord"
  | "chain"
  | "ritual_docs"
  | "contributor"
  | "passport"
  | "quests"
  | "general";

export class OracleKnowledgeService {
  constructor(
    private readonly config: OracleKnowledgeConfig = {},
    private readonly chain: ChainConfig = {}
  ) {}

  async buildContext(input: OracleKnowledgeInput): Promise<OracleKnowledgeBundle> {
    const queryIntent = classifyOracleQuery(input.message);
    const unavailable: string[] = [];
    const sources: OracleKnowledgeSource[] = [
      buildRitualBasicsSource(this.chain),
      buildRitualDocsCorpusSource(),
      buildQuestSource(),
      buildProductsSource()
    ];

    if (input.identityLink) {
      sources.push({
        id: "linked-discord-identity",
        label: "Linked Discord identity",
        kind: "passport",
        freshness: "live",
        summary: `Wallet ${input.wallet.toLowerCase()} is linked to Discord user ${input.identityLink.discordUsername}.`,
        data: {
          discordId: input.identityLink.discordId,
          discordUsername: input.identityLink.discordUsername,
          wallet: input.identityLink.wallet
        }
      });
    }

    const optionalRequests = await Promise.allSettled([
      this.fetchDocsKnowledge(input.message),
      this.fetchDiscordKnowledge(input.message, input.identityLink),
      this.fetchIndexerKnowledge(input.wallet),
      this.fetchXSearchKnowledge(input.message)
    ]);

    for (const result of optionalRequests) {
      if (result.status === "fulfilled") {
        if (result.value.source) sources.push(result.value.source);
        if (result.value.unavailable) unavailable.push(result.value.unavailable);
      } else {
        unavailable.push("A live Oracle knowledge source failed and was skipped.");
      }
    }

    if (!this.config.discord?.endpoint) {
      sources.push(buildDemoDiscordSource(input.identityLink));
    }

    if (!this.config.indexer?.endpoint) {
      sources.push(buildDemoIndexerSource(input.wallet));
    }

    return { queryIntent, sources, unavailable };
  }

  private async fetchDocsKnowledge(message: string) {
    if (!this.config.docs?.endpoint) {
      return { unavailable: "Ritual docs search endpoint is not configured." };
    }

    const url = new URL(this.config.docs.endpoint);
    url.searchParams.set("q", message || "ritual chain");
    const response = await fetch(url, {
      headers: this.config.docs.apiKey ? { Authorization: `Bearer ${this.config.docs.apiKey}` } : undefined
    });

    if (!response.ok) {
      throw new Error(`Ritual docs source returned HTTP ${response.status}`);
    }

    const data = await response.json() as KnowledgeHttpResponse;
    return {
      source: normalizeHttpKnowledgeSource(data, {
        id: "ritual-docs-live",
        label: "Ritual docs search",
        kind: "ritual_docs",
        freshness: "live",
        summary: "Live Ritual documentation search results."
      })
    };
  }

  private async fetchDiscordKnowledge(message: string, identityLink?: IdentityLink | null) {
    if (!this.config.discord?.endpoint) {
      return { unavailable: "Discord intelligence endpoint is not configured." };
    }

    const url = new URL(this.config.discord.endpoint);
    url.searchParams.set("q", message || "ritual discord");
    if (identityLink?.discordId) url.searchParams.set("discordId", identityLink.discordId);
    if (identityLink?.discordUsername) url.searchParams.set("username", identityLink.discordUsername);
    const response = await fetch(url, {
      headers: this.config.discord.apiKey ? { Authorization: `Bearer ${this.config.discord.apiKey}` } : undefined
    });

    if (!response.ok) {
      throw new Error(`Discord knowledge source returned HTTP ${response.status}`);
    }

    const data = await response.json() as KnowledgeHttpResponse;
    return {
      source: normalizeHttpKnowledgeSource(data, {
        id: "ritual-discord-live",
        label: "Ritual Discord intelligence",
        kind: "discord",
        freshness: "live",
        summary: "Live Ritual Discord events, roles, contributor, and activity intelligence."
      })
    };
  }

  private async fetchIndexerKnowledge(wallet: string) {
    if (!this.config.indexer?.endpoint) {
      return { unavailable: "Ritual chain/indexer intelligence endpoint is not configured." };
    }

    const url = new URL(this.config.indexer.endpoint);
    url.searchParams.set("wallet", wallet.toLowerCase());
    const response = await fetch(url, {
      headers: this.config.indexer.apiKey ? { Authorization: `Bearer ${this.config.indexer.apiKey}` } : undefined
    });

    if (!response.ok) {
      throw new Error(`Indexer knowledge source returned HTTP ${response.status}`);
    }

    const data = await response.json() as KnowledgeHttpResponse;
    return {
      source: normalizeHttpKnowledgeSource(data, {
        id: "ritual-indexer-live",
        label: "Ritual chain intelligence",
        kind: "indexer",
        freshness: "live",
        summary: "Live Ritual chain activity, contract, and wallet intelligence."
      })
    };
  }

  private async fetchXSearchKnowledge(message: string) {
    const xSearch = this.config.xSearch;
    if (!xSearch?.apiKey || !xSearch.handles?.length) {
      return { unavailable: "Grok X Search is not configured (GROK_API_KEY / RITUAL_X_HANDLES)." };
    }

    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${xSearch.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: xSearch.model ?? "grok-4.5",
        input: [
          {
            role: "user",
            content: `Summarize the most relevant recent posts from ${xSearch.handles.join(", ")} on X for this question: ${message || "recent Ritual updates"}`
          }
        ],
        tools: [{ type: "x_search", allowed_x_handles: xSearch.handles }]
      })
    });

    if (!response.ok) {
      throw new Error(`Grok X Search returned HTTP ${response.status}`);
    }

    const data = await response.json() as GrokResponsesPayload;
    const text = extractGrokResponseText(data);
    if (!text) throw new Error("Grok X Search returned no usable text");

    return {
      source: {
        id: "ritual-x-search-live",
        label: `Ritual X (@${xSearch.handles.join(", @")})`,
        kind: "social" as const,
        freshness: "live" as const,
        summary: text,
        data: { citations: data.citations ?? extractGrokCitations(data) }
      }
    };
  }
}

interface GrokResponsesPayload {
  output_text?: string;
  citations?: unknown;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

// The exact xAI Responses API shape isn't fully pinned down from docs alone —
// this defensively checks the documented output_text convenience field first,
// then falls back to walking output[].content[] the way OpenAI's Responses
// API (which xAI's is modeled on) structures message output.
function extractGrokResponseText(data: GrokResponsesPayload): string | null {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string" && content.text.trim()) {
        return content.text.trim();
      }
    }
  }

  return null;
}

function extractGrokCitations(data: GrokResponsesPayload): unknown {
  return data.output?.flatMap((item) => item.content ?? []) ?? [];
}

interface KnowledgeHttpResponse {
  source?: Partial<OracleKnowledgeSource>;
  summary?: string;
  data?: unknown;
}

function normalizeHttpKnowledgeSource(
  response: KnowledgeHttpResponse,
  fallback: OracleKnowledgeSource
): OracleKnowledgeSource {
  return {
    ...fallback,
    ...response.source,
    data: response.source?.data ?? response.data ?? fallback.data,
    summary: response.source?.summary ?? response.summary ?? fallback.summary
  };
}

function buildRitualBasicsSource(chain: ChainConfig): OracleKnowledgeSource {
  return {
    id: "ritual-basics",
    label: "Ritual ecosystem facts",
    kind: "ritual_docs",
    freshness: "static",
    summary: "Core local facts about Ritual Ascension, Ritual testnet, deployed contracts, builder classes, and progression.",
    data: {
      network: {
        name: "Ritual Chain",
        chainId: chain.chainId ?? "1979",
        rpcUrl: chain.rpcUrl,
        passportNftAddress: chain.passportAddress,
        progressManagerAddress: chain.progressAddress
      },
      contracts: {
        passport: "Soulbound ERC-721 passport tracking class, stage, Discord hash, and metadata.",
        progress: "Progress manager for XP awards keyed by unique source references."
      },
      evolutionStages,
      builderClasses
    }
  };
}

// Curated from docs.ritualfoundation.org — condensed on purpose so every
// Oracle request doesn't carry the full site. Update this if the docs change.
function buildRitualDocsCorpusSource(): OracleKnowledgeSource {
  return {
    id: "ritual-docs-corpus",
    label: "Ritual Chain documentation",
    kind: "ritual_docs",
    freshness: "static",
    summary: "Curated facts from the official Ritual Chain docs — what the chain is, network details, precompiles, and autonomous agents.",
    data: {
      whatItIs:
        "Ritual Chain bills itself as \"the first blockchain where smart contracts can think, see, hear, and act\" — a chain built as a hub for autonomous agents, with AI capabilities enshrined at the protocol layer (built into the chain itself, not bolted on via external smart contracts or oracles).",
      network: {
        chainId: 1979,
        currency: "RITUAL (18 decimals, testnet)",
        blockTime: "~350ms",
        rpc: "rpc.ritualfoundation.org",
        explorer: "explorer.ritualfoundation.org",
        faucet: "faucet.ritualfoundation.org"
      },
      precompiles: {
        summary: "Seven capability groups, sixteen precompiles total.",
        think: [
          "LLM Inference (0x0802) — runs an open-weight model (GLM-4.7-FP8, 64K context) inside a TEE; no external API key needed since the model is self-hosted. This is what the app's \"Call the Ritual LLM Precompile\" quest calls.",
          "Classical Models / ONNX (0x0800) — runs ML models inline in the node's native runtime, same execution surface as a built-in like ecrecover.",
          "FHE Inference (0x0807) — processes CKKS-encrypted tensors inside a TEE; inputs and outputs stay ciphertext throughout."
        ],
        act: ["Sovereign Agent", "Persistent Agent", "HTTP", "Long-Running HTTP"],
        remember: ["DKMS (deterministic secp256k1 keypairs derived inside a TEE)", "Scheduler"],
        prove: ["Ed25519", "Passkeys", "P-256", "ZK Proofs (0x0806 — off-chain prover inside a TEE)"],
        keepSecrets: ["Secrets / ECIES", "X402 Payments"]
      },
      autonomousAgents: {
        sevenProperties: [
          "Immortal", "Emancipated", "Teleportable", "Financially sovereign",
          "Web2-interoperable", "Private", "Computationally sovereign"
        ],
        persistenceModels:
          "Sovereign agents use the Scheduler to wake themselves up at regular intervals. Persistent agents use heartbeats — if one is missed, the chain triggers automatic revival, restoring the agent's container from its data-availability checkpoint."
      },
      glossary: {
        Enshrined: "Implemented at the protocol layer of the chain, not via external smart contracts or oracles.",
        Superposition: "Ritual Chain running replicated (deterministic EVM) and delegated (TEE) execution over the same state.",
        "TEE-EOVMT": "Trusted Execution Environment, EVM with Off-chain Verifiable Machine Tasks.",
        "Sender lock": "One pending async job per EOA at a time — concurrent async precompile calls in the same transaction are not allowed."
      }
    }
  };
}

function buildQuestSource(): OracleKnowledgeSource {
  return {
    id: "ritual-quest-catalog",
    label: "Ritual Ascension quest catalog",
    kind: "quests",
    freshness: "static",
    summary: `${quests.length} local quests across ${questCategories.length} categories are available for guidance and recommendations.`,
    data: {
      categories: questCategories,
      quests: quests.map((quest) => ({
        id: quest.id,
        title: quest.title,
        category: quest.category,
        verification: quest.verification,
        xp: quest.xp,
        difficulty: quest.difficulty,
        metric: quest.metric,
        target: quest.target,
        roleName: quest.roleName
      }))
    }
  };
}

function buildProductsSource(): OracleKnowledgeSource {
  return {
    id: "verified-ritual-products",
    label: "Verified Ritual products",
    kind: "products",
    freshness: "static",
    summary: `${verifiedRitualProducts.length} reviewed Ritual builder products are available as examples.`,
    data: verifiedRitualProducts
  };
}

function buildDemoDiscordSource(identityLink?: IdentityLink | null): OracleKnowledgeSource {
  const activity: DiscordActivity = identityLink
    ? {
        ...demoDiscordActivity,
        connectedWallet: identityLink.wallet,
        discordId: identityLink.discordId,
        username: identityLink.discordUsername
      }
    : demoDiscordActivity;

  return {
    id: "demo-discord-intelligence",
    label: "Demo Discord intelligence",
    kind: "discord",
    freshness: "demo",
    summary: "Demo Discord activity is available. Configure a Discord intelligence endpoint for live events, role counts, and contributor lookup.",
    data: {
      activity,
      supportedLiveCapabilities: [
        "scheduled events",
        "role counts",
        "member role lookup",
        "contributor summaries",
        "channel activity summaries",
        "linked Discord-to-wallet context"
      ]
    }
  };
}

function buildDemoIndexerSource(wallet: string): OracleKnowledgeSource {
  const activity: TestnetActivity = {
    ...demoTestnetActivity,
    wallet: wallet.toLowerCase()
  };

  return {
    id: "demo-chain-intelligence",
    label: "Demo Ritual chain intelligence",
    kind: "indexer",
    freshness: "demo",
    summary: "Demo Ritual wallet activity is available. Configure a chain/indexer intelligence endpoint for live transactions, deployments, and contract activity.",
    data: activity
  };
}

function classifyOracleQuery(message: string): OracleQueryIntent {
  const normalized = message.toLowerCase();
  if (/\bdiscord|role|event|member|username|contributor|server|channel\b/.test(normalized)) {
    return /\busername|contributor|member\b/.test(normalized) ? "contributor" : "discord";
  }
  if (/\btransaction|tx|contract|deploy|rpc|chain|block|wallet|precompile\b/.test(normalized)) {
    return "chain";
  }
  if (/\bquest|xp|level|stage|passport|achievement\b/.test(normalized)) {
    return /\bpassport\b/.test(normalized) ? "passport" : "quests";
  }
  if (/\britual|infernet|docs|documentation|how do i|what is\b/.test(normalized)) {
    return "ritual_docs";
  }
  return "general";
}

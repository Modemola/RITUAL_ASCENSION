// API Client for Ritual Ascension backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode?: number;
}

// Type definitions
export interface PassportData {
  passport: {
    wallet: string;
    tokenId: number;
    classId: number;
    xp: number;
    stage: number;
    reputation: number;
    level: number;
    levelProgress: { level: number; percent: number; nextXp: number };
  };
}

export interface ProfileData {
  profile: {
    wallet: string;
    passport: any;
    achievements: any[];
    completedQuests: any[];
  };
}

export interface OracleResponse {
  conversationId: string;
  message: string;
  recommendedQuest: { id: string; title: string; reason: string };
  learningOutcome: string;
  nextMilestone: string;
  rateLimitRemaining: number;
}

export interface LeaderboardEntry {
  wallet: string;
  className: string;
  level: number;
  reputation: number;
}

export interface LeaderboardData {
  builders: LeaderboardEntry[];
}

export interface QuestData {
  quest: any;
}

export interface QuestsData {
  quests: any[];
  total: number;
}

export interface QuestCategoriesData {
  categories: any[];
}

export interface TestnetActivityData {
  activity: {
    wallet: string;
    network: "ritual-testnet";
    completedTasks: number;
    uniqueContracts: number;
    transactions: number;
    activeDays: number;
    lastIndexedBlock: number;
  };
}

export interface DiscordActivityData {
  activity: {
    discordId: string;
    username: string;
    serverId: string;
    messages: number;
    roles: string[];
    connectedWallet?: string;
  };
}

export interface VerificationData {
  questId: string;
  proof?: string;
  verification: {
    ok: boolean;
    reason: string;
    source?: string;
    value?: number;
    required?: number;
    roles?: string[];
    requiredRole?: string;
    capped?: boolean;
  };
}

// Generic fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string; statusCode?: number }> {
  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.message || `HTTP ${response.status}`,
        statusCode: response.status,
      };
    }

    const data = await response.json();
    return { data: data as T, statusCode: 200 };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch from API",
      statusCode: 500,
    };
  }
}

// API Methods
export const apiClient = {
  // Get user passport
  getPassport: (wallet: string) =>
    apiFetch<PassportData>(`/api/passport/${wallet}`),

  // Get user profile
  getProfile: (wallet: string) =>
    apiFetch<ProfileData>(`/api/profile/${wallet}`),

  // Get all quests (optional class filter)
  getQuests: (params?: { classId?: number; category?: string }) => {
    const search = new URLSearchParams();
    if (params?.classId) search.set("class", String(params.classId));
    if (params?.category) search.set("category", params.category);
    const query = search.toString() ? `?${search}` : "";
    return apiFetch<QuestsData>(`/api/quests${query}`);
  },

  // Get one quest
  getQuest: (id: string) => apiFetch<QuestData>(`/api/quests/${id}`),

  // Get quest categories
  getQuestCategories: () => apiFetch<QuestCategoriesData>(`/api/quest-categories`),

  // Get leaderboard
  getLeaderboard: () => apiFetch<LeaderboardData>(`/api/leaderboard`),

  // Get builder classes
  getClasses: () => apiFetch(`/api/classes`),

  // Get evolution stages
  getEvolution: () => apiFetch(`/api/passport/evolution`),

  // Oracle chat
  askOracle: (message: string, wallet: string) =>
    apiFetch<OracleResponse>(`/api/oracle/chat`, {
      method: "POST",
      body: JSON.stringify({ message, wallet }),
    }),

  // Ritual testnet-only wallet activity
  getTestnetActivity: (wallet: string) =>
    apiFetch<TestnetActivityData>(`/api/testnet/activity?wallet=${encodeURIComponent(wallet)}`),

  // Discord account activity
  getDiscordActivity: (discordId: string) =>
    apiFetch<DiscordActivityData>(`/api/discord/activity?discordId=${encodeURIComponent(discordId)}`),

  // Mock Discord connection
  connectDiscord: (wallet: string, discordId: string, username: string) =>
    apiFetch<{ discord: DiscordActivityData["activity"] }>(`/api/discord/connect`, {
      method: "POST",
      body: JSON.stringify({ wallet, discordId, username }),
    }),

  // Verify a task
  verifyQuest: (questId: string, payload: { wallet?: string; discordId?: string; proof?: string }) =>
    apiFetch<VerificationData>(`/api/quests/${questId}/verify`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Health check
  health: () => apiFetch(`/api/health`),
};

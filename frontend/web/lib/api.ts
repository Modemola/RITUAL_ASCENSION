import type { Achievement, Quest, QuestCategory } from "@ritual/domain";

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
    passport: PassportData["passport"];
    achievements: Achievement[];
    completedQuests: Quest[];
    identityLink?: IdentityLink | null;
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
  builderXp?: number;
}

export interface LeaderboardData {
  scope?: "builder_tasks_only";
  builders: LeaderboardEntry[];
}

export interface ActivityFeedItem {
  id: string;
  wallet: string;
  type: "xp_awarded" | "achievement_unlocked" | "passport_evolved";
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityFeedData {
  wallet: string;
  activity: ActivityFeedItem[];
  total: number;
}

export interface NotificationItem {
  id: string;
  wallet: string;
  type: ActivityFeedItem["type"];
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

export interface NotificationsData {
  wallet: string;
  notifications: NotificationItem[];
  unread: number;
  total: number;
}

export interface IdentityLink {
  wallet: string;
  passportTokenId: number;
  discordId: string;
  discordUsername: string;
  discordAvatarUrl?: string;
  discordAccountHash?: string;
}

export interface VerifiedRitualProduct {
  id: string;
  name: string;
  builderWallet: string;
  category: "Agent" | "Dashboard" | "Template" | "Protocol" | "Tool";
  description: string;
  url: string;
  repositoryUrl?: string;
  approvedAt: string;
  verificationBadge: "Backend approved" | "Security reviewed" | "Community verified";
  tags: string[];
}

export interface VerifiedProductsData {
  products: VerifiedRitualProduct[];
  total: number;
}

export interface QuestData {
  quest: Quest;
}

export interface QuestsData {
  quests: Array<Quest & { attempt?: QuestAttempt | null }>;
  attempts?: QuestAttempt[];
  total: number;
}

export interface QuestCategoriesData {
  categories: QuestCategory[];
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
    avatarUrl?: string;
    accountHash?: string;
  };
}

export interface DiscordLinkChallengeData {
  wallet: string;
  challenge: string;
  expiresAt: string;
}

export interface VerificationData {
  questId: string;
  proof?: string;
  attempt?: QuestAttempt;
  review?: ReviewRecord | null;
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
  progression?: {
    passport: {
      wallet: string;
      tokenId: number;
      classId: number;
      xp: number;
      stage: number;
      achievements: Achievement[];
      completedQuestIds: string[];
      activeWeeks: number;
      projectsCompleted: number;
      agentsDeployed: number;
    };
    xpEvents: Array<{
      id: string;
      wallet: string;
      amount: number;
      reason: string;
      sourceRef: string;
      questAttemptId?: string;
      awardedAt: string;
    }>;
    unlockedAchievements: Achievement[];
    evolutionEvents: Array<{
      id: string;
      wallet: string;
      tokenId: number;
      fromStage: number;
      toStage: number;
      reason: string;
      txHash?: string;
      createdAt: string;
    }>;
  } | null;
}

export interface QuestAttempt {
  id: string;
  wallet: string;
  questId: string;
  status: "started" | "submitted" | "verified" | "rejected" | "completed";
  proof?: string;
  verificationSource?: string;
  verificationResult: Record<string, unknown>;
  submittedAt?: string;
  verifiedAt?: string;
  completedAt?: string;
}

export interface QuestAttemptData {
  attempt: QuestAttempt;
  review?: ReviewRecord | null;
}

export interface ReviewRecord {
  id: string;
  wallet: string;
  questAttemptId: string;
  productId?: string;
  reviewerWallet?: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface ReviewQueueItem {
  review: ReviewRecord;
  attempt: QuestAttempt;
  quest?: Quest;
}

export interface ReviewQueueData {
  reviews: ReviewQueueItem[];
  total: number;
}

export interface ReviewDecisionData {
  review: ReviewRecord;
  attempt: QuestAttempt;
  progression?: VerificationData["progression"];
}

export interface AuthNonceData {
  wallet: string;
  nonce: string;
  message: string;
  expiresAt: string;
}

export interface AuthVerifyData {
  wallet: string;
  token: string;
  tokenType: "Bearer";
  expiresIn: number;
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

  // Mint user passport
  mintPassport: (payload: { wallet: string; classId: number; mintSignature: string }, token?: string) =>
    apiFetch<PassportData>(`/api/passport/mint`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(payload),
    }),

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

  getActivity: (wallet: string, token?: string, limit = 20) =>
    apiFetch<ActivityFeedData>(`/api/activity?wallet=${encodeURIComponent(wallet)}&limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  getNotifications: (wallet: string, token?: string, limit = 20) =>
    apiFetch<NotificationsData>(`/api/notifications?wallet=${encodeURIComponent(wallet)}&limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  getReviewQueue: (token?: string, limit = 50) =>
    apiFetch<ReviewQueueData>(`/api/admin/reviews?limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  decideReview: (reviewId: string, payload: { status: "approved" | "rejected"; notes?: string }, token?: string) =>
    apiFetch<ReviewDecisionData>(`/api/admin/reviews/${reviewId}/decision`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(payload),
    }),

  // Verified Ritual products approved by backend review
  getVerifiedProducts: () => apiFetch<VerifiedProductsData>(`/api/products/verified`),

  // Get builder classes
  getClasses: () => apiFetch(`/api/classes`),

  // Get evolution stages
  getEvolution: () => apiFetch(`/api/passport/evolution`),

  // Oracle chat
  askOracle: (message: string, wallet: string, token?: string) =>
    apiFetch<OracleResponse>(`/api/oracle/chat`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify({ message, wallet }),
    }),

  // Ritual testnet-only wallet activity
  getTestnetActivity: (wallet: string) =>
    apiFetch<TestnetActivityData>(`/api/testnet/activity?wallet=${encodeURIComponent(wallet)}`),

  // Discord account activity
  getDiscordActivity: (discordId: string) =>
    apiFetch<DiscordActivityData>(`/api/discord/activity?discordId=${encodeURIComponent(discordId)}`),

  // Mock Discord connection
  createAuthNonce: (wallet: string) =>
    apiFetch<AuthNonceData>(`/api/auth/nonce`, {
      method: "POST",
      body: JSON.stringify({ wallet }),
    }),

  verifyAuthSignature: (wallet: string, message: string, signature: string) =>
    apiFetch<AuthVerifyData>(`/api/auth/verify`, {
      method: "POST",
      body: JSON.stringify({ wallet, message, signature }),
    }),

  createDiscordLinkChallenge: (wallet: string, token?: string) =>
    apiFetch<DiscordLinkChallengeData>(`/api/discord/link-challenge`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify({ wallet }),
    }),

  verifyDiscordLink: (
    payload: { wallet: string; challenge: string; discordId: string; username: string; avatarUrl?: string },
    token?: string
  ) =>
    apiFetch<{ discord: DiscordActivityData["activity"] }>(`/api/discord/link-verify`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(payload),
    }),

  connectDiscord: (wallet: string, discordId: string, username: string, token?: string) =>
    apiFetch<{ discord: DiscordActivityData["activity"] }>(`/api/discord/connect`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify({ wallet, discordId, username }),
    }),

  // Verify a task
  startQuest: (questId: string, wallet: string, token?: string) =>
    apiFetch<QuestAttemptData>(`/api/quests/${questId}/start`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify({ wallet }),
    }),

  submitQuest: (questId: string, payload: { wallet?: string; discordId?: string; proof?: string }, token?: string) =>
    apiFetch<QuestAttemptData>(`/api/quests/${questId}/submit`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(payload),
    }),

  verifyQuest: (questId: string, payload: { wallet?: string; discordId?: string; proof?: string }, token?: string) =>
    apiFetch<VerificationData>(`/api/quests/${questId}/verify`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(payload),
    }),

  // Health check
  health: () => apiFetch(`/api/health`),
};

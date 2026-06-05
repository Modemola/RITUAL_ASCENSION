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
  getQuests: (classId?: number) => {
    const query = classId ? `?class=${classId}` : "";
    return apiFetch(`/api/quests${query}`);
  },

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

  // Health check
  health: () => apiFetch(`/api/health`),
};

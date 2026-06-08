import { achievements, getQuest } from "@ritual/domain";
import type {
  ActivityFeedItem,
  ProgressionRepository
} from "../repositories/progression-repository.js";
import { normalizeWallet } from "../validators.js";

export interface NotificationItem {
  id: string;
  wallet: string;
  type: ActivityFeedItem["type"];
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  read: boolean;
}

export class NotificationService {
  constructor(private readonly progression: ProgressionRepository) {}

  async listActivity(wallet?: string, limit?: number) {
    const normalizedWallet = normalizeWallet(wallet);
    if (!normalizedWallet) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidWallet",
          message: "A valid wallet is required to load activity"
        }
      };
    }

    const safeLimit = clampLimit(limit);
    const activity = await this.progression.listActivityFeed(normalizedWallet, safeLimit);
    return {
      ok: true as const,
      body: {
        wallet: normalizedWallet,
        activity: activity.map(formatActivityFeedItem),
        total: activity.length
      }
    };
  }

  async listNotifications(wallet?: string, limit?: number) {
    const result = await this.listActivity(wallet, limit);
    if (!result.ok) return result;

    return {
      ok: true as const,
      body: {
        wallet: result.body.wallet,
        notifications: result.body.activity.map(toNotification),
        unread: result.body.activity.length,
        total: result.body.total
      }
    };
  }
}

function clampLimit(limit?: number) {
  if (!Number.isFinite(limit)) return 20;
  return Math.min(100, Math.max(1, Math.floor(limit ?? 20)));
}

function formatActivityFeedItem(item: ActivityFeedItem) {
  return {
    ...item,
    title: getActivityTitle(item),
    description: getActivityDescription(item)
  };
}

function toNotification(item: ReturnType<typeof formatActivityFeedItem>): NotificationItem {
  return {
    id: item.id,
    wallet: item.wallet,
    type: item.type,
    title: item.title,
    message: item.description,
    metadata: item.metadata,
    createdAt: item.createdAt,
    read: false
  };
}

function getActivityTitle(item: ActivityFeedItem) {
  if (item.type === "achievement_unlocked") {
    const achievement = achievements.find((entry) => entry.id === item.metadata.achievementId);
    return achievement ? achievement.name : item.title;
  }

  if (item.type === "xp_awarded" && typeof item.metadata.sourceRef === "string") {
    const questId = item.metadata.sourceRef.split(":").at(-1);
    const quest = questId ? getQuest(questId) : undefined;
    return quest ? quest.title : item.title;
  }

  return item.title;
}

function getActivityDescription(item: ActivityFeedItem) {
  if (item.type === "achievement_unlocked") {
    const achievement = achievements.find((entry) => entry.id === item.metadata.achievementId);
    return achievement ? achievement.trigger : item.description;
  }

  return item.description;
}

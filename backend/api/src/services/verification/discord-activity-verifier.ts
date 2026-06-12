import type { IdentityService } from "../identity-service.js";
import type { DiscordActivitySource } from "./activity-sources.js";
import { DemoDiscordActivitySource } from "./activity-sources.js";
import type { QuestVerificationContext, QuestVerificationResult, QuestVerifier } from "./types.js";

export class DiscordActivityVerifier implements QuestVerifier {
  constructor(
    private readonly identityService: IdentityService,
    private readonly activitySource: DiscordActivitySource = new DemoDiscordActivitySource()
  ) {}

  async verify({ quest, wallet, discordId }: QuestVerificationContext): Promise<QuestVerificationResult> {
    const identityCheck = await verifyDiscordIdentity(this.identityService, wallet, discordId);
    if (identityCheck) return identityCheck;

    const activity = await this.activitySource.getActivity(discordId!);
    const required = quest.target ?? 0;
    return {
      ok: activity.messages >= required,
      reason:
        activity.messages >= required
          ? "Ritual Discord message threshold met"
          : `Discord messages are ${activity.messages}; ${required} required`,
      source: this.activitySource.sourceName,
      value: activity.messages,
      required
    };
  }
}

export async function verifyDiscordIdentity(
  identityService: IdentityService,
  wallet?: string,
  discordId?: string
): Promise<QuestVerificationResult | null> {
  if (!identityService.hasLinkedWallet(wallet)) {
    return {
      ok: false,
      reason: "Connect the passport wallet before Discord verification"
    };
  }

  if (!(await identityService.hasLinkedDiscord(wallet, discordId))) {
    return {
      ok: false,
      reason: "Verification only checks the Discord account linked to this Soulbound Passport"
    };
  }

  return null;
}

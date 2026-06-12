import type { IdentityService } from "../identity-service.js";
import type { DiscordActivitySource } from "./activity-sources.js";
import { DemoDiscordActivitySource } from "./activity-sources.js";
import { verifyDiscordIdentity } from "./discord-activity-verifier.js";
import type { QuestVerificationContext, QuestVerificationResult, QuestVerifier } from "./types.js";

export class DiscordRoleVerifier implements QuestVerifier {
  constructor(
    private readonly identityService: IdentityService,
    private readonly activitySource: DiscordActivitySource = new DemoDiscordActivitySource()
  ) {}

  async verify({ quest, wallet, discordId }: QuestVerificationContext): Promise<QuestVerificationResult> {
    const identityCheck = await verifyDiscordIdentity(this.identityService, wallet, discordId);
    if (identityCheck) return identityCheck;

    const activity = await this.activitySource.getActivity(discordId!);
    const hasRole = quest.roleName ? activity.roles.includes(quest.roleName) : false;
    return {
      ok: hasRole,
      reason: hasRole ? `${quest.roleName} role found in Ritual Discord` : `${quest.roleName} role not found`,
      source: this.activitySource.sourceName,
      roles: activity.roles,
      requiredRole: quest.roleName
    };
  }
}

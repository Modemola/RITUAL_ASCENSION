import { demoDiscordActivity } from "@ritual/domain";
import type { IdentityService } from "../identity-service.js";
import { verifyDiscordIdentity } from "./discord-activity-verifier.js";
import type { QuestVerificationContext, QuestVerificationResult, QuestVerifier } from "./types.js";

export class DiscordRoleVerifier implements QuestVerifier {
  constructor(private readonly identityService: IdentityService) {}

  async verify({ quest, wallet, discordId }: QuestVerificationContext): Promise<QuestVerificationResult> {
    const identityCheck = await verifyDiscordIdentity(this.identityService, wallet, discordId);
    if (identityCheck) return identityCheck;

    const hasRole = quest.roleName ? demoDiscordActivity.roles.includes(quest.roleName) : false;
    return {
      ok: hasRole,
      reason: hasRole ? `${quest.roleName} role found in Ritual Discord` : `${quest.roleName} role not found`,
      source: "ritual-discord-bot",
      roles: demoDiscordActivity.roles,
      requiredRole: quest.roleName
    };
  }
}

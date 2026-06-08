import { demoDiscordActivity } from "@ritual/domain";
import type { IdentityService } from "../identity-service.js";
import type { QuestVerificationContext, QuestVerificationResult, QuestVerifier } from "./types.js";

export class DiscordActivityVerifier implements QuestVerifier {
  constructor(private readonly identityService: IdentityService) {}

  async verify({ quest, wallet, discordId }: QuestVerificationContext): Promise<QuestVerificationResult> {
    const identityCheck = await verifyDiscordIdentity(this.identityService, wallet, discordId);
    if (identityCheck) return identityCheck;

    const required = quest.target ?? 0;
    return {
      ok: demoDiscordActivity.messages >= required,
      reason:
        demoDiscordActivity.messages >= required
          ? "Ritual Discord message threshold met"
          : `Discord messages are ${demoDiscordActivity.messages}; ${required} required`,
      source: "ritual-discord-bot",
      value: demoDiscordActivity.messages,
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

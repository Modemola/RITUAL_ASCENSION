import { getQuest } from "@ritual/domain";
import type { IdentityService } from "./identity-service.js";
import { BuilderProofVerifier } from "./verification/builder-proof-verifier.js";
import { DiscordActivityVerifier } from "./verification/discord-activity-verifier.js";
import { DiscordRoleVerifier } from "./verification/discord-role-verifier.js";
import { TestnetActivityVerifier } from "./verification/testnet-activity-verifier.js";
import type { QuestVerifier } from "./verification/types.js";

export class QuestVerificationService {
  private readonly builderProofVerifier: QuestVerifier;
  private readonly discordActivityVerifier: QuestVerifier;
  private readonly discordRoleVerifier: QuestVerifier;
  private readonly testnetActivityVerifier: QuestVerifier;

  constructor(identityService: IdentityService) {
    this.builderProofVerifier = new BuilderProofVerifier(identityService);
    this.discordActivityVerifier = new DiscordActivityVerifier(identityService);
    this.discordRoleVerifier = new DiscordRoleVerifier(identityService);
    this.testnetActivityVerifier = new TestnetActivityVerifier(identityService);
  }

  async verifyQuest(questId: string, wallet?: string, discordId?: string, proof?: string) {
    const quest = getQuest(questId);
    if (!quest) {
      return { ok: false, reason: "Quest not found" };
    }

    const verifier = this.getVerifier(quest.verification);
    return verifier.verify({ quest, wallet, discordId, proof });
  }

  private getVerifier(verification: string) {
    switch (verification) {
      case "TESTNET_ACTIVITY":
        return this.testnetActivityVerifier;
      case "DISCORD_ACTIVITY":
        return this.discordActivityVerifier;
      case "DISCORD_ROLE":
        return this.discordRoleVerifier;
      case "TX_HASH":
      case "MANUAL_REVIEW":
      case "AI_REVIEW":
      default:
        return this.builderProofVerifier;
    }
  }
}

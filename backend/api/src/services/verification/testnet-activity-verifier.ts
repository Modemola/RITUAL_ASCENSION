import { demoTestnetActivity } from "@ritual/domain";
import type { IdentityService } from "../identity-service.js";
import type { QuestVerificationContext, QuestVerificationResult, QuestVerifier } from "./types.js";

export class TestnetActivityVerifier implements QuestVerifier {
  constructor(private readonly identityService: IdentityService) {}

  async verify({ quest, wallet }: QuestVerificationContext): Promise<QuestVerificationResult> {
    if (!this.identityService.hasLinkedWallet(wallet)) {
      return {
        ok: false,
        reason: "Verification only checks the wallet linked to this Soulbound Passport"
      };
    }

    const value = quest.metric ? Number(demoTestnetActivity[quest.metric as keyof typeof demoTestnetActivity] ?? 0) : 0;
    const required = quest.target ?? 0;

    return {
      ok: value >= required,
      reason:
        value >= required
          ? "Ritual testnet activity threshold met"
          : `Ritual testnet activity is ${value}; ${required} required`,
      source: "ritual-testnet-indexer",
      value,
      required,
      capped: quest.limit === 1
    };
  }
}

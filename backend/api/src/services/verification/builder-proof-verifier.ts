import type { IdentityService } from "../identity-service.js";
import type { QuestVerificationContext, QuestVerificationResult, QuestVerifier } from "./types.js";

export class BuilderProofVerifier implements QuestVerifier {
  constructor(private readonly identityService: IdentityService) {}

  async verify({ quest, wallet }: QuestVerificationContext): Promise<QuestVerificationResult> {
    if (!this.identityService.hasLinkedWallet(wallet)) {
      return {
        ok: false,
        reason: "Builder quest verification only accepts proof from the linked passport wallet"
      };
    }

    return {
      ok: true,
      reason: "Builder quest proof accepted for review",
      source: quest.verification
    };
  }
}

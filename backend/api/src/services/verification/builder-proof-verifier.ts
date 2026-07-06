import type { IdentityService } from "../identity-service.js";
import type { QuestVerificationContext, QuestVerificationResult, QuestVerifier } from "./types.js";

export class BuilderProofVerifier implements QuestVerifier {
  constructor(private readonly identityService: IdentityService) {}

  async verify({ quest, wallet, proof }: QuestVerificationContext): Promise<QuestVerificationResult> {
    if (!this.identityService.hasLinkedWallet(wallet)) {
      return {
        ok: false,
        reason: "Builder quest verification only accepts proof from the linked passport wallet"
      };
    }

    const trimmedProof = proof?.trim() ?? "";
    if (!trimmedProof) {
      return {
        ok: false,
        reason: "A proof or note is required to submit this builder quest"
      };
    }

    if (quest.verification === "TX_HASH") {
      const isTxHash = /^0x[0-9a-fA-F]{64}$/.test(trimmedProof);
      if (!isTxHash) {
        return {
          ok: false,
          reason: "Expected a valid transaction hash (0x followed by 64 hex characters)"
        };
      }
    }

    return {
      ok: true,
      reason: "Builder quest proof accepted for review",
      source: quest.verification
    };
  }
}

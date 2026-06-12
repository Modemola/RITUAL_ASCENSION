import type { IdentityService } from "../identity-service.js";
import type { TestnetActivitySource } from "./activity-sources.js";
import { DemoTestnetActivitySource } from "./activity-sources.js";
import type { QuestVerificationContext, QuestVerificationResult, QuestVerifier } from "./types.js";

export class TestnetActivityVerifier implements QuestVerifier {
  constructor(
    private readonly identityService: IdentityService,
    private readonly activitySource: TestnetActivitySource = new DemoTestnetActivitySource()
  ) {}

  async verify({ quest, wallet }: QuestVerificationContext): Promise<QuestVerificationResult> {
    if (!wallet || !this.identityService.hasLinkedWallet(wallet)) {
      return {
        ok: false,
        reason: "Verification only checks the wallet linked to this Soulbound Passport"
      };
    }

    const activity = await this.activitySource.getActivity(wallet);
    const value = quest.metric ? Number(activity[quest.metric as keyof typeof activity] ?? 0) : 0;
    const required = quest.target ?? 0;

    return {
      ok: value >= required,
      reason:
        value >= required
          ? "Ritual testnet activity threshold met"
          : `Ritual testnet activity is ${value}; ${required} required`,
      source: this.activitySource.sourceName,
      value,
      required,
      capped: quest.limit === 1
    };
  }
}

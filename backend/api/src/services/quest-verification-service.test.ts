import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InMemoryDiscordLinkChallengeRepository } from "../repositories/discord-link-challenge-repository.js";
import { InMemoryIdentityLinkRepository } from "../repositories/identity-link-repository.js";
import { InMemoryPassportRepository } from "../repositories/passport-repository.js";
import { IdentityService } from "./identity-service.js";
import { QuestVerificationService } from "./quest-verification-service.js";

const demoWallet = "0xA5C3f19D0b8e6A45B6f1b9B4A21c7F1D9E3b8124";

describe("QuestVerificationService", () => {
  it("delegates testnet activity verification", async () => {
    const service = createService();
    const result = await service.verifyQuest("tester-contract-explorer", demoWallet);

    assert.equal(result.ok, true);
    assert.equal(result.source, "ritual-testnet-indexer");
    assert.equal(result.value, 58);
    assert.equal(result.required, 10);
  });

  it("delegates Discord role verification", async () => {
    const service = createService();
    const result = await service.verifyQuest("discord-bitty-role", demoWallet, "ritual-demo-user");

    assert.equal(result.ok, true);
    assert.equal(result.source, "ritual-discord-bot");
    assert.equal(result.requiredRole, "Bitty");
  });

  it("rejects Discord verification for an unlinked Discord account", async () => {
    const service = createService();
    const result = await service.verifyQuest("discord-first-message", demoWallet, "someone-else");

    assert.equal(result.ok, false);
    assert.equal(result.reason, "Verification only checks the Discord account linked to this Soulbound Passport");
  });

  it("delegates builder proof verification", async () => {
    const service = createService();
    const result = await service.verifyQuest("builder-integration-guide", demoWallet, undefined, "https://example.com/guide");

    assert.equal(result.ok, true);
    assert.equal(result.source, "MANUAL_REVIEW");
  });
});

function createService() {
  return new QuestVerificationService(
    new IdentityService(
      new InMemoryIdentityLinkRepository(),
      new InMemoryDiscordLinkChallengeRepository(),
      new InMemoryPassportRepository()
    )
  );
}

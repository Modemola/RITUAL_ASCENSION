import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InMemoryDiscordLinkChallengeRepository } from "../repositories/discord-link-challenge-repository.js";
import { InMemoryIdentityLinkRepository } from "../repositories/identity-link-repository.js";
import { InMemoryPassportRepository } from "../repositories/passport-repository.js";
import { IdentityService } from "./identity-service.js";
import { QuestVerificationService } from "./quest-verification-service.js";
import type { DiscordActivitySource, TestnetActivitySource } from "./verification/activity-sources.js";

const demoWallet = "0xA5C3f19D0b8e6A45B6f1b9B4A21c7F1D9E3b8124";

describe("QuestVerificationService", () => {
  it("delegates testnet activity verification", async () => {
    const service = createService();
    const result = await service.verifyQuest("tester-contract-explorer", demoWallet);

    assert.equal(result.ok, true);
    assert.equal(result.source, "demo-ritual-testnet-indexer");
    assert.equal(result.value, 58);
    assert.equal(result.required, 10);
  });

  it("delegates Discord role verification", async () => {
    const service = createService();
    const result = await service.verifyQuest("discord-bitty-role", demoWallet, "ritual-demo-user");

    assert.equal(result.ok, true);
    assert.equal(result.source, "demo-ritual-discord-bot");
    assert.equal(result.requiredRole, "Bitty");
  });

  it("accepts live activity source adapters", async () => {
    const service = createService({
      discordActivitySource: new FakeDiscordActivitySource(),
      testnetActivitySource: new FakeTestnetActivitySource()
    });

    const testnetResult = await service.verifyQuest("tester-contract-explorer", demoWallet);
    const discordResult = await service.verifyQuest("discord-bitty-role", demoWallet, "ritual-demo-user");

    assert.equal(testnetResult.ok, false);
    assert.equal(testnetResult.source, "fake-testnet");
    assert.equal(testnetResult.value, 2);
    assert.equal(discordResult.ok, false);
    assert.equal(discordResult.source, "fake-discord");
    assert.deepEqual(discordResult.roles, ["Visitor"]);
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

function createService(options?: ConstructorParameters<typeof QuestVerificationService>[1]) {
  return new QuestVerificationService(
    new IdentityService(
      new InMemoryIdentityLinkRepository(),
      new InMemoryDiscordLinkChallengeRepository(),
      new InMemoryPassportRepository()
    ),
    options
  );
}

class FakeTestnetActivitySource implements TestnetActivitySource {
  sourceName = "fake-testnet";

  async getActivity(wallet: string) {
    return {
      wallet,
      network: "ritual-testnet" as const,
      completedTasks: 1,
      uniqueContracts: 2,
      transactions: 3,
      activeDays: 4,
      lastIndexedBlock: 5
    };
  }
}

class FakeDiscordActivitySource implements DiscordActivitySource {
  sourceName = "fake-discord";

  async getActivity(discordId: string) {
    return {
      discordId,
      username: "fake",
      serverId: "ritual",
      messages: 0,
      roles: ["Visitor"],
      connectedWallet: demoWallet
    };
  }
}

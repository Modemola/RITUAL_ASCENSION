import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InMemoryIdentityLinkRepository } from "./identity-link-repository.js";

describe("InMemoryIdentityLinkRepository", () => {
  it("persists identity links by wallet and Discord ID", async () => {
    const repository = new InMemoryIdentityLinkRepository();
    const identityLink = {
      wallet: "0x2222222222222222222222222222222222222222",
      passportTokenId: 2222,
      discordId: "ritual-second-user",
      discordUsername: "second_builder"
    };

    await repository.save(identityLink);

    assert.deepEqual(await repository.findByWallet(identityLink.wallet.toLowerCase()), identityLink);
    assert.deepEqual(await repository.findByDiscordId(identityLink.discordId), identityLink);
  });
});

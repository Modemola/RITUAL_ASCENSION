import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RitualChainClient } from "../chain/ritual-chain-client.js";
import { DisabledRitualChainClient } from "../chain/ritual-chain-client.js";
import { InMemoryPassportRepository } from "../repositories/passport-repository.js";
import { ChainSyncService } from "./chain-sync-service.js";

describe("ChainSyncService", () => {
  it("reports disabled chain mode when contracts are not configured", async () => {
    const service = new ChainSyncService(
      new DisabledRitualChainClient(),
      new InMemoryPassportRepository()
    );

    const result = await service.syncPassport("0x1111111111111111111111111111111111111111");

    assert.equal(service.getStatus().configured, false);
    assert.equal(result.ok, false);
    assert.equal(result.statusCode, 503);
    assert.equal(result.body.error, "ChainNotConfigured");
  });

  it("upserts passport state from a configured chain client", async () => {
    const wallet = "0x2222222222222222222222222222222222222222";
    const repository = new InMemoryPassportRepository();
    const service = new ChainSyncService(new FakeChainClient(wallet), repository);

    const result = await service.syncPassport(wallet);
    const passport = await repository.findByWallet(wallet);

    assert.equal(result.ok, true);
    assert.equal(result.body.passport.wallet, wallet);
    assert.equal(result.body.passport.tokenId, 99);
    assert.equal(result.body.passport.classId, 3);
    assert.equal(result.body.passport.stage, 4);
    assert.equal(result.body.passport.xp, 12345);
    assert.equal(passport?.tokenId, 99);
  });
});

class FakeChainClient implements RitualChainClient {
  constructor(private readonly wallet: string) {}

  isConfigured() {
    return true;
  }

  async getPassportState(wallet: string) {
    if (wallet.toLowerCase() !== this.wallet.toLowerCase()) return null;

    return {
      wallet: this.wallet.toLowerCase(),
      tokenId: 99,
      classId: 3,
      stage: 4,
      xp: 12345
    };
  }
}

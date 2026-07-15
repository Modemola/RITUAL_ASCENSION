import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { keccak256, toBytes, zeroAddress } from "viem";

describe("ProgressManager", async function () {
  const { viem, networkHelpers } = await network.create();

  async function deployProgressManager() {
    const [deployer, operator, alice] = await viem.getWalletClients();
    const progress = await viem.deployContract("ProgressManager", [operator.account.address]);
    return { progress, deployer, operator, alice };
  }

  it("lets the operator award XP and accumulates across sources", async function () {
    const { progress, operator, alice } = await networkHelpers.loadFixture(deployProgressManager);
    const sourceA = keccak256(toBytes("quest-deploy-contract"));
    const sourceB = keccak256(toBytes("quest-llm-precompile"));

    await viem.assertions.emitWithArgs(
      progress.write.awardXP([alice.account.address, 500n, "Deployed first contract", sourceA], {
        account: operator.account
      }),
      progress,
      "XPAwarded",
      [alice.account.address, 500n, "Deployed first contract", sourceA]
    );

    assert.equal(await progress.read.totalXP([alice.account.address]), 500n);
    assert.equal(await progress.read.getXP([alice.account.address]), 500n);

    await progress.write.awardXP([alice.account.address, 750n, "Called LLM precompile", sourceB], {
      account: operator.account
    });
    assert.equal(await progress.read.getXP([alice.account.address]), 1250n);
  });

  it("blocks replaying the same source ref", async function () {
    const { progress, operator, alice } = await networkHelpers.loadFixture(deployProgressManager);
    const sourceRef = keccak256(toBytes("quest-deploy-contract"));

    await progress.write.awardXP([alice.account.address, 500n, "Deployed first contract", sourceRef], {
      account: operator.account
    });

    await viem.assertions.revertWith(
      progress.write.awardXP([alice.account.address, 500n, "Replayed award", sourceRef], {
        account: operator.account
      }),
      "XP already awarded for this source"
    );

    // XP should not have moved from the blocked replay
    assert.equal(await progress.read.getXP([alice.account.address]), 500n);
  });

  it("rejects awards to the zero address", async function () {
    const { progress, operator } = await networkHelpers.loadFixture(deployProgressManager);

    await viem.assertions.revertWith(
      progress.write.awardXP([zeroAddress, 100n, "invalid", keccak256(toBytes("x"))], {
        account: operator.account
      }),
      "Invalid wallet"
    );
  });

  it("blocks non-operators from awarding XP", async function () {
    const { progress, alice } = await networkHelpers.loadFixture(deployProgressManager);

    await viem.assertions.revertWithCustomError(
      progress.write.awardXP([alice.account.address, 100n, "not allowed", keccak256(toBytes("x"))], {
        account: alice.account
      }),
      progress,
      "AccessControlUnauthorizedAccount"
    );
  });
});

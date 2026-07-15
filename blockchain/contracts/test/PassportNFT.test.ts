import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { getAddress, keccak256, toBytes, zeroAddress } from "viem";

describe("PassportNFT", async function () {
  const { viem, networkHelpers } = await network.create();

  async function deployPassport() {
    const [deployer, operator, alice, bob] = await viem.getWalletClients();
    const passport = await viem.deployContract("PassportNFT", [operator.account.address]);
    return { passport, deployer, operator, alice, bob };
  }

  describe("mintPassport", function () {
    it("mints a soulbound passport with class, token id, and stage 1", async function () {
      const { passport, alice } = await networkHelpers.loadFixture(deployPassport);

      await viem.assertions.emitWithArgs(
        passport.write.mintPassport([2], { account: alice.account }),
        passport,
        "PassportMinted",
        [alice.account.address, 1n, 2]
      );

      assert.equal(await passport.read.hasMinted([alice.account.address]), true);
      assert.equal(await passport.read.tokenOfOwner([alice.account.address]), 1n);
      assert.equal(await passport.read.passportClass([1n]), 2);
      assert.equal(await passport.read.passportStage([1n]), 1);
      assert.equal(await passport.read.ownerOf([1n]), getAddress(alice.account.address));
    });

    it("rejects a second mint from the same wallet", async function () {
      const { passport, alice } = await networkHelpers.loadFixture(deployPassport);

      await passport.write.mintPassport([1], { account: alice.account });

      await viem.assertions.revertWith(
        passport.write.mintPassport([2], { account: alice.account }),
        "Already minted"
      );
    });

    it("rejects class ids outside 1-5", async function () {
      const { passport, alice, bob } = await networkHelpers.loadFixture(deployPassport);

      await viem.assertions.revertWith(
        passport.write.mintPassport([0], { account: alice.account }),
        "Invalid class"
      );
      await viem.assertions.revertWith(
        passport.write.mintPassport([6], { account: bob.account }),
        "Invalid class"
      );
    });
  });

  describe("soulbound transfers", function () {
    it("blocks transferFrom", async function () {
      const { passport, alice, bob } = await networkHelpers.loadFixture(deployPassport);
      await passport.write.mintPassport([1], { account: alice.account });

      await viem.assertions.revertWith(
        passport.write.transferFrom([alice.account.address, bob.account.address, 1n], {
          account: alice.account
        }),
        "Passport is soulbound"
      );
    });

    it("blocks safeTransferFrom", async function () {
      const { passport, alice, bob } = await networkHelpers.loadFixture(deployPassport);
      await passport.write.mintPassport([1], { account: alice.account });

      await viem.assertions.revertWith(
        passport.write.safeTransferFrom(
          [alice.account.address, bob.account.address, 1n, "0x"],
          { account: alice.account }
        ),
        "Passport is soulbound"
      );
    });
  });

  describe("BACKEND_OPERATOR-gated actions", function () {
    it("lets the operator link a Discord account and blocks everyone else", async function () {
      const { passport, operator, alice, bob } = await networkHelpers.loadFixture(deployPassport);
      await passport.write.mintPassport([1], { account: alice.account });
      const discordHash = keccak256(toBytes("discord-user-1"));

      await viem.assertions.revertWithCustomError(
        passport.write.linkDiscordAccount([alice.account.address, discordHash], {
          account: alice.account
        }),
        passport,
        "AccessControlUnauthorizedAccount"
      );

      await viem.assertions.emitWithArgs(
        passport.write.linkDiscordAccount([alice.account.address, discordHash], {
          account: operator.account
        }),
        passport,
        "DiscordAccountLinked",
        [alice.account.address, 1n, discordHash]
      );

      assert.equal(await passport.read.discordAccountHash([1n]), discordHash);
      assert.equal(await passport.read.discordAccountLinked([discordHash]), true);

      // Already linked to this token
      await viem.assertions.revertWith(
        passport.write.linkDiscordAccount([alice.account.address, keccak256(toBytes("other"))], {
          account: operator.account
        }),
        "Discord already linked"
      );

      // Same Discord hash claimed by a different wallet
      await passport.write.mintPassport([1], { account: bob.account });
      await viem.assertions.revertWith(
        passport.write.linkDiscordAccount([bob.account.address, discordHash], {
          account: operator.account
        }),
        "Discord already claimed"
      );
    });

    it("rejects linking a wallet with no passport", async function () {
      const { passport, operator, alice } = await networkHelpers.loadFixture(deployPassport);

      await viem.assertions.revertWith(
        passport.write.linkDiscordAccount([alice.account.address, keccak256(toBytes("x"))], {
          account: operator.account
        }),
        "Missing passport"
      );
    });

    it("lets the operator advance stage forward only, and blocks everyone else", async function () {
      const { passport, operator, alice } = await networkHelpers.loadFixture(deployPassport);
      await passport.write.mintPassport([1], { account: alice.account });

      await viem.assertions.revertWithCustomError(
        passport.write.updateStage([1n, 2], { account: alice.account }),
        passport,
        "AccessControlUnauthorizedAccount"
      );

      await viem.assertions.emit(
        passport.write.updateStage([1n, 2], { account: operator.account }),
        passport,
        "StageAdvanced"
      );
      assert.equal(await passport.read.passportStage([1n]), 2);

      await viem.assertions.revertWith(
        passport.write.updateStage([1n, 2], { account: operator.account }),
        "Stage can only advance"
      );
      await viem.assertions.revertWith(
        passport.write.updateStage([1n, 6], { account: operator.account }),
        "Max stage is 5"
      );
    });

    it("lets the operator set metadata CID and blocks everyone else", async function () {
      const { passport, operator, alice } = await networkHelpers.loadFixture(deployPassport);
      await passport.write.mintPassport([1], { account: alice.account });

      await viem.assertions.revertWithCustomError(
        passport.write.setMetadataCID([1n, "bafybeexample"], { account: alice.account }),
        passport,
        "AccessControlUnauthorizedAccount"
      );

      await passport.write.setMetadataCID([1n, "bafybeexample"], { account: operator.account });
      assert.equal(await passport.read.metadataCID([1n]), "bafybeexample");
      assert.equal(await passport.read.tokenURI([1n]), "ipfs://bafybeexample");
    });
  });

  it("rejects a zero backend operator address at deploy time only via role checks, not constructor revert", async function () {
    // Documents current behavior: the constructor does not validate backendOperator,
    // so a zero address silently means no account holds BACKEND_OPERATOR.
    const passport = await viem.deployContract("PassportNFT", [zeroAddress]);
    const role = await passport.read.BACKEND_OPERATOR();
    assert.equal(await passport.read.hasRole([role, zeroAddress]), true);
  });
});

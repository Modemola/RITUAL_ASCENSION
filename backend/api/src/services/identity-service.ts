import { createHash, randomBytes } from "node:crypto";
import { demoDiscordActivity, demoIdentityLink } from "@ritual/domain";
import type { PassportRepository } from "../repositories/passport-repository.js";
import type { DiscordLinkChallengeRepository } from "../repositories/discord-link-challenge-repository.js";
import type { IdentityLinkRepository } from "../repositories/identity-link-repository.js";
import { isWalletAddress, normalizeWallet } from "../validators.js";

interface ConnectDiscordInput {
  wallet?: string;
  challenge?: string;
  discordId?: string;
  username?: string;
  avatarUrl?: string;
}

export class IdentityService {
  constructor(
    private readonly identityLinks: IdentityLinkRepository,
    private readonly discordChallenges: DiscordLinkChallengeRepository,
    private readonly passports: PassportRepository
  ) {}

  async getIdentityLink(wallet?: string) {
    const normalizedWallet = normalizeWallet(wallet);
    return normalizedWallet ? this.identityLinks.findByWallet(normalizedWallet) : undefined;
  }

  hasLinkedWallet(wallet?: string) {
    return isWalletAddress(wallet);
  }

  async hasLinkedDiscord(wallet?: string, discordId?: string) {
    const identityLink = await this.getIdentityLink(wallet);
    return Boolean(identityLink && discordId === identityLink.discordId);
  }

  async hasDiscordId(discordId?: string) {
    return Boolean(discordId && await this.identityLinks.findByDiscordId(discordId));
  }

  async createDiscordLinkChallenge(wallet?: string) {
    const normalizedWallet = normalizeWallet(wallet);
    if (!normalizedWallet) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidWallet",
          message: "A valid passport wallet is required"
        }
      };
    }

    const passport = await this.passports.findByWallet(normalizedWallet);
    if (!passport) {
      return {
        ok: false as const,
        statusCode: 403,
        body: {
          error: "PassportRequired",
          message: "Mint a Soulbound Passport before linking Discord"
        }
      };
    }

    const challenge = `ritual-discord-${randomBytes(16).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.discordChallenges.create({
      wallet: normalizedWallet,
      challenge,
      expiresAt
    });

    return {
      ok: true as const,
      body: {
        wallet: normalizedWallet,
        challenge,
        expiresAt: expiresAt.toISOString()
      }
    };
  }

  async verifyDiscordLink(input: ConnectDiscordInput) {
    if (!this.hasLinkedWallet(input.wallet)) {
      return {
        ok: false as const,
        statusCode: 403,
        body: {
          error: "IdentityMismatch",
          message: "Discord can only be linked from the passport wallet"
        }
      };
    }

    const normalizedWallet = normalizeWallet(input.wallet);
    if (!normalizedWallet) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidWallet",
          message: "A valid passport wallet is required"
        }
      };
    }

    if (!input.discordId || !input.username || !input.challenge) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidDiscordLink",
          message: "Discord ID, username, and link challenge are required"
        }
      };
    }

    const challenge = await this.discordChallenges.consume(input.challenge, normalizedWallet);
    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      return {
        ok: false as const,
        statusCode: 401,
        body: {
          error: "InvalidDiscordChallenge",
          message: "Discord link challenge is invalid, expired, or already used"
        }
      };
    }

    const existingIdentity = await this.identityLinks.findByWallet(normalizedWallet);
    if (existingIdentity && input.discordId && input.discordId !== existingIdentity.discordId) {
      return {
        ok: false as const,
        statusCode: 409,
        body: {
          error: "DiscordAlreadyLinked",
          message: "This Soulbound Passport already has one Discord account linked"
        }
      };
    }

    if (
      input.discordId &&
      await this.isDiscordClaimedByAnotherWallet(input.discordId, normalizedWallet)
    ) {
      return {
        ok: false as const,
        statusCode: 409,
        body: {
          error: "DiscordAlreadyClaimed",
          message: "This Discord account is already linked to another passport wallet"
        }
      };
    }

    const passport = await this.passports.findByWallet(normalizedWallet);
    if (!passport) {
      return {
        ok: false as const,
        statusCode: 403,
        body: {
          error: "PassportRequired",
          message: "Mint a Soulbound Passport before linking Discord"
        }
      };
    }

    const identityLink = {
      wallet: normalizedWallet,
      passportTokenId: passport.tokenId,
      discordId: input.discordId,
      discordUsername: input.username,
      discordAvatarUrl: input.avatarUrl ?? demoIdentityLink.discordAvatarUrl,
      discordAccountHash: createDiscordAccountHash(input.discordId)
    };

    const savedIdentityLink = await this.identityLinks.save(identityLink);

    return {
      ok: true as const,
      body: {
        discord: {
          ...demoDiscordActivity,
          connectedWallet: savedIdentityLink.wallet,
          discordId: savedIdentityLink.discordId,
          username: savedIdentityLink.discordUsername,
          avatarUrl: savedIdentityLink.discordAvatarUrl,
          accountHash: savedIdentityLink.discordAccountHash
        }
      }
    };
  }

  async connectDiscord(input: ConnectDiscordInput) {
    const challenge = await this.createDiscordLinkChallenge(input.wallet);
    if (!challenge.ok) return challenge;

    return this.verifyDiscordLink({
      ...input,
      challenge: challenge.body.challenge
    });
  }

  private async isDiscordClaimedByAnotherWallet(discordId: string, normalizedWallet: string) {
    const existingIdentity = await this.identityLinks.findByDiscordId(discordId);
    return Boolean(existingIdentity && existingIdentity.wallet.toLowerCase() !== normalizedWallet);
  }
}

export function createDiscordAccountHash(discordId: string) {
  return `0x${createHash("sha256").update(discordId).digest("hex")}`;
}

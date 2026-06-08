import { randomBytes } from "node:crypto";
import { verifyMessage } from "ethers";
import type { AuthChallengeRepository } from "../repositories/auth-challenge-repository.js";
import { normalizeWallet } from "../validators.js";
import { TokenService } from "./token-service.js";

const noncePattern = /^Nonce: ([a-f0-9]+)$/m;

export class AuthService {
  constructor(
    private readonly challenges: AuthChallengeRepository,
    private readonly tokens: TokenService
  ) {}

  async createChallenge(wallet: string) {
    const normalizedWallet = normalizeWallet(wallet);
    if (!normalizedWallet) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidWallet",
          message: "A valid EVM wallet address is required"
        }
      };
    }

    const nonce = randomBytes(16).toString("hex");
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 10 * 60 * 1000);
    const message = createWalletAuthMessage(normalizedWallet, nonce, issuedAt);
    const challenge = await this.challenges.create({
      wallet: normalizedWallet,
      nonce,
      message,
      expiresAt
    });

    return {
      ok: true as const,
      body: {
        wallet: normalizedWallet,
        nonce: challenge.nonce,
        message,
        expiresAt: expiresAt.toISOString()
      }
    };
  }

  async verifyChallenge(input: { wallet?: string; message?: string; signature?: string }) {
    const normalizedWallet = normalizeWallet(input.wallet);
    if (!normalizedWallet || !input.message || !input.signature) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidAuthRequest",
          message: "Wallet, message, and signature are required"
        }
      };
    }

    const nonce = extractNonce(input.message);
    if (!nonce) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidAuthMessage",
          message: "Auth message is missing a valid nonce"
        }
      };
    }

    const challenge = await this.challenges.findByNonce(nonce);
    if (!challenge || challenge.wallet !== normalizedWallet) {
      return {
        ok: false as const,
        statusCode: 401,
        body: {
          error: "InvalidNonce",
          message: "Wallet auth challenge was not found"
        }
      };
    }

    if (challenge.consumedAt || challenge.expiresAt.getTime() < Date.now()) {
      return {
        ok: false as const,
        statusCode: 401,
        body: {
          error: "ExpiredNonce",
          message: "Wallet auth challenge is expired or already used"
        }
      };
    }

    let recoveredWallet: string;
    try {
      recoveredWallet = verifyMessage(input.message, input.signature).toLowerCase();
    } catch {
      return {
        ok: false as const,
        statusCode: 401,
        body: {
          error: "InvalidSignature",
          message: "Wallet signature could not be verified"
        }
      };
    }

    if (recoveredWallet !== normalizedWallet) {
      return {
        ok: false as const,
        statusCode: 401,
        body: {
          error: "WalletMismatch",
          message: "Signature does not belong to the requested wallet"
        }
      };
    }

    await this.challenges.consume(nonce);
    const token = this.tokens.sign(normalizedWallet);

    return {
      ok: true as const,
      body: {
        wallet: normalizedWallet,
        token,
        tokenType: "Bearer",
        expiresIn: 60 * 60 * 24
      }
    };
  }

  verifyToken(token: string) {
    return this.tokens.verify(token);
  }
}

export function createWalletAuthMessage(wallet: string, nonce: string, issuedAt: Date) {
  return [
    "Ritual Ascension wallet verification",
    "",
    "Sign this message to connect your wallet for this session.",
    "This does not approve a transaction or spend funds.",
    "",
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`
  ].join("\n");
}

function extractNonce(message: string) {
  return message.match(noncePattern)?.[1] ?? null;
}

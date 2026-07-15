import { verifyMessage } from "ethers";
import {
  calculateReputation,
  getBuilderClass,
  getLevelProgress
} from "@ritual/domain";
import type { BuilderClassId, PassportProfile } from "@ritual/domain";
import type { PassportRepository } from "../repositories/passport-repository.js";
import { normalizeWallet } from "../validators.js";

const MINT_SIGNATURE_TTL_MS = 10 * 60 * 1000;

interface MintPassportInput {
  wallet?: string;
  classId?: number;
  mintMessage?: string;
  mintSignature?: string;
}

export class PassportService {
  constructor(private readonly passports: PassportRepository) {}

  async getPassport(wallet?: string) {
    const normalizedWallet = normalizeWallet(wallet);
    if (!normalizedWallet) return null;

    const passport = await this.passports.findByWallet(normalizedWallet);
    return passport ? formatPassport(passport) : null;
  }

  async mintPassport(input: MintPassportInput) {
    const normalizedWallet = normalizeWallet(input.wallet);
    if (!normalizedWallet) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidWallet",
          message: "A valid wallet is required to mint a passport"
        }
      };
    }

    if (!isBuilderClassId(input.classId)) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidClass",
          message: "Builder class must be between 1 and 5"
        }
      };
    }

    if (!input.mintSignature || !input.mintMessage) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "MissingMintSignature",
          message: "A signed wallet mint message and signature are required"
        }
      };
    }

    const signatureError = verifyMintSignature(input.mintMessage, input.mintSignature, normalizedWallet, input.classId);
    if (signatureError) {
      return {
        ok: false as const,
        statusCode: 401,
        body: signatureError
      };
    }

    const existingPassport = await this.passports.findByWallet(normalizedWallet);
    if (existingPassport) {
      return {
        ok: false as const,
        statusCode: 409,
        body: {
          error: "PassportAlreadyMinted",
          message: "This wallet already has a Soulbound Passport",
          passport: formatPassport(existingPassport)
        }
      };
    }

    const passport = await this.passports.create({
      wallet: normalizedWallet,
      tokenId: createTokenId(normalizedWallet),
      classId: input.classId
    });

    return {
      ok: true as const,
      body: {
        passport: formatPassport(passport)
      }
    };
  }
}

export function formatPassport(passport: PassportProfile) {
  const progress = getLevelProgress(passport.xp);
  return {
    ...passport,
    class: getBuilderClass(passport.classId),
    reputation: calculateReputation(passport),
    level: progress.level,
    levelProgress: progress
  };
}

function verifyMintSignature(message: string, signature: string, wallet: string, classId?: number) {
  let recovered: string;
  try {
    recovered = verifyMessage(message, signature);
  } catch {
    return { error: "InvalidMintSignature", message: "Wallet mint signature could not be verified" };
  }

  if (recovered.toLowerCase() !== wallet) {
    return { error: "InvalidMintSignature", message: "Mint signature was not produced by this wallet" };
  }

  if (!message.toLowerCase().includes(`wallet: ${wallet}`)) {
    return { error: "InvalidMintSignature", message: "Signed message does not reference this wallet" };
  }

  const className = isBuilderClassId(classId) ? getBuilderClass(classId).name : undefined;
  if (className && !message.includes(`Class: ${className}`)) {
    return { error: "InvalidMintSignature", message: "Signed message does not match the requested builder class" };
  }

  const issuedAtMatch = message.match(/Issued At: (.+)$/m);
  const issuedAt = issuedAtMatch ? Date.parse(issuedAtMatch[1]) : NaN;
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > MINT_SIGNATURE_TTL_MS || issuedAt > Date.now()) {
    return { error: "ExpiredMintSignature", message: "Signed mint message has expired — try minting again" };
  }

  return null;
}

function isBuilderClassId(classId?: number): classId is BuilderClassId {
  if (!Number.isInteger(classId)) return false;
  const value = classId as number;
  return value >= 1 && value <= 5;
}

function createTokenId(normalizedWallet: string) {
  return Number.parseInt(normalizedWallet.slice(-12), 16);
}

import {
  calculateReputation,
  getBuilderClass,
  getLevelProgress
} from "@ritual/domain";
import type { BuilderClassId, PassportProfile } from "@ritual/domain";
import type { PassportRepository } from "../repositories/passport-repository.js";
import { normalizeWallet } from "../validators.js";

interface MintPassportInput {
  wallet?: string;
  classId?: number;
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

    if (!input.mintSignature) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "MissingMintSignature",
          message: "Wallet mint signature is required"
        }
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

function isBuilderClassId(classId?: number): classId is BuilderClassId {
  if (!Number.isInteger(classId)) return false;
  const value = classId as number;
  return value >= 1 && value <= 5;
}

function createTokenId(normalizedWallet: string) {
  return Number.parseInt(normalizedWallet.slice(-12), 16);
}

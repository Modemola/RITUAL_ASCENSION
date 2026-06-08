import type { BuilderClassId } from "@ritual/domain";
import type { RitualChainClient } from "../chain/ritual-chain-client.js";
import type { PassportRepository } from "../repositories/passport-repository.js";
import { normalizeWallet } from "../validators.js";
import { formatPassport } from "./passport-service.js";

export class ChainSyncService {
  constructor(
    private readonly chainClient: RitualChainClient,
    private readonly passports: PassportRepository
  ) {}

  getStatus() {
    return {
      configured: this.chainClient.isConfigured(),
      contracts: {
        passport: "PassportNFT",
        progress: "ProgressManager"
      }
    };
  }

  async syncPassport(wallet?: string) {
    const normalizedWallet = normalizeWallet(wallet);
    if (!normalizedWallet) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidWallet",
          message: "A valid wallet is required for chain sync"
        }
      };
    }

    if (!this.chainClient.isConfigured()) {
      return {
        ok: false as const,
        statusCode: 503,
        body: {
          error: "ChainNotConfigured",
          message: "Set RITUAL_RPC_URL, PASSPORT_NFT_ADDRESS, and PROGRESS_MANAGER_ADDRESS to enable chain sync"
        }
      };
    }

    const chainState = await this.chainClient.getPassportState(normalizedWallet);
    if (!chainState) {
      return {
        ok: false as const,
        statusCode: 404,
        body: {
          error: "ChainPassportNotFound",
          message: "No PassportNFT mint was found for this wallet on-chain"
        }
      };
    }

    const passport = await this.passports.upsert({
      wallet: chainState.wallet,
      tokenId: chainState.tokenId,
      classId: chainState.classId as BuilderClassId,
      stage: chainState.stage,
      xp: chainState.xp
    });

    return {
      ok: true as const,
      body: {
        chainState,
        passport: formatPassport(passport)
      }
    };
  }
}

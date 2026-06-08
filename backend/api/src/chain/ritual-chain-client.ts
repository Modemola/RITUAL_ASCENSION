import { Contract, JsonRpcProvider, isAddress } from "ethers";
import type { ChainConfig } from "../config.js";
import { passportNftAbi, progressManagerAbi } from "./abis.js";

export interface ChainPassportState {
  classId: number;
  stage: number;
  tokenId: number;
  wallet: string;
  xp: number;
}

export interface RitualChainClient {
  isConfigured(): boolean;
  getPassportState(wallet: string): Promise<ChainPassportState | null>;
}

export class DisabledRitualChainClient implements RitualChainClient {
  isConfigured() {
    return false;
  }

  async getPassportState() {
    return null;
  }
}

export class EthersRitualChainClient implements RitualChainClient {
  private readonly passport: Contract;
  private readonly progress: Contract;

  constructor(config: Required<ChainConfig>) {
    const provider = new JsonRpcProvider(config.rpcUrl);
    this.passport = new Contract(config.passportAddress, passportNftAbi, provider);
    this.progress = new Contract(config.progressAddress, progressManagerAbi, provider);
  }

  isConfigured() {
    return true;
  }

  async getPassportState(wallet: string): Promise<ChainPassportState | null> {
    const normalizedWallet = wallet.toLowerCase();
    const minted = await this.passport.hasMinted(normalizedWallet) as boolean;
    if (!minted) return null;

    const tokenId = Number(await this.passport.tokenOfOwner(normalizedWallet));
    const [classId, stage, xp] = await Promise.all([
      this.passport.passportClass(tokenId),
      this.passport.passportStage(tokenId),
      this.progress.getXP(normalizedWallet).catch(() => this.progress.totalXP(normalizedWallet))
    ]);

    return {
      wallet: normalizedWallet,
      tokenId,
      classId: Number(classId),
      stage: Number(stage),
      xp: Number(xp)
    };
  }
}

export function createRitualChainClient(config: ChainConfig): RitualChainClient {
  if (!config.rpcUrl || !config.passportAddress || !config.progressAddress) {
    return new DisabledRitualChainClient();
  }

  if (!isAddress(config.passportAddress) || !isAddress(config.progressAddress)) {
    return new DisabledRitualChainClient();
  }

  return new EthersRitualChainClient({
    passportAddress: config.passportAddress,
    progressAddress: config.progressAddress,
    rpcUrl: config.rpcUrl
  });
}

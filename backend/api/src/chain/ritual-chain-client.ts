import { Contract, JsonRpcProvider, NonceManager, Wallet, isAddress, keccak256, toUtf8Bytes } from "ethers";
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

  constructor(config: Required<Pick<ChainConfig, "passportAddress" | "progressAddress" | "rpcUrl">>) {
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

// ---------------------------------------------------------------------------
// Chain writer — settles XP, stage, and Discord-link events on-chain using
// the backend operator key. Off-chain state (Postgres/in-memory repos) is
// the source of truth for the user-facing response; the on-chain write is
// fired-and-forgotten from the caller's perspective so it never adds
// request latency, but every attempt and failure is logged.
// ---------------------------------------------------------------------------

export interface ChainWriteResult {
  txHash: string;
}

export interface RitualChainWriter {
  isConfigured(): boolean;
  awardXP(wallet: string, amount: number, reason: string, sourceRef: string): Promise<ChainWriteResult>;
  updateStage(tokenId: number, newStage: number): Promise<ChainWriteResult>;
  /** discordHash must already be the bytes32 hash stored off-chain (see identity-service's createDiscordAccountHash) — not re-derived here, so on-chain and off-chain hashes always match. */
  linkDiscordAccount(wallet: string, discordHash: string): Promise<ChainWriteResult>;
}

export class DisabledRitualChainWriter implements RitualChainWriter {
  isConfigured() {
    return false;
  }

  async awardXP(): Promise<ChainWriteResult> {
    throw new Error("On-chain writes are not configured");
  }

  async updateStage(): Promise<ChainWriteResult> {
    throw new Error("On-chain writes are not configured");
  }

  async linkDiscordAccount(): Promise<ChainWriteResult> {
    throw new Error("On-chain writes are not configured");
  }
}

export class EthersRitualChainWriter implements RitualChainWriter {
  private readonly passport: Contract;
  private readonly progress: Contract;

  constructor(config: { passportAddress: string; progressAddress: string; rpcUrl: string }, operatorPrivateKey: string) {
    const provider = new JsonRpcProvider(config.rpcUrl);
    // NonceManager tracks the nonce in-memory and increments it synchronously on
    // every send, so concurrent fire-and-forget writes from the same operator
    // wallet (e.g. awardXP + updateStage firing back-to-back) never collide on
    // the same pending nonce the way two independent Wallet sends can.
    const signer = new NonceManager(new Wallet(operatorPrivateKey, provider));
    this.passport = new Contract(config.passportAddress, passportNftAbi, signer);
    this.progress = new Contract(config.progressAddress, progressManagerAbi, signer);
  }

  isConfigured() {
    return true;
  }

  async awardXP(wallet: string, amount: number, reason: string, sourceRef: string): Promise<ChainWriteResult> {
    const tx = await this.progress.awardXP(wallet, BigInt(amount), reason, deriveSourceRef(sourceRef));
    const receipt = await tx.wait();
    return { txHash: receipt.hash as string };
  }

  async updateStage(tokenId: number, newStage: number): Promise<ChainWriteResult> {
    const tx = await this.passport.updateStage(BigInt(tokenId), newStage);
    const receipt = await tx.wait();
    return { txHash: receipt.hash as string };
  }

  async linkDiscordAccount(wallet: string, discordHash: string): Promise<ChainWriteResult> {
    const tx = await this.passport.linkDiscordAccount(wallet, discordHash);
    const receipt = await tx.wait();
    return { txHash: receipt.hash as string };
  }
}

/** Deterministically derives a bytes32 ref from an off-chain string id, for contract fields that expect bytes32. */
export function deriveSourceRef(value: string): string {
  return keccak256(toUtf8Bytes(value));
}

export function createRitualChainWriter(config: ChainConfig, operatorPrivateKey?: string): RitualChainWriter {
  if (!config.rpcUrl || !config.passportAddress || !config.progressAddress || !operatorPrivateKey) {
    return new DisabledRitualChainWriter();
  }

  if (!isAddress(config.passportAddress) || !isAddress(config.progressAddress)) {
    return new DisabledRitualChainWriter();
  }

  try {
    return new EthersRitualChainWriter(
      {
        passportAddress: config.passportAddress,
        progressAddress: config.progressAddress,
        rpcUrl: config.rpcUrl
      },
      operatorPrivateKey
    );
  } catch {
    return new DisabledRitualChainWriter();
  }
}

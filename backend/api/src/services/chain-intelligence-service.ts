import { Contract, JsonRpcProvider, isAddress } from "ethers";
import type { ContractEventName } from "ethers";
import type { ChainConfig } from "../config.js";
import { passportNftAbi, progressManagerAbi } from "../chain/abis.js";
import type { PassportService } from "./passport-service.js";
import { normalizeWallet } from "../validators.js";

interface ChainIntelligenceInput {
  wallet?: string;
}

export class ChainIntelligenceService {
  constructor(
    private readonly chain: ChainConfig = {},
    private readonly passport: PassportService
  ) {}

  async summarize(input: ChainIntelligenceInput = {}) {
    if (!this.isConfigured()) {
      return {
        ok: false as const,
        statusCode: 503,
        body: {
          error: "ChainIntelligenceNotConfigured",
          message: "Set RITUAL_RPC_URL, PASSPORT_NFT_ADDRESS, and PROGRESS_MANAGER_ADDRESS to enable Oracle chain intelligence"
        }
      };
    }

    const normalizedWallet = input.wallet ? normalizeWallet(input.wallet) : null;
    if (input.wallet && !normalizedWallet) {
      return {
        ok: false as const,
        statusCode: 400,
        body: {
          error: "InvalidWallet",
          message: "A valid wallet is required for wallet chain intelligence"
        }
      };
    }

    const provider = new JsonRpcProvider(this.chain.rpcUrl);
    const passportContract = new Contract(this.chain.passportAddress!, passportNftAbi, provider);
    const progressContract = new Contract(this.chain.progressAddress!, progressManagerAbi, provider);
    const latestBlock = await provider.getBlockNumber();
    const lookbackBlocks = Number(this.chain.indexerLookbackBlocks ?? 100_000);
    const fromBlock = Math.max(0, latestBlock - lookbackBlocks);

    const [walletState, eventSummary, localPassport] = await Promise.all([
      normalizedWallet
        ? readWalletState(normalizedWallet, passportContract, progressContract)
        : Promise.resolve(null),
      readEventSummary(passportContract, progressContract, fromBlock, latestBlock),
      normalizedWallet ? this.passport.getPassport(normalizedWallet) : Promise.resolve(null)
    ]);

    return {
      ok: true as const,
      body: {
        source: {
          id: "local-ritual-chain-intelligence",
          label: "Local Ritual chain intelligence",
          kind: "indexer",
          freshness: "live",
          summary: `Read Ritual RPC through block ${latestBlock} with a ${lookbackBlocks} block event lookback.`,
          data: {
            chain: {
              chainId: this.chain.chainId,
              latestBlock,
              rpcUrl: this.chain.rpcUrl,
              fromBlock,
              toBlock: latestBlock
            },
            contracts: {
              passportNft: this.chain.passportAddress,
              progressManager: this.chain.progressAddress
            },
            wallet: walletState,
            localPassport: localPassport
              ? {
                  wallet: localPassport.wallet,
                  tokenId: localPassport.tokenId,
                  classId: localPassport.classId,
                  stage: localPassport.stage,
                  xp: localPassport.xp,
                  completedQuestIds: localPassport.completedQuestIds
                }
              : null,
            events: eventSummary
          }
        }
      }
    };
  }

  private isConfigured() {
    return Boolean(
      this.chain.rpcUrl &&
        this.chain.passportAddress &&
        this.chain.progressAddress &&
        isAddress(this.chain.passportAddress) &&
        isAddress(this.chain.progressAddress)
    );
  }
}

async function readWalletState(
  wallet: string,
  passportContract: Contract,
  progressContract: Contract
) {
  const hasMinted = await passportContract.hasMinted(wallet) as boolean;
  if (!hasMinted) {
    return {
      wallet,
      hasMinted: false,
      passport: null,
      xp: 0
    };
  }

  const tokenId = Number(await passportContract.tokenOfOwner(wallet));
  const [classId, stage, xp] = await Promise.all([
    passportContract.passportClass(tokenId),
    passportContract.passportStage(tokenId),
    progressContract.getXP(wallet).catch(() => progressContract.totalXP(wallet))
  ]);

  return {
    wallet,
    hasMinted: true,
    passport: {
      tokenId,
      classId: Number(classId),
      stage: Number(stage)
    },
    xp: Number(xp)
  };
}

async function readEventSummary(
  passportContract: Contract,
  progressContract: Contract,
  fromBlock: number,
  toBlock: number
) {
  const [mints, stageAdvances, xpAwards] = await Promise.all([
    queryCount(passportContract, passportContract.filters.PassportMinted(), fromBlock, toBlock),
    queryCount(passportContract, passportContract.filters.StageAdvanced(), fromBlock, toBlock),
    queryCount(progressContract, progressContract.filters.XPAwarded(), fromBlock, toBlock)
  ]);

  return {
    lookback: { fromBlock, toBlock },
    passportMints: mints,
    stageAdvances,
    xpAwards
  };
}

async function queryCount(contract: Contract, filter: ContractEventName, fromBlock: number, toBlock: number) {
  try {
    const logs = await contract.queryFilter(filter, fromBlock, toBlock);
    return logs.length;
  } catch (error) {
    return {
      unavailable: true,
      reason: error instanceof Error ? error.message : "RPC log query failed"
    };
  }
}

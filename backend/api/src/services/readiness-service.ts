import { JsonRpcProvider, formatEther } from "ethers";
import type { ChainConfig } from "../config.js";
import type { PostgresPool } from "../db/postgres.js";

// Below this, the operator wallet still works but is close to unable to pay
// for on-chain XP/stage settlement — that failure mode is silent (fire-and-forget)
// otherwise, so this is the earliest visible warning before it runs dry.
const LOW_BALANCE_THRESHOLD_WEI = 5_000_000_000_000_000n; // 0.005 native token

export interface ReadinessReport {
  ok: boolean;
  checks: {
    api: "ok";
    database: "ok" | "not_configured" | "error";
    chain: "configured" | "not_configured";
    chainOperator: "ok" | "low_balance" | "not_configured" | "error";
  };
  details: {
    database?: string;
    chain?: string;
    chainOperator?: string;
  };
}

export class ReadinessService {
  constructor(
    private readonly pool: PostgresPool | null,
    private readonly chain: ChainConfig = {}
  ) {}

  async getReport(): Promise<ReadinessReport> {
    const database = await this.checkDatabase();
    const chainConfigured = Boolean(
      this.chain.rpcUrl && this.chain.passportAddress && this.chain.progressAddress
    );
    const chainOperator = await this.checkChainOperator();

    return {
      ok: database.status !== "error" && chainOperator.status !== "error",
      checks: {
        api: "ok",
        database: database.status,
        chain: chainConfigured ? "configured" : "not_configured",
        chainOperator: chainOperator.status
      },
      details: {
        database: database.message,
        chain: chainConfigured
          ? "Ritual chain RPC and contracts are configured"
          : "Chain sync is disabled until Ritual RPC and contract addresses are configured",
        chainOperator: chainOperator.message
      }
    };
  }

  private async checkDatabase() {
    if (!this.pool) {
      return {
        status: "not_configured" as const,
        message: "Using in-memory repositories"
      };
    }

    try {
      await this.pool.query("SELECT 1");
      return {
        status: "ok" as const,
        message: "Postgres connection is healthy"
      };
    } catch (error) {
      return {
        status: "error" as const,
        message: error instanceof Error ? error.message : "Postgres readiness check failed"
      };
    }
  }

  private async checkChainOperator() {
    if (!this.chain.rpcUrl || !this.chain.operatorAddress) {
      return {
        status: "not_configured" as const,
        message: "On-chain XP/stage settlement is disabled until BACKEND_OPERATOR_ADDRESS and RITUAL_RPC_URL are configured"
      };
    }

    try {
      const provider = new JsonRpcProvider(this.chain.rpcUrl);
      const balance = await provider.getBalance(this.chain.operatorAddress);

      if (balance < LOW_BALANCE_THRESHOLD_WEI) {
        return {
          status: "low_balance" as const,
          message: `Operator wallet balance is ${formatEther(balance)} — top it up soon or on-chain XP/stage writes will start failing silently`
        };
      }

      return {
        status: "ok" as const,
        message: `Operator wallet balance is ${formatEther(balance)}`
      };
    } catch (error) {
      return {
        status: "error" as const,
        message: error instanceof Error ? error.message : "Could not read operator wallet balance"
      };
    }
  }
}

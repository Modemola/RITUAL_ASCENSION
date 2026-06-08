import type { ChainConfig } from "../config.js";
import type { PostgresPool } from "../db/postgres.js";

export interface ReadinessReport {
  ok: boolean;
  checks: {
    api: "ok";
    database: "ok" | "not_configured" | "error";
    chain: "configured" | "not_configured";
  };
  details: {
    database?: string;
    chain?: string;
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

    return {
      ok: database.status !== "error",
      checks: {
        api: "ok",
        database: database.status,
        chain: chainConfigured ? "configured" : "not_configured"
      },
      details: {
        database: database.message,
        chain: chainConfigured
          ? "Ritual chain RPC and contracts are configured"
          : "Chain sync is disabled until Ritual RPC and contract addresses are configured"
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
}

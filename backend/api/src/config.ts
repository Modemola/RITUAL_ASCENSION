export interface ApiConfig {
  adminWallets: string[];
  allowedOrigins: string[];
  chain: ChainConfig;
  databaseUrl?: string;
  environment: string;
  jwtSecret: string;
  oracle: OracleConfig;
  port: number;
  verification: VerificationConfig;
}

export interface ChainConfig {
  passportAddress?: string;
  progressAddress?: string;
  rpcUrl?: string;
}

export interface OracleConfig {
  apiKey?: string;
  endpoint?: string;
  model: string;
  provider: "local" | "openai-compatible";
}

export interface VerificationConfig {
  discord?: {
    apiKey?: string;
    endpoint?: string;
  };
  testnet?: {
    apiKey?: string;
    endpoint?: string;
  };
}

export function getApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    adminWallets: parseAdminWallets(env.ADMIN_WALLETS),
    allowedOrigins: parseList(env.ALLOWED_ORIGINS, ["*"]),
    chain: {
      passportAddress: env.PASSPORT_NFT_ADDRESS,
      progressAddress: env.PROGRESS_MANAGER_ADDRESS,
      rpcUrl: env.RITUAL_RPC_URL
    },
    databaseUrl: env.DATABASE_URL,
    environment: env.NODE_ENV ?? "development",
    jwtSecret: env.JWT_SECRET ?? "ritual-ascension-local-dev-secret",
    oracle: {
      apiKey: env.ORACLE_API_KEY,
      endpoint: env.ORACLE_ENDPOINT,
      model: env.ORACLE_MODEL ?? "gpt-4.1-mini",
      provider: env.ORACLE_PROVIDER === "openai-compatible" ? "openai-compatible" : "local"
    },
    port: Number(env.PORT ?? 4000),
    verification: {
      discord: {
        apiKey: env.DISCORD_ACTIVITY_API_KEY,
        endpoint: env.DISCORD_ACTIVITY_ENDPOINT
      },
      testnet: {
        apiKey: env.RITUAL_TESTNET_INDEXER_API_KEY,
        endpoint: env.RITUAL_TESTNET_INDEXER_ENDPOINT
      }
    }
  };
}

function parseAdminWallets(value?: string) {
  return parseList(value).map((wallet) => wallet.toLowerCase());
}

export function validateApiConfig(config: ApiConfig) {
  const issues: string[] = [];

  if (!Number.isInteger(config.port) || config.port <= 0 || config.port > 65535) {
    issues.push("PORT must be a valid TCP port");
  }

  if (config.environment === "production" && config.jwtSecret === "ritual-ascension-local-dev-secret") {
    issues.push("JWT_SECRET must be set to a non-default value in production");
  }

  if (
    config.environment === "production" &&
    config.allowedOrigins.includes("*")
  ) {
    issues.push("ALLOWED_ORIGINS must be restricted in production");
  }

  if (config.oracle.provider === "openai-compatible" && !config.oracle.apiKey) {
    issues.push("ORACLE_API_KEY must be set when ORACLE_PROVIDER=openai-compatible");
  }

  if (config.oracle.provider === "openai-compatible" && !config.oracle.endpoint) {
    issues.push("ORACLE_ENDPOINT must be set when ORACLE_PROVIDER=openai-compatible");
  }

  if (issues.length) {
    throw new Error(`Invalid API configuration: ${issues.join("; ")}`);
  }
}

function parseList(value?: string, fallback: string[] = []) {
  return value
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : fallback;
}

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
  chainId?: string;
  indexerLookbackBlocks?: number;
  passportAddress?: string;
  progressAddress?: string;
  rpcUrl?: string;
}

export interface OracleConfig {
  apiKey?: string;
  endpoint?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  knowledge?: OracleKnowledgeConfig;
  model: string;
  openaiApiKey?: string;
  openaiModel?: string;
  provider: "local" | "openai-compatible" | "anthropic" | "gemini" | "openai" | "gemini-openai";
}

export interface OracleKnowledgeConfig {
  discord?: {
    apiKey?: string;
    endpoint?: string;
  };
  docs?: {
    apiKey?: string;
    endpoint?: string;
  };
  indexer?: {
    apiKey?: string;
    endpoint?: string;
  };
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
      chainId: env.RITUAL_CHAIN_ID,
      indexerLookbackBlocks: Number(env.RITUAL_INDEXER_LOOKBACK_BLOCKS ?? 100_000),
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
      geminiApiKey: env.GEMINI_API_KEY,
      geminiModel: env.GEMINI_MODEL ?? "gemini-2.0-flash",
      knowledge: {
        discord: {
          apiKey: env.ORACLE_DISCORD_API_KEY ?? env.DISCORD_ACTIVITY_API_KEY,
          endpoint: env.ORACLE_DISCORD_ENDPOINT
        },
        docs: {
          apiKey: env.ORACLE_DOCS_API_KEY,
          endpoint: env.ORACLE_DOCS_ENDPOINT
        },
        indexer: {
          apiKey: env.ORACLE_INDEXER_API_KEY ?? env.RITUAL_TESTNET_INDEXER_API_KEY,
          endpoint: env.ORACLE_INDEXER_ENDPOINT
        }
      },
      model: env.ORACLE_MODEL ?? "gemini-2.0-flash",
      openaiApiKey: env.OPENAI_API_KEY,
      openaiModel: env.OPENAI_MODEL ?? "gpt-4o-mini",
      provider: parseOracleProvider(env.ORACLE_PROVIDER)
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

function parseOracleProvider(value?: string): OracleConfig["provider"] {
  if (value === "gemini") return "gemini";
  if (value === "openai") return "openai";
  if (value === "gemini-openai") return "gemini-openai";
  if (value === "openai-compatible") return "openai-compatible";
  if (value === "anthropic") return "anthropic";
  return "local";
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

  if (config.oracle.provider === "anthropic" && !config.oracle.apiKey) {
    issues.push("ORACLE_API_KEY must be set when ORACLE_PROVIDER=anthropic");
  }

  if ((config.oracle.provider === "gemini" || config.oracle.provider === "gemini-openai") && !config.oracle.geminiApiKey) {
    issues.push("GEMINI_API_KEY must be set when ORACLE_PROVIDER=gemini or gemini-openai");
  }

  if (config.oracle.provider === "openai" && !config.oracle.openaiApiKey) {
    issues.push("OPENAI_API_KEY must be set when ORACLE_PROVIDER=openai");
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

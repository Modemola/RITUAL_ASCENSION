export interface ApiConfig {
  adminWallets: string[];
  allowedOrigins: string[];
  chain: ChainConfig;
  databaseUrl?: string;
  environment: string;
  jwtSecret: string;
  port: number;
}

export interface ChainConfig {
  passportAddress?: string;
  progressAddress?: string;
  rpcUrl?: string;
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
    port: Number(env.PORT ?? 4000)
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

  if (issues.length) {
    throw new Error(`Invalid API configuration: ${issues.join("; ")}`);
  }
}

function parseList(value?: string, fallback: string[] = []) {
  return value
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : fallback;
}

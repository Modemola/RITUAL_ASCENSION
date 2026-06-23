import { createApiServer } from "./app.js";
import { getApiConfig, validateApiConfig } from "./config.js";

try {
  process.loadEnvFile(new URL("../../../.env", import.meta.url));
} catch { /* .env not present, use process.env as-is */ }

const config = getApiConfig();
validateApiConfig(config);
const server = createApiServer({
  adminWallets: config.adminWallets,
  allowedOrigins: config.allowedOrigins,
  chain: config.chain,
  databaseUrl: config.databaseUrl,
  jwtSecret: config.jwtSecret,
  oracle: config.oracle,
  verification: config.verification
});

server.listen(config.port, () => {
  console.log(`Ritual Ascension API listening on http://localhost:${config.port}`);
});

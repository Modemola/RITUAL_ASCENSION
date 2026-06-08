import { createApiServer } from "./app.js";
import { getApiConfig, validateApiConfig } from "./config.js";

const config = getApiConfig();
validateApiConfig(config);
const server = createApiServer({
  adminWallets: config.adminWallets,
  allowedOrigins: config.allowedOrigins,
  chain: config.chain,
  databaseUrl: config.databaseUrl,
  jwtSecret: config.jwtSecret
});

server.listen(config.port, () => {
  console.log(`Ritual Ascension API listening on http://localhost:${config.port}`);
});

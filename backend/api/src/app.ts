import { createServer } from "node:http";
import type { ChainConfig, OracleConfig, VerificationConfig } from "./config.js";
import type { RitualChainClient } from "./chain/ritual-chain-client.js";
import { json, prepareRequest, serverError } from "./http.js";
import { handleApiRequest } from "./routes.js";
import { createBackendServices } from "./services/backend-services.js";

interface ApiServerOptions {
  adminWallets?: string[];
  allowedOrigins?: string[];
  chain?: ChainConfig;
  chainClient?: RitualChainClient;
  databaseUrl?: string;
  jwtSecret?: string;
  oracle?: OracleConfig;
  verification?: VerificationConfig;
}

export function createApiServer(options: ApiServerOptions = {}) {
  const services = createBackendServices(options);
  return createServer((request, response) => {
    const context = prepareRequest(request, response, {
      allowedOrigins: options.allowedOrigins
    });

    response.once("finish", () => {
      console.log(JSON.stringify({
        level: "info",
        event: "http_request",
        requestId: context.requestId,
        method: request.method,
        path: request.url,
        statusCode: response.statusCode,
        durationMs: Date.now() - context.startedAt
      }));
    });

    void handleApiRequest(request, response, services).catch((error: unknown) => {
      console.error(JSON.stringify({
        level: "error",
        event: "http_request_error",
        requestId: context.requestId,
        method: request.method,
        path: request.url,
        message: error instanceof Error ? error.message : "Unknown API error"
      }));

      if (!response.headersSent) {
        const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
        json(response, 500, serverError(url.pathname, context.requestId));
      } else {
        response.end();
      }
    });
  });
}

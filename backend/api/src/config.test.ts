import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getApiConfig, validateApiConfig } from "./config.js";

describe("API config", () => {
  it("parses comma-separated admin wallets and allowed origins", () => {
    const config = getApiConfig({
      ADMIN_WALLETS: "0xABC, 0xDEF",
      ALLOWED_ORIGINS: "https://ritual.example, http://localhost:3000",
      PORT: "4010",
      JWT_SECRET: "dev-secret"
    } as NodeJS.ProcessEnv);

    assert.deepEqual(config.adminWallets, ["0xabc", "0xdef"]);
    assert.deepEqual(config.allowedOrigins, ["https://ritual.example", "http://localhost:3000"]);
    assert.equal(config.port, 4010);
  });

  it("rejects unsafe production config", () => {
    const config = getApiConfig({
      NODE_ENV: "production",
      PORT: "4000"
    } as NodeJS.ProcessEnv);

    assert.throws(
      () => validateApiConfig(config),
      /JWT_SECRET must be set to a non-default value in production/
    );
  });
});

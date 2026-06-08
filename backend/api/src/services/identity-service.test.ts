import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDiscordAccountHash } from "./identity-service.js";

describe("IdentityService", () => {
  it("creates deterministic Discord account hashes", () => {
    const first = createDiscordAccountHash("ritual-user");
    const second = createDiscordAccountHash("ritual-user");
    const other = createDiscordAccountHash("other-user");

    assert.match(first, /^0x[a-f0-9]{64}$/);
    assert.equal(first, second);
    assert.notEqual(first, other);
  });
});

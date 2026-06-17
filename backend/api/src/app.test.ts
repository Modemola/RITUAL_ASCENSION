import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import type { HDNodeWallet } from "ethers";
import { Wallet } from "ethers";
import { createApiServer } from "./app.js";

let server: Server;
let baseUrl: string;
const adminWallet = Wallet.createRandom();

async function apiFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json();
  return { response, body };
}

async function authenticateWallet(wallet: HDNodeWallet) {
  const nonce = await apiFetch("/api/auth/nonce", {
    method: "POST",
    body: JSON.stringify({ wallet: wallet.address })
  });
  assert.equal(nonce.response.status, 200);

  const signature = await wallet.signMessage(nonce.body.message);
  const verified = await apiFetch("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify({
      wallet: wallet.address,
      message: nonce.body.message,
      signature
    })
  });
  assert.equal(verified.response.status, 200);
  assert.equal(verified.body.wallet, wallet.address.toLowerCase());
  assert.equal(verified.body.tokenType, "Bearer");
  return verified.body.token as string;
}

async function mintPassport(wallet: HDNodeWallet, token: string, classId = 2) {
  const mintSignature = await wallet.signMessage(`Mint Ritual Ascension passport class ${classId}`);
  return apiFetch("/api/passport/mint", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      wallet: wallet.address,
      classId,
      mintSignature
    })
  });
}

before(async () => {
  server = createApiServer({ adminWallets: [adminWallet.address] });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert(typeof address === "object" && address);
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

describe("Ritual Ascension API", () => {
  it("responds to health checks", async () => {
    const { response, body } = await apiFetch("/api/health", {
      headers: { "x-request-id": "test-request-id" }
    });

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.service, "ritual-ascension-api");
    assert.equal(body.requestId, "test-request-id");
    assert.equal(response.headers.get("x-request-id"), "test-request-id");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
  });

  it("reports readiness for deployment checks", async () => {
    const { response, body } = await apiFetch("/api/ready");

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.checks.api, "ok");
    assert.equal(body.checks.database, "not_configured");
    assert.equal(body.checks.chain, "not_configured");
  });

  it("applies configured CORS origins", async () => {
    const corsServer = createApiServer({ allowedOrigins: ["https://ritual.example"] });
    await new Promise<void>((resolve) => {
      corsServer.listen(0, "127.0.0.1", resolve);
    });
    const address = corsServer.address();
    assert(typeof address === "object" && address);
    const corsBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const allowed = await fetch(`${corsBaseUrl}/api/health`, {
        headers: { Origin: "https://ritual.example" }
      });
      assert.equal(allowed.headers.get("access-control-allow-origin"), "https://ritual.example");

      const blocked = await fetch(`${corsBaseUrl}/api/health`, {
        headers: { Origin: "https://evil.example" }
      });
      assert.equal(blocked.headers.get("access-control-allow-origin"), null);
    } finally {
      await new Promise<void>((resolve, reject) => {
        corsServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("reports chain integration status", async () => {
    const { response, body } = await apiFetch("/api/chain/status");

    assert.equal(response.status, 200);
    assert.equal(body.configured, false);
    assert.equal(body.contracts.passport, "PassportNFT");
    assert.equal(body.contracts.progress, "ProgressManager");
  });

  it("reports when local Oracle chain intelligence is not configured", async () => {
    const { response, body } = await apiFetch("/api/oracle/chain-intelligence");

    assert.equal(response.status, 503);
    assert.equal(body.error, "ChainIntelligenceNotConfigured");
  });

  it("issues wallet auth challenges and bearer tokens", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);

    assert.equal(typeof token, "string");
    assert(token.length > 40);
  });

  it("lists quest categories and filtered quests", async () => {
    const categories = await apiFetch("/api/quest-categories");
    const quests = await apiFetch("/api/quests?category=testers");

    assert.equal(categories.response.status, 200);
    assert.equal(categories.body.categories.length, 3);
    assert.equal(quests.response.status, 200);
    assert(quests.body.total > 0);
    assert(quests.body.quests.every((quest: { category: string }) => quest.category === "testers"));
  });

  it("returns 404 for an unminted passport", async () => {
    const wallet = Wallet.createRandom();
    const { response, body } = await apiFetch(`/api/passport/${wallet.address}`);

    assert.equal(response.status, 404);
    assert.equal(body.error, "PassportNotFound");
  });

  it("mints and loads one passport per authenticated wallet", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    const minted = await mintPassport(wallet, token, 4);

    assert.equal(minted.response.status, 201);
    assert.equal(minted.body.passport.wallet, wallet.address.toLowerCase());
    assert.equal(minted.body.passport.classId, 4);
    assert.equal(minted.body.passport.stage, 1);
    assert.equal(minted.body.passport.xp, 0);

    const loaded = await apiFetch(`/api/passport/${wallet.address}`);
    assert.equal(loaded.response.status, 200);
    assert.equal(loaded.body.passport.tokenId, minted.body.passport.tokenId);

    const duplicate = await mintPassport(wallet, token, 4);
    assert.equal(duplicate.response.status, 409);
    assert.equal(duplicate.body.error, "PassportAlreadyMinted");
  });

  it("verifies a linked testnet activity quest", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    await mintPassport(wallet, token);
    const started = await apiFetch("/api/quests/tester-contract-explorer/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ wallet: wallet.address })
    });
    assert.equal(started.response.status, 200);
    assert.equal(started.body.attempt.status, "started");

    const { response, body } = await apiFetch("/api/quests/tester-contract-explorer/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ wallet: wallet.address, proof: "demo" })
    });

    assert.equal(response.status, 200);
    assert.equal(body.questId, "tester-contract-explorer");
    assert.equal(body.verification.ok, true);
    assert.equal(body.verification.source, "demo-ritual-testnet-indexer");
    assert.equal(body.attempt.status, "completed");

    const duplicate = await apiFetch("/api/quests/tester-contract-explorer/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ wallet: wallet.address, proof: "demo again" })
    });
    assert.equal(duplicate.response.status, 409);
    assert.equal(duplicate.body.error, "QuestAlreadyCompleted");
  });

  it("awards XP, achievements, and evolution on quest completion", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    await mintPassport(wallet, token, 1);

    const { response, body } = await apiFetch("/api/quests/deploy-contract/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet: wallet.address,
        proof: "0x1234567890abcdef"
      })
    });

    assert.equal(response.status, 200);
    assert.equal(body.attempt.status, "completed");
    assert.equal(body.progression.passport.xp, 500);
    assert.equal(body.progression.passport.stage, 2);
    assert.deepEqual(body.progression.passport.completedQuestIds, ["deploy-contract"]);
    assert(body.progression.unlockedAchievements.some((achievement: { id: string }) => achievement.id === "ACH_001"));
    assert.equal(body.progression.evolutionEvents[0].fromStage, 1);
    assert.equal(body.progression.evolutionEvents[0].toStage, 2);

    const loaded = await apiFetch(`/api/passport/${wallet.address}`);
    assert.equal(loaded.response.status, 200);
    assert.equal(loaded.body.passport.xp, 500);
    assert.equal(loaded.body.passport.stage, 2);
    assert(loaded.body.passport.completedQuestIds.includes("deploy-contract"));
    assert(loaded.body.passport.achievements.some((achievement: { id: string; unlocked: boolean }) =>
      achievement.id === "ACH_001" && achievement.unlocked
    ));

    const duplicate = await apiFetch("/api/quests/deploy-contract/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet: wallet.address,
        proof: "0x1234567890abcdef"
      })
    });
    assert.equal(duplicate.response.status, 409);

    const loadedAfterDuplicate = await apiFetch(`/api/passport/${wallet.address}`);
    assert.equal(loadedAfterDuplicate.body.passport.xp, 500);
    assert.deepEqual(loadedAfterDuplicate.body.passport.completedQuestIds, ["deploy-contract"]);
  });

  it("serves authenticated activity feed and notifications from progression events", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    await mintPassport(wallet, token, 1);

    await apiFetch("/api/quests/deploy-contract/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet: wallet.address,
        proof: "0x1234567890abcdef"
      })
    });

    const activity = await apiFetch(`/api/activity?wallet=${wallet.address}&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(activity.response.status, 200);
    assert.equal(activity.body.wallet, wallet.address.toLowerCase());
    assert(activity.body.activity.some((item: { type: string; title: string }) =>
      item.type === "xp_awarded" && item.title === "Deploy Your First Ritual Contract"
    ));
    assert(activity.body.activity.some((item: { type: string; title: string }) =>
      item.type === "achievement_unlocked" && item.title === "First Blood"
    ));
    assert(activity.body.activity.some((item: { type: string; title: string }) =>
      item.type === "passport_evolved" && item.title === "Stage 2 reached"
    ));

    const notifications = await apiFetch(`/api/notifications?wallet=${wallet.address}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(notifications.response.status, 200);
    assert.equal(notifications.body.unread, notifications.body.notifications.length);
    assert(notifications.body.notifications.every((item: { read: boolean }) => item.read === false));

    const unauthenticated = await apiFetch(`/api/activity?wallet=${wallet.address}`);
    assert.equal(unauthenticated.response.status, 401);
    assert.equal(unauthenticated.body.error, "Unauthorized");
  });

  it("submits manual-review quest proof without completing it", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    await mintPassport(wallet, token);
    const submitted = await apiFetch("/api/quests/builder-integration-guide/submit", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet: wallet.address,
        proof: "https://example.com/guide"
      })
    });

    assert.equal(submitted.response.status, 200);
    assert.equal(submitted.body.attempt.status, "submitted");
    assert.equal(submitted.body.attempt.proof, "https://example.com/guide");
    assert.equal(submitted.body.review.status, "pending");

    const questList = await apiFetch(`/api/quests?wallet=${wallet.address}&category=builders`);
    assert.equal(questList.response.status, 200);
    assert(questList.body.attempts.some((attempt: { questId: string; status: string }) =>
      attempt.questId === "builder-integration-guide" && attempt.status === "submitted"
    ));
  });

  it("lets admin reviewers approve submitted proofs and trigger progression", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    await mintPassport(wallet, token, 1);

    const submitted = await apiFetch("/api/quests/builder-integration-guide/submit", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet: wallet.address,
        proof: "https://example.com/guide"
      })
    });
    assert.equal(submitted.response.status, 200);
    assert.equal(submitted.body.review.status, "pending");

    const nonAdminQueue = await apiFetch("/api/admin/reviews", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(nonAdminQueue.response.status, 403);
    assert.equal(nonAdminQueue.body.error, "AdminRequired");

    const adminToken = await authenticateWallet(adminWallet);
    const queue = await apiFetch("/api/admin/reviews?limit=25", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(queue.response.status, 200);
    const queuedReview = queue.body.reviews.find(
      (item: { review: { id: string }; attempt: { id: string } }) =>
        item.attempt.id === submitted.body.attempt.id
    );
    assert(queuedReview);

    const decision = await apiFetch(`/api/admin/reviews/${queuedReview.review.id}/decision`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: "approved",
        notes: "Guide is complete and useful."
      })
    });
    assert.equal(decision.response.status, 200);
    assert.equal(decision.body.review.status, "approved");
    assert.equal(decision.body.attempt.status, "completed");
    assert.equal(decision.body.progression.passport.xp, 800);

    const loaded = await apiFetch(`/api/passport/${wallet.address}`);
    assert.equal(loaded.body.passport.xp, 800);
    assert(loaded.body.passport.completedQuestIds.includes("builder-integration-guide"));

    const duplicateDecision = await apiFetch(`/api/admin/reviews/${queuedReview.review.id}/decision`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: "approved"
      })
    });
    assert.equal(duplicateDecision.response.status, 409);
    assert.equal(duplicateDecision.body.error, "ReviewAlreadyDecided");
  });

  it("keeps Discord links one-to-one", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    await mintPassport(wallet, token);
    const challenge = await apiFetch("/api/discord/link-challenge", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ wallet: wallet.address })
    });
    assert.equal(challenge.response.status, 200);

    const { response, body } = await apiFetch("/api/discord/link-verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet: wallet.address,
        challenge: challenge.body.challenge,
        discordId: "ritual-demo-user",
        username: "duplicate"
      })
    });

    assert.equal(response.status, 409);
    assert.equal(body.error, "DiscordAlreadyClaimed");
  });

  it("links Discord through a one-time challenge and returns an account hash", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    await mintPassport(wallet, token);

    const challenge = await apiFetch("/api/discord/link-challenge", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ wallet: wallet.address })
    });
    assert.equal(challenge.response.status, 200);
    assert(challenge.body.challenge.startsWith("ritual-discord-"));

    const linked = await apiFetch("/api/discord/link-verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet: wallet.address,
        challenge: challenge.body.challenge,
        discordId: "ritual-new-user",
        username: "new_builder"
      })
    });
    assert.equal(linked.response.status, 200);
    assert.equal(linked.body.discord.discordId, "ritual-new-user");
    assert.match(linked.body.discord.accountHash, /^0x[a-f0-9]{64}$/);

    const reused = await apiFetch("/api/discord/link-verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet: wallet.address,
        challenge: challenge.body.challenge,
        discordId: "ritual-new-user",
        username: "new_builder"
      })
    });
    assert.equal(reused.response.status, 401);
    assert.equal(reused.body.error, "InvalidDiscordChallenge");
  });

  it("rejects protected quest verification without a wallet token", async () => {
    const { response, body } = await apiFetch("/api/quests/tester-contract-explorer/verify", {
      method: "POST",
      body: JSON.stringify({
        wallet: "0x3333333333333333333333333333333333333333",
        proof: "demo"
      })
    });

    assert.equal(response.status, 401);
    assert.equal(body.error, "Unauthorized");
  });

  it("rejects progression actions before passport mint", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    const { response, body } = await apiFetch("/api/quests/tester-contract-explorer/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet: wallet.address,
        proof: "demo"
      })
    });

    assert.equal(response.status, 403);
    assert.equal(body.error, "PassportRequired");
  });

  it("rejects a wallet token used for a different wallet", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    const { response, body } = await apiFetch("/api/quests/tester-contract-explorer/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet: "0x4444444444444444444444444444444444444444",
        proof: "demo"
      })
    });

    assert.equal(response.status, 403);
    assert.equal(body.error, "WalletMismatch");
  });

  it("requires wallet auth for Oracle chat", async () => {
    const { response, body } = await apiFetch("/api/oracle/chat", {
      method: "POST",
      body: JSON.stringify({
        wallet: "0x5555555555555555555555555555555555555555",
        message: "What next?"
      })
    });

    assert.equal(response.status, 401);
    assert.equal(body.error, "Unauthorized");
  });

  it("returns a context-aware local Oracle recommendation", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    await mintPassport(wallet, token, 2);

    const { response, body } = await apiFetch("/api/oracle/chat", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet: wallet.address,
        message: "What should I do next as an agent builder?"
      })
    });

    assert.equal(response.status, 200);
    assert.equal(body.source, "local");
    assert.equal(typeof body.message, "string");
    assert.equal(body.recommendedQuest.id, "llm-precompile");
    assert.equal(typeof body.learningOutcome, "string");
    assert.equal(typeof body.nextMilestone, "string");
    assert(body.sources.some((source: { id: string }) => source.id === "ritual-basics"));
    assert(body.sources.some((source: { id: string }) => source.id === "demo-discord-intelligence"));
    assert(body.sourceNotes.some((note: string) => note.includes("Discord intelligence endpoint is not configured")));
  });

  it("returns a clear error when chain sync is not configured", async () => {
    const wallet = Wallet.createRandom();
    const token = await authenticateWallet(wallet);
    const { response, body } = await apiFetch("/api/passport/sync-chain", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ wallet: wallet.address })
    });

    assert.equal(response.status, 503);
    assert.equal(body.error, "ChainNotConfigured");
  });
});

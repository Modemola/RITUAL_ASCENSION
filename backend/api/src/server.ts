import { createServer } from "node:http";
import {
  achievements,
  builderClasses,
  calculateReputation,
  demoDiscordActivity,
  demoIdentityLink,
  demoPassport,
  demoTestnetActivity,
  evolutionStages,
  verifiedRitualProducts,
  getBuilderClass,
  getQuest,
  getLevelProgress,
  builderLeaderboard,
  questCategories,
  quests
} from "@ritual/domain";

const port = Number(process.env.PORT ?? 4000);
const walletPattern = /^0x[a-fA-F0-9]{40}$/;
const identityLinksByWallet = new Map<string, typeof demoIdentityLink>([
  [demoIdentityLink.wallet.toLowerCase(), demoIdentityLink]
]);
const walletByDiscordId = new Map<string, string>([
  [demoIdentityLink.discordId, demoIdentityLink.wallet.toLowerCase()]
]);

function json(response: import("node:http").ServerResponse, statusCode: number, body: unknown) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(body, null, 2));
}

function notFound(path: string) {
  return {
    statusCode: 404,
    error: "NotFound",
    message: "Route not found",
    timestamp: new Date().toISOString(),
    path
  };
}

async function readBody(request: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function normalizeWallet(wallet?: string) {
  return typeof wallet === "string" && walletPattern.test(wallet) ? wallet.toLowerCase() : null;
}

function getIdentityLink(wallet?: string) {
  const normalizedWallet = normalizeWallet(wallet);
  return normalizedWallet ? identityLinksByWallet.get(normalizedWallet) : undefined;
}

function isLinkedWallet(wallet?: string) {
  return normalizeWallet(wallet) !== null;
}

function isLinkedDiscord(wallet?: string, discordId?: string) {
  const identityLink = getIdentityLink(wallet);
  return Boolean(identityLink && discordId === identityLink.discordId);
}

function verifyQuest(questId: string, wallet?: string, discordId?: string) {
  const quest = getQuest(questId);
  if (!quest) {
    return { ok: false, reason: "Quest not found" };
  }

  if (quest.category === "testers") {
    if (!isLinkedWallet(wallet)) {
      return {
        ok: false,
        reason: "Verification only checks the wallet linked to this Soulbound Passport"
      };
    }

    const value = quest.metric ? Number(demoTestnetActivity[quest.metric as keyof typeof demoTestnetActivity] ?? 0) : 0;
    const required = quest.target ?? 0;

    return {
      ok: value >= required,
      reason:
        value >= required
          ? "Ritual testnet activity threshold met"
          : `Ritual testnet activity is ${value}; ${required} required`,
      source: "ritual-testnet-indexer",
      value,
      required,
      capped: quest.limit === 1
    };
  }

  if (quest.category === "discord") {
    if (!isLinkedWallet(wallet)) {
      return {
        ok: false,
        reason: "Connect the passport wallet before Discord verification"
      };
    }

    if (!isLinkedDiscord(wallet, discordId)) {
      return {
        ok: false,
        reason: "Verification only checks the Discord account linked to this Soulbound Passport"
      };
    }

    if (quest.verification === "DISCORD_ROLE") {
      const hasRole = quest.roleName ? demoDiscordActivity.roles.includes(quest.roleName) : false;
      return {
        ok: hasRole,
        reason: hasRole ? `${quest.roleName} role found in Ritual Discord` : `${quest.roleName} role not found`,
        source: "ritual-discord-bot",
        roles: demoDiscordActivity.roles,
        requiredRole: quest.roleName
      };
    }

    const required = quest.target ?? 0;
    return {
      ok: demoDiscordActivity.messages >= required,
      reason:
        demoDiscordActivity.messages >= required
          ? "Ritual Discord message threshold met"
          : `Discord messages are ${demoDiscordActivity.messages}; ${required} required`,
      source: "ritual-discord-bot",
      value: demoDiscordActivity.messages,
      required
    };
  }

  if (!isLinkedWallet(wallet)) {
    return {
      ok: false,
      reason: "Builder quest verification only accepts proof from the linked passport wallet"
    };
  }

  return {
    ok: true,
    reason: "Builder quest proof accepted for review",
    source: quest.verification
  };
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    json(response, 204, {});
    return;
  }

  if (url.pathname === "/api/health") {
    json(response, 200, { ok: true, service: "ritual-ascension-api" });
    return;
  }

  if (url.pathname === "/api/classes") {
    json(response, 200, { classes: builderClasses });
    return;
  }

  if (url.pathname === "/api/quest-categories") {
    json(response, 200, { categories: questCategories });
    return;
  }

  if (url.pathname === "/api/quests") {
    const classFilter = Number(url.searchParams.get("class"));
    const categoryFilter = url.searchParams.get("category");
    const classFiltered = Number.isNaN(classFilter)
      ? quests
      : quests.filter((quest) => !quest.classId || quest.classId === classFilter);
    const filtered = categoryFilter
      ? classFiltered.filter((quest) => quest.category === categoryFilter)
      : classFiltered;
    json(response, 200, { quests: filtered, total: filtered.length });
    return;
  }

  const questMatch = url.pathname.match(/^\/api\/quests\/([^/]+)$/);
  if (questMatch && request.method === "GET") {
    const quest = getQuest(questMatch[1]);
    if (!quest) {
      json(response, 404, notFound(url.pathname));
      return;
    }

    json(response, 200, { quest });
    return;
  }

  if (url.pathname === "/api/testnet/activity") {
    const wallet = url.searchParams.get("wallet") ?? demoTestnetActivity.wallet;
    if (!isLinkedWallet(wallet)) {
      json(response, 403, {
        error: "IdentityMismatch",
        message: "Only the wallet linked to the Soulbound Passport can be checked"
      });
      return;
    }

    json(response, 200, {
      activity: {
        ...demoTestnetActivity,
        wallet,
        network: "ritual-testnet"
      }
    });
    return;
  }

  if (url.pathname === "/api/discord/activity") {
    const discordId = url.searchParams.get("discordId") ?? demoDiscordActivity.discordId;
    if (discordId && !Array.from(identityLinksByWallet.values()).some((link) => link.discordId === discordId)) {
      json(response, 403, {
        error: "IdentityMismatch",
        message: "Only the Discord account linked to the Soulbound Passport can be checked"
      });
      return;
    }

    json(response, 200, {
      activity: {
        ...demoDiscordActivity,
        discordId
      }
    });
    return;
  }

  if (url.pathname === "/api/discord/connect" && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string; discordId?: string; username?: string };
    if (!isLinkedWallet(body.wallet)) {
      json(response, 403, {
        error: "IdentityMismatch",
        message: "Discord can only be linked from the passport wallet"
      });
      return;
    }

    const normalizedWallet = normalizeWallet(body.wallet);
    if (!normalizedWallet) {
      json(response, 400, {
        error: "InvalidWallet",
        message: "A valid passport wallet is required"
      });
      return;
    }

    const existingIdentity = identityLinksByWallet.get(normalizedWallet);
    if (existingIdentity && body.discordId && body.discordId !== existingIdentity.discordId) {
      json(response, 409, {
        error: "DiscordAlreadyLinked",
        message: "This Soulbound Passport already has one Discord account linked"
      });
      return;
    }

    if (body.discordId && walletByDiscordId.has(body.discordId) && walletByDiscordId.get(body.discordId) !== normalizedWallet) {
      json(response, 409, {
        error: "DiscordAlreadyClaimed",
        message: "This Discord account is already linked to another passport wallet"
      });
      return;
    }

    const identityLink = existingIdentity ?? {
      wallet: body.wallet ?? normalizedWallet,
      passportTokenId: demoPassport.tokenId,
      discordId: body.discordId || demoIdentityLink.discordId,
      discordUsername: body.username || demoIdentityLink.discordUsername,
      discordAvatarUrl: demoIdentityLink.discordAvatarUrl
    };
    identityLinksByWallet.set(normalizedWallet, identityLink);
    walletByDiscordId.set(identityLink.discordId, normalizedWallet);

    json(response, 200, {
      discord: {
        ...demoDiscordActivity,
        connectedWallet: identityLink.wallet,
        discordId: identityLink.discordId,
        username: identityLink.discordUsername,
        avatarUrl: identityLink.discordAvatarUrl
      }
    });
    return;
  }

  const verifyMatch = url.pathname.match(/^\/api\/quests\/([^/]+)\/verify$/);
  if (verifyMatch && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string; discordId?: string; proof?: string };
    const result = verifyQuest(verifyMatch[1], body.wallet, body.discordId);
    json(response, result.ok ? 200 : 422, {
      questId: verifyMatch[1],
      proof: body.proof,
      verification: result
    });
    return;
  }

  if (url.pathname === "/api/leaderboard") {
    json(response, 200, {
      scope: "builder_tasks_only",
      builders: builderLeaderboard
    });
    return;
  }

  if (url.pathname === "/api/products/verified") {
    json(response, 200, {
      products: verifiedRitualProducts,
      total: verifiedRitualProducts.length
    });
    return;
  }

  const passportMatch = url.pathname.match(/^\/api\/passport\/([^/]+)$/);
  if (passportMatch) {
    const progress = getLevelProgress(demoPassport.xp);
    json(response, 200, {
      passport: {
        ...demoPassport,
        wallet: passportMatch[1],
        class: getBuilderClass(demoPassport.classId),
        reputation: calculateReputation(demoPassport),
        level: progress.level,
        levelProgress: progress
      }
    });
    return;
  }

  const profileMatch = url.pathname.match(/^\/api\/profile\/([^/]+)$/);
  if (profileMatch) {
    const profileIdentityLink = getIdentityLink(profileMatch[1]);
    json(response, 200, {
      profile: {
        wallet: profileMatch[1],
        passport: demoPassport,
        class: getBuilderClass(demoPassport.classId),
        reputation: calculateReputation(demoPassport),
        achievements: achievements.filter((achievement) => achievement.unlocked),
        completedQuests: quests.filter((quest) => demoPassport.completedQuestIds.includes(quest.id)),
        testnetActivity: demoTestnetActivity,
        discordActivity: demoDiscordActivity,
        identityLink: profileIdentityLink ?? null
      }
    });
    return;
  }

  if (url.pathname === "/api/passport/evolution") {
    json(response, 200, {
      currentStage: demoPassport.stage,
      stages: evolutionStages.map((stage) => ({
        ...stage,
        complete: stage.id <= demoPassport.stage
      }))
    });
    return;
  }

  if (url.pathname === "/api/oracle/chat" && request.method === "POST") {
    json(response, 200, {
      conversationId: "demo-conversation",
      message: "Your next highest-leverage move is to finish the LLM precompile quest. It advances your passport toward the Builder stage and teaches the Ritual AI primitive directly.",
      recommendedQuest: {
        id: "llm-precompile",
        title: "Call the Ritual LLM Precompile",
        reason: "It is already in progress and unlocks the next evolution trigger."
      },
      learningOutcome: "You will learn how Ritual exposes AI execution through on-chain infrastructure.",
      nextMilestone: "Confirm the transaction and push your passport into Stage 3.",
      rateLimitRemaining: 19
    });
    return;
  }

  json(response, 404, notFound(url.pathname));
});

server.listen(port, () => {
  console.log(`Ritual Ascension API listening on http://localhost:${port}`);
});

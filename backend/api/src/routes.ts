import {
  builderClasses,
  builderLeaderboard,
  calculateReputation,
  demoDiscordActivity,
  demoTestnetActivity,
  evolutionStages,
  getBuilderClass,
  getQuest,
  questCategories,
  quests,
  verifiedRitualProducts
} from "@ritual/domain";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getRequestContext, json, notFound, readBody } from "./http.js";
import type { BackendServices } from "./services/backend-services.js";
import { normalizeWallet } from "./validators.js";

export async function handleApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
  services: BackendServices
) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    json(response, 204, {});
    return;
  }

  if (url.pathname === "/api/health") {
    json(response, 200, {
      ok: true,
      service: "ritual-ascension-api",
      requestId: getRequestContext(response)?.requestId
    });
    return;
  }

  if (url.pathname === "/api/ready") {
    const report = await services.readiness.getReport();
    json(response, report.ok ? 200 : 503, report);
    return;
  }

  if (url.pathname === "/api/chain/status") {
    json(response, 200, services.chainSync.getStatus());
    return;
  }

  if (url.pathname === "/api/auth/nonce" && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string };
    const result = await services.auth.createChallenge(body.wallet ?? "");
    json(response, result.ok ? 200 : result.statusCode, result.body);
    return;
  }

  if (url.pathname === "/api/auth/verify" && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string; message?: string; signature?: string };
    const result = await services.auth.verifyChallenge(body);
    json(response, result.ok ? 200 : result.statusCode, result.body);
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
    const wallet = url.searchParams.get("wallet");
    const attempts = await services.quests.listAttempts(wallet ?? undefined);
    const attemptsByQuestId = new Map(attempts.map((attempt) => [attempt.questId, attempt]));
    const classFiltered = Number.isNaN(classFilter)
      ? quests
      : quests.filter((quest) => !quest.classId || quest.classId === classFilter);
    const filtered = categoryFilter
      ? classFiltered.filter((quest) => quest.category === categoryFilter)
      : classFiltered;
    json(response, 200, {
      quests: filtered.map((quest) => ({
        ...quest,
        attempt: attemptsByQuestId.get(quest.id) ?? null,
        status: attemptsByQuestId.get(quest.id)?.status ?? quest.status
      })),
      attempts,
      total: filtered.length
    });
    return;
  }

  const questMatch = url.pathname.match(/^\/api\/quests\/([^/]+)$/);
  if (questMatch && request.method === "GET") {
    const quest = getQuest(questMatch[1]);
    if (!quest) {
      json(response, 404, notFound(url.pathname, getRequestContext(response)?.requestId));
      return;
    }

    json(response, 200, { quest });
    return;
  }

  const startQuestMatch = url.pathname.match(/^\/api\/quests\/([^/]+)\/start$/);
  if (startQuestMatch && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string };
    const authorization = await authorizePassportWallet(request, services, body.wallet);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const result = await services.quests.startQuest({
      wallet: authorization.wallet,
      questId: startQuestMatch[1]
    });
    json(response, result.ok ? 200 : result.statusCode, result.body);
    return;
  }

  const submitQuestMatch = url.pathname.match(/^\/api\/quests\/([^/]+)\/submit$/);
  if (submitQuestMatch && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string; proof?: string; discordId?: string };
    const authorization = await authorizePassportWallet(request, services, body.wallet);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const result = await services.quests.submitQuest({
      wallet: authorization.wallet,
      questId: submitQuestMatch[1],
      proof: body.proof,
      discordId: body.discordId
    });
    json(response, result.ok ? 200 : result.statusCode, result.body);
    return;
  }

  if (url.pathname === "/api/testnet/activity") {
    const wallet = url.searchParams.get("wallet") ?? demoTestnetActivity.wallet;
    if (!services.identity.hasLinkedWallet(wallet)) {
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
    if (discordId && !(await services.identity.hasDiscordId(discordId))) {
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

  if (url.pathname === "/api/discord/link-challenge" && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string };
    const authorization = await authorizePassportWallet(request, services, body.wallet);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const result = await services.identity.createDiscordLinkChallenge(authorization.wallet);
    json(response, result.ok ? 200 : result.statusCode, result.body);
    return;
  }

  if (url.pathname === "/api/discord/link-verify" && request.method === "POST") {
    const body = await readBody(request) as {
      wallet?: string;
      challenge?: string;
      discordId?: string;
      username?: string;
      avatarUrl?: string;
    };
    const authorization = await authorizePassportWallet(request, services, body.wallet);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const result = await services.identity.verifyDiscordLink({
      ...body,
      wallet: authorization.wallet
    });
    json(response, result.ok ? 200 : result.statusCode, result.body);
    return;
  }

  if (url.pathname === "/api/discord/connect" && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string; discordId?: string; username?: string };
    const authorization = await authorizePassportWallet(request, services, body.wallet);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const result = await services.identity.connectDiscord(body);
    json(response, result.ok ? 200 : result.statusCode, result.body);
    return;
  }

  if (url.pathname === "/api/passport/mint" && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string; classId?: number; mintSignature?: string };
    const authorization = authorizeWallet(request, services, body.wallet);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const result = await services.passport.mintPassport(body);
    json(response, result.ok ? 201 : result.statusCode, result.body);
    return;
  }

  if (url.pathname === "/api/passport/sync-chain" && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string };
    const authorization = authorizeWallet(request, services, body.wallet);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const result = await services.chainSync.syncPassport(authorization.wallet);
    json(response, result.ok ? 200 : result.statusCode, result.body);
    return;
  }

  const verifyMatch = url.pathname.match(/^\/api\/quests\/([^/]+)\/verify$/);
  if (verifyMatch && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string; discordId?: string; proof?: string };
    const authorization = await authorizePassportWallet(request, services, body.wallet);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const result = await services.quests.verifyQuest({
      wallet: authorization.wallet,
      questId: verifyMatch[1],
      proof: body.proof,
      discordId: body.discordId
    });
    json(response, result.ok ? result.statusCode ?? 200 : result.statusCode, result.body);
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

  if (url.pathname === "/api/admin/reviews" && request.method === "GET") {
    const authorization = authorizeAdminWallet(request, services);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const result = await services.adminReviews.listQueue(Number(url.searchParams.get("limit") ?? undefined));
    json(response, 200, result.body);
    return;
  }

  const reviewDecisionMatch = url.pathname.match(/^\/api\/admin\/reviews\/([^/]+)\/decision$/);
  if (reviewDecisionMatch && request.method === "POST") {
    const authorization = authorizeAdminWallet(request, services);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const body = await readBody(request) as { status?: string; notes?: string };
    const result = await services.adminReviews.decideReview({
      reviewId: reviewDecisionMatch[1],
      reviewerWallet: authorization.wallet,
      status: body.status,
      notes: body.notes
    });
    json(response, result.ok ? 200 : result.statusCode, result.body);
    return;
  }

  if (url.pathname === "/api/activity" && request.method === "GET") {
    const wallet = url.searchParams.get("wallet") ?? undefined;
    const authorization = await authorizePassportWallet(request, services, wallet);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const result = await services.notifications.listActivity(
      authorization.wallet,
      Number(url.searchParams.get("limit") ?? undefined)
    );
    json(response, result.ok ? 200 : result.statusCode, result.body);
    return;
  }

  if (url.pathname === "/api/notifications" && request.method === "GET") {
    const wallet = url.searchParams.get("wallet") ?? undefined;
    const authorization = await authorizePassportWallet(request, services, wallet);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

    const result = await services.notifications.listNotifications(
      authorization.wallet,
      Number(url.searchParams.get("limit") ?? undefined)
    );
    json(response, result.ok ? 200 : result.statusCode, result.body);
    return;
  }

  const passportMatch = url.pathname.match(/^\/api\/passport\/([^/]+)$/);
  if (passportMatch) {
    const passport = await services.passport.getPassport(passportMatch[1]);
    if (!passport) {
      json(response, 404, {
        error: "PassportNotFound",
        message: "This wallet has not minted a Soulbound Passport"
      });
      return;
    }

    json(response, 200, { passport });
    return;
  }

  const profileMatch = url.pathname.match(/^\/api\/profile\/([^/]+)$/);
  if (profileMatch) {
    const passport = await services.passport.getPassport(profileMatch[1]);
    if (!passport) {
      json(response, 404, {
        error: "PassportNotFound",
        message: "This wallet has not minted a Soulbound Passport"
      });
      return;
    }

    const profileIdentityLink = await services.identity.getIdentityLink(profileMatch[1]);
    json(response, 200, {
      profile: {
        wallet: profileMatch[1],
        passport,
        class: getBuilderClass(passport.classId),
        reputation: calculateReputation(passport),
        achievements: passport.achievements.filter((achievement) => achievement.unlocked),
        completedQuests: quests.filter((quest) => passport.completedQuestIds.includes(quest.id)),
        testnetActivity: demoTestnetActivity,
        discordActivity: demoDiscordActivity,
        identityLink: profileIdentityLink ?? null
      }
    });
    return;
  }

  if (url.pathname === "/api/passport/evolution") {
    const wallet = url.searchParams.get("wallet");
    const passport = await services.passport.getPassport(wallet ?? undefined);
    json(response, 200, {
      currentStage: passport?.stage ?? 1,
      stages: evolutionStages.map((stage) => ({
        ...stage,
        complete: stage.id <= (passport?.stage ?? 1)
      }))
    });
    return;
  }

  if (url.pathname === "/api/oracle/chat" && request.method === "POST") {
    const body = await readBody(request) as { wallet?: string; message?: string };
    const authorization = await authorizePassportWallet(request, services, body.wallet);
    if (!authorization.ok) {
      json(response, authorization.statusCode, authorization.body);
      return;
    }

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

  json(response, 404, notFound(url.pathname, getRequestContext(response)?.requestId));
}

function authorizeWallet(request: IncomingMessage, services: BackendServices, wallet?: string) {
  const normalizedWallet = normalizeWallet(wallet);
  if (!normalizedWallet) {
    return {
      ok: false as const,
      statusCode: 400,
      body: {
        error: "InvalidWallet",
        message: "A valid wallet is required for this action"
      }
    };
  }

  const token = getBearerToken(request.headers.authorization);
  const payload = token ? services.auth.verifyToken(token) : null;
  if (!payload) {
    return {
      ok: false as const,
      statusCode: 401,
      body: {
        error: "Unauthorized",
        message: "A valid wallet session token is required"
      }
    };
  }

  if (payload.wallet !== normalizedWallet) {
    return {
      ok: false as const,
      statusCode: 403,
      body: {
        error: "WalletMismatch",
        message: "Wallet session token does not match the requested wallet"
      }
    };
  }

  return { ok: true as const, wallet: normalizedWallet };
}

function authorizeAdminWallet(request: IncomingMessage, services: BackendServices) {
  const token = getBearerToken(request.headers.authorization);
  const payload = token ? services.auth.verifyToken(token) : null;
  if (!payload) {
    return {
      ok: false as const,
      statusCode: 401,
      body: {
        error: "Unauthorized",
        message: "A valid admin wallet session token is required"
      }
    };
  }

  if (!services.adminReviews.isAdminWallet(payload.wallet)) {
    return {
      ok: false as const,
      statusCode: 403,
      body: {
        error: "AdminRequired",
        message: "This wallet is not authorized for admin moderation"
      }
    };
  }

  return { ok: true as const, wallet: payload.wallet };
}

async function authorizePassportWallet(request: IncomingMessage, services: BackendServices, wallet?: string) {
  const authorization = authorizeWallet(request, services, wallet);
  if (!authorization.ok) return authorization;

  const passport = await services.passport.getPassport(authorization.wallet);
  if (!passport) {
    return {
      ok: false as const,
      statusCode: 403,
      body: {
        error: "PassportRequired",
        message: "Mint a Soulbound Passport before using this action"
      }
    };
  }

  return authorization;
}

function getBearerToken(authorization?: string) {
  const [scheme, token] = authorization?.split(" ") ?? [];
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

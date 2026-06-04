import { createServer } from "node:http";
import {
  achievements,
  builderClasses,
  calculateReputation,
  demoPassport,
  evolutionStages,
  getBuilderClass,
  getLevelProgress,
  leaderboard,
  quests
} from "@ritual/domain";

const port = Number(process.env.PORT ?? 4000);

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

  if (url.pathname === "/api/quests") {
    const classFilter = Number(url.searchParams.get("class"));
    const filtered = Number.isNaN(classFilter)
      ? quests
      : quests.filter((quest) => !quest.classId || quest.classId === classFilter);
    json(response, 200, { quests: filtered, total: filtered.length });
    return;
  }

  if (url.pathname === "/api/leaderboard") {
    json(response, 200, { builders: leaderboard });
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
    json(response, 200, {
      profile: {
        wallet: profileMatch[1],
        passport: demoPassport,
        class: getBuilderClass(demoPassport.classId),
        reputation: calculateReputation(demoPassport),
        achievements: achievements.filter((achievement) => achievement.unlocked),
        completedQuests: quests.filter((quest) => demoPassport.completedQuestIds.includes(quest.id))
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

import {
  InMemoryAuthChallengeRepository,
  PostgresAuthChallengeRepository
} from "../repositories/auth-challenge-repository.js";
import {
  InMemoryDiscordLinkChallengeRepository,
  PostgresDiscordLinkChallengeRepository
} from "../repositories/discord-link-challenge-repository.js";
import type { ChainConfig } from "../config.js";
import { createRitualChainClient } from "../chain/ritual-chain-client.js";
import type { RitualChainClient } from "../chain/ritual-chain-client.js";
import { createPostgresPool } from "../db/postgres.js";
import {
  InMemoryIdentityLinkRepository,
  PostgresIdentityLinkRepository
} from "../repositories/identity-link-repository.js";
import {
  InMemoryPassportRepository,
  PostgresPassportRepository
} from "../repositories/passport-repository.js";
import {
  InMemoryQuestAttemptRepository,
  PostgresQuestAttemptRepository
} from "../repositories/quest-attempt-repository.js";
import {
  InMemoryProgressionRepository,
  PostgresProgressionRepository
} from "../repositories/progression-repository.js";
import {
  InMemoryReviewRecordRepository,
  PostgresReviewRecordRepository
} from "../repositories/review-record-repository.js";
import { AdminReviewService } from "./admin-review-service.js";
import { AuthService } from "./auth-service.js";
import { ChainSyncService } from "./chain-sync-service.js";
import { IdentityService } from "./identity-service.js";
import { NotificationService } from "./notification-service.js";
import { PassportService } from "./passport-service.js";
import { ProgressionService } from "./progression-service.js";
import { QuestEngineService } from "./quest-engine-service.js";
import { QuestVerificationService } from "./quest-verification-service.js";
import { ReadinessService } from "./readiness-service.js";
import { TokenService } from "./token-service.js";

interface BackendServiceOptions {
  adminWallets?: string[];
  chain?: ChainConfig;
  chainClient?: RitualChainClient;
  databaseUrl?: string;
  jwtSecret?: string;
}

export interface BackendServices {
  adminReviews: AdminReviewService;
  auth: AuthService;
  chainSync: ChainSyncService;
  identity: IdentityService;
  notifications: NotificationService;
  passport: PassportService;
  progression: ProgressionService;
  quests: QuestEngineService;
  questVerification: QuestVerificationService;
  readiness: ReadinessService;
}

export function createBackendServices(options: BackendServiceOptions = {}): BackendServices {
  const pool = options.databaseUrl ? createPostgresPool(options.databaseUrl) : null;
  const identityLinks = options.databaseUrl
    ? new PostgresIdentityLinkRepository(pool!)
    : new InMemoryIdentityLinkRepository();
  const passports = options.databaseUrl
    ? new PostgresPassportRepository(pool!)
    : new InMemoryPassportRepository();
  const questAttempts = options.databaseUrl
    ? new PostgresQuestAttemptRepository(pool!)
    : new InMemoryQuestAttemptRepository();
  const authChallenges = options.databaseUrl
    ? new PostgresAuthChallengeRepository(pool!)
    : new InMemoryAuthChallengeRepository();
  const discordChallenges = options.databaseUrl
    ? new PostgresDiscordLinkChallengeRepository(pool!)
    : new InMemoryDiscordLinkChallengeRepository();
  const progressionRepository = options.databaseUrl
    ? new PostgresProgressionRepository(pool!)
    : new InMemoryProgressionRepository();
  const reviewRecords = options.databaseUrl
    ? new PostgresReviewRecordRepository(pool!)
    : new InMemoryReviewRecordRepository();
  const identity = new IdentityService(identityLinks, discordChallenges, passports);
  const questVerification = new QuestVerificationService(identity);
  const progression = new ProgressionService(passports, progressionRepository);
  const adminReviews = new AdminReviewService(
    reviewRecords,
    questAttempts,
    progression,
    options.adminWallets
  );

  return {
    adminReviews,
    auth: new AuthService(
      authChallenges,
      new TokenService(options.jwtSecret ?? "ritual-ascension-local-dev-secret")
    ),
    chainSync: new ChainSyncService(
      options.chainClient ?? createRitualChainClient(options.chain ?? {}),
      passports
    ),
    identity,
    notifications: new NotificationService(progressionRepository),
    passport: new PassportService(passports),
    progression,
    quests: new QuestEngineService(questAttempts, questVerification, progression, adminReviews),
    questVerification,
    readiness: new ReadinessService(pool, options.chain)
  };
}

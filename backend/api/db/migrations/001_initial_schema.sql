-- pgcrypto supplies gen_random_uuid() on older Postgres hosts.
-- Postgres 13+ has it built-in; the CREATE EXTENSION is a no-op there.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Auth ─────────────────────────────────────────────────────────────────────

-- nonce is the natural PK; the code looks up sessions by nonce only.
CREATE TABLE IF NOT EXISTS wallet_sessions (
  wallet       TEXT        NOT NULL,
  nonce        TEXT        PRIMARY KEY,
  issued_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ
);

-- challenge is the natural PK.
CREATE TABLE IF NOT EXISTS discord_link_challenges (
  wallet       TEXT        NOT NULL,
  challenge    TEXT        PRIMARY KEY,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ
);

-- ─── Passports ────────────────────────────────────────────────────────────────
-- achievements and completed_quest_ids are NOT stored here;
-- they are derived at query time from achievement_unlocks and quest_attempts.

CREATE TABLE IF NOT EXISTS passports (
  wallet               TEXT        PRIMARY KEY,
  token_id             INTEGER     NOT NULL UNIQUE,
  class_id             INTEGER     NOT NULL,
  xp                   INTEGER     NOT NULL DEFAULT 0,
  stage                INTEGER     NOT NULL DEFAULT 1,
  active_weeks         INTEGER     NOT NULL DEFAULT 0,
  projects_completed   INTEGER     NOT NULL DEFAULT 0,
  agents_deployed      INTEGER     NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Identity ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS identity_links (
  wallet                TEXT        PRIMARY KEY,
  passport_token_id     INTEGER     NOT NULL,
  discord_id            TEXT        NOT NULL UNIQUE,
  discord_username      TEXT        NOT NULL,
  discord_avatar_url    TEXT,
  discord_account_hash  TEXT,
  linked_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Quests ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quest_attempts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet               TEXT        NOT NULL,
  quest_id             TEXT        NOT NULL,
  status               TEXT        NOT NULL,
  proof                TEXT,
  verification_source  TEXT,
  verification_result  JSONB       NOT NULL DEFAULT '{}',
  submitted_at         TIMESTAMPTZ,
  verified_at          TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wallet, quest_id)
);

CREATE INDEX IF NOT EXISTS quest_attempts_wallet_idx    ON quest_attempts (wallet);
CREATE INDEX IF NOT EXISTS quest_attempts_status_idx    ON quest_attempts (wallet, status);

-- ─── Progression ──────────────────────────────────────────────────────────────

-- quest_attempt_id is stored as TEXT (UUID string); the code does not enforce
-- an FK so we keep it plain text to allow in-memory generated IDs in tests.
CREATE TABLE IF NOT EXISTS xp_events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet            TEXT        NOT NULL,
  amount            INTEGER     NOT NULL,
  reason            TEXT        NOT NULL,
  source_ref        TEXT        NOT NULL UNIQUE,
  quest_attempt_id  TEXT,
  awarded_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS xp_events_wallet_idx ON xp_events (wallet, awarded_at DESC);

CREATE TABLE IF NOT EXISTS achievement_unlocks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet          TEXT        NOT NULL,
  achievement_id  TEXT        NOT NULL,
  xp_bonus        INTEGER     NOT NULL DEFAULT 0,
  source_ref      TEXT        NOT NULL,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wallet, achievement_id)
);

CREATE INDEX IF NOT EXISTS achievement_unlocks_wallet_idx ON achievement_unlocks (wallet);

CREATE TABLE IF NOT EXISTS evolution_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet      TEXT        NOT NULL,
  token_id    INTEGER     NOT NULL,
  from_stage  INTEGER     NOT NULL,
  to_stage    INTEGER     NOT NULL,
  reason      TEXT        NOT NULL,
  tx_hash     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS evolution_events_wallet_idx ON evolution_events (wallet);

-- ─── Admin reviews ────────────────────────────────────────────────────────────
-- id uses the same "review-<uuid>" format the in-memory repo produces,
-- so IDs are consistent across both backends.

CREATE TABLE IF NOT EXISTS review_records (
  id                TEXT        PRIMARY KEY DEFAULT 'review-' || gen_random_uuid()::TEXT,
  wallet            TEXT        NOT NULL,
  quest_attempt_id  TEXT        NOT NULL UNIQUE,
  product_id        TEXT,
  reviewer_wallet   TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS review_records_status_idx ON review_records (status, created_at);

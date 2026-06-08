CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_wallet TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS passports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL UNIQUE,
  token_id BIGINT NOT NULL UNIQUE,
  class_id SMALLINT NOT NULL CHECK (class_id BETWEEN 1 AND 5),
  xp BIGINT NOT NULL DEFAULT 0,
  stage SMALLINT NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 5),
  active_weeks INTEGER NOT NULL DEFAULT 0,
  projects_completed INTEGER NOT NULL DEFAULT 0,
  agents_deployed INTEGER NOT NULL DEFAULT 0,
  metadata_cid TEXT,
  minted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL UNIQUE REFERENCES passports(wallet) ON DELETE CASCADE,
  passport_token_id BIGINT NOT NULL REFERENCES passports(token_id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL UNIQUE,
  discord_username TEXT NOT NULL,
  discord_avatar_url TEXT,
  discord_account_hash TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discord_link_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL REFERENCES passports(wallet) ON DELETE CASCADE,
  challenge TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS quest_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL REFERENCES passports(wallet) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'submitted', 'verified', 'rejected', 'completed')),
  proof TEXT,
  verification_source TEXT,
  verification_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(wallet, quest_id)
);

CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL REFERENCES passports(wallet) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  source_ref TEXT NOT NULL UNIQUE,
  quest_attempt_id UUID REFERENCES quest_attempts(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievement_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL REFERENCES passports(wallet) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  xp_bonus BIGINT NOT NULL DEFAULT 0,
  source_ref TEXT NOT NULL UNIQUE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(wallet, achievement_id)
);

CREATE TABLE IF NOT EXISTS evolution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL REFERENCES passports(wallet) ON DELETE CASCADE,
  token_id BIGINT NOT NULL REFERENCES passports(token_id) ON DELETE CASCADE,
  from_stage SMALLINT NOT NULL CHECK (from_stage BETWEEN 1 AND 5),
  to_stage SMALLINT NOT NULL CHECK (to_stage BETWEEN 1 AND 5),
  reason TEXT NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (to_stage > from_stage)
);

CREATE TABLE IF NOT EXISTS oracle_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL REFERENCES passports(wallet) ON DELETE CASCADE,
  title TEXT,
  rate_limit_bucket TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oracle_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES oracle_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  recommended_quest_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verified_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  builder_wallet TEXT NOT NULL REFERENCES passports(wallet) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  repository_url TEXT,
  verification_badge TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL REFERENCES passports(wallet) ON DELETE CASCADE,
  quest_attempt_id UUID UNIQUE REFERENCES quest_attempts(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES verified_products(id) ON DELETE SET NULL,
  reviewer_wallet TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS passports_wallet_idx ON passports(wallet);
CREATE INDEX IF NOT EXISTS identity_links_discord_id_idx ON identity_links(discord_id);
CREATE INDEX IF NOT EXISTS discord_link_challenges_wallet_idx ON discord_link_challenges(wallet);
CREATE INDEX IF NOT EXISTS quest_attempts_wallet_status_idx ON quest_attempts(wallet, status);
CREATE INDEX IF NOT EXISTS xp_events_wallet_awarded_at_idx ON xp_events(wallet, awarded_at DESC);
CREATE INDEX IF NOT EXISTS achievement_unlocks_wallet_idx ON achievement_unlocks(wallet);
CREATE INDEX IF NOT EXISTS oracle_conversations_wallet_idx ON oracle_conversations(wallet);
CREATE UNIQUE INDEX IF NOT EXISTS review_records_quest_attempt_id_idx ON review_records(quest_attempt_id);

INSERT INTO passports (
  wallet,
  token_id,
  class_id,
  xp,
  stage,
  active_weeks,
  projects_completed,
  agents_deployed
)
VALUES (
  '0xa5c3f19d0b8e6a45b6f1b9b4a21c7f1d9e3b8124',
  42,
  1,
  3450,
  2,
  3,
  0,
  1
)
ON CONFLICT (wallet) DO NOTHING;

INSERT INTO identity_links (
  wallet,
  passport_token_id,
  discord_id,
  discord_username,
  discord_avatar_url
)
VALUES (
  '0xa5c3f19d0b8e6a45b6f1b9b4a21c7f1d9e3b8124',
  42,
  'ritual-demo-user',
  'ritual_builder',
  'https://cdn.discordapp.com/embed/avatars/0.png'
)
ON CONFLICT (wallet) DO NOTHING;

ALTER TABLE identity_links
  ADD COLUMN IF NOT EXISTS discord_account_hash TEXT;

CREATE TABLE IF NOT EXISTS discord_link_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL REFERENCES passports(wallet) ON DELETE CASCADE,
  challenge TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS discord_link_challenges_wallet_idx ON discord_link_challenges(wallet);

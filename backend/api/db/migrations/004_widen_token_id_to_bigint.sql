-- createTokenId() derives token ids from the last 12 hex chars of a wallet
-- address (up to ~2.8e14), which overflows Postgres's 4-byte INTEGER
-- (max ~2.1e9). Widen to BIGINT everywhere a token id is stored.

ALTER TABLE passports ALTER COLUMN token_id TYPE BIGINT;
ALTER TABLE identity_links ALTER COLUMN passport_token_id TYPE BIGINT;
ALTER TABLE evolution_events ALTER COLUMN token_id TYPE BIGINT;

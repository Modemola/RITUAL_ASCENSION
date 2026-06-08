import type { Pool } from "pg";
import { demoIdentityLink } from "@ritual/domain";
import type { IdentityLink } from "@ritual/domain";

export interface SaveIdentityLinkInput extends IdentityLink {
  discordAccountHash?: string;
}

export interface IdentityLinkRepository {
  findByWallet(wallet: string): Promise<IdentityLink | undefined>;
  findByDiscordId(discordId: string): Promise<IdentityLink | undefined>;
  save(identityLink: SaveIdentityLinkInput): Promise<IdentityLink>;
}

export class InMemoryIdentityLinkRepository implements IdentityLinkRepository {
  private readonly identityLinksByWallet = new Map<string, IdentityLink>();
  private readonly walletByDiscordId = new Map<string, string>();

  constructor(seedIdentityLink: IdentityLink = demoIdentityLink) {
    this.identityLinksByWallet.set(seedIdentityLink.wallet.toLowerCase(), seedIdentityLink);
    this.walletByDiscordId.set(seedIdentityLink.discordId, seedIdentityLink.wallet.toLowerCase());
  }

  async findByWallet(wallet: string) {
    return this.identityLinksByWallet.get(wallet.toLowerCase());
  }

  async findByDiscordId(discordId: string) {
    const wallet = this.walletByDiscordId.get(discordId);
    return wallet ? this.identityLinksByWallet.get(wallet) : undefined;
  }

  async save(identityLink: SaveIdentityLinkInput) {
    const normalizedWallet = identityLink.wallet.toLowerCase();
    this.identityLinksByWallet.set(normalizedWallet, identityLink);
    this.walletByDiscordId.set(identityLink.discordId, normalizedWallet);
    return identityLink;
  }
}

export class PostgresIdentityLinkRepository implements IdentityLinkRepository {
  constructor(private readonly pool: Pool) {}

  async findByWallet(wallet: string) {
    const result = await this.pool.query<IdentityLinkRow>(
      `
        SELECT wallet, passport_token_id, discord_id, discord_username, discord_avatar_url, discord_account_hash
        FROM identity_links
        WHERE wallet = $1
      `,
      [wallet.toLowerCase()]
    );

    return result.rows[0] ? toIdentityLink(result.rows[0]) : undefined;
  }

  async findByDiscordId(discordId: string) {
    const result = await this.pool.query<IdentityLinkRow>(
      `
        SELECT wallet, passport_token_id, discord_id, discord_username, discord_avatar_url, discord_account_hash
        FROM identity_links
        WHERE discord_id = $1
      `,
      [discordId]
    );

    return result.rows[0] ? toIdentityLink(result.rows[0]) : undefined;
  }

  async save(identityLink: SaveIdentityLinkInput) {
    const normalizedWallet = identityLink.wallet.toLowerCase();

    const result = await this.pool.query<IdentityLinkRow>(
      `
        INSERT INTO identity_links (
          wallet,
          passport_token_id,
          discord_id,
          discord_username,
          discord_avatar_url,
          discord_account_hash
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (wallet) DO UPDATE SET
          discord_username = EXCLUDED.discord_username,
          discord_avatar_url = EXCLUDED.discord_avatar_url,
          discord_account_hash = EXCLUDED.discord_account_hash,
          updated_at = now()
        RETURNING wallet, passport_token_id, discord_id, discord_username, discord_avatar_url, discord_account_hash
      `,
      [
        normalizedWallet,
        identityLink.passportTokenId,
        identityLink.discordId,
        identityLink.discordUsername,
        identityLink.discordAvatarUrl ?? null,
        identityLink.discordAccountHash ?? null
      ]
    );

    return toIdentityLink(result.rows[0]);
  }
}

interface IdentityLinkRow {
  wallet: string;
  passport_token_id: string;
  discord_id: string;
  discord_username: string;
  discord_avatar_url: string | null;
  discord_account_hash?: string | null;
}

function toIdentityLink(row: IdentityLinkRow): IdentityLink {
  return {
    wallet: row.wallet,
    passportTokenId: Number(row.passport_token_id),
    discordId: row.discord_id,
    discordUsername: row.discord_username,
    discordAvatarUrl: row.discord_avatar_url ?? undefined,
    discordAccountHash: row.discord_account_hash ?? undefined
  };
}

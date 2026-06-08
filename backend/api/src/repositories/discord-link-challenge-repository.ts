import type { Pool } from "pg";

export interface DiscordLinkChallenge {
  challenge: string;
  wallet: string;
  expiresAt: Date;
  consumedAt?: Date;
}

export interface DiscordLinkChallengeRepository {
  create(challenge: DiscordLinkChallenge): Promise<DiscordLinkChallenge>;
  consume(challenge: string, wallet: string): Promise<DiscordLinkChallenge | undefined>;
}

export class InMemoryDiscordLinkChallengeRepository implements DiscordLinkChallengeRepository {
  private readonly challengesByCode = new Map<string, DiscordLinkChallenge>();

  async create(challenge: DiscordLinkChallenge) {
    this.challengesByCode.set(challenge.challenge, challenge);
    return challenge;
  }

  async consume(challenge: string, wallet: string) {
    const existing = this.challengesByCode.get(challenge);
    if (!existing || existing.wallet !== wallet.toLowerCase() || existing.consumedAt) {
      return undefined;
    }

    const consumed = { ...existing, consumedAt: new Date() };
    this.challengesByCode.set(challenge, consumed);
    return consumed;
  }
}

export class PostgresDiscordLinkChallengeRepository implements DiscordLinkChallengeRepository {
  constructor(private readonly pool: Pool) {}

  async create(challenge: DiscordLinkChallenge) {
    await this.pool.query(
      `
        INSERT INTO discord_link_challenges (wallet, challenge, expires_at)
        VALUES ($1, $2, $3)
      `,
      [challenge.wallet.toLowerCase(), challenge.challenge, challenge.expiresAt]
    );

    return challenge;
  }

  async consume(challenge: string, wallet: string) {
    const result = await this.pool.query<DiscordLinkChallengeRow>(
      `
        UPDATE discord_link_challenges
        SET consumed_at = now()
        WHERE challenge = $1
          AND wallet = $2
          AND consumed_at IS NULL
        RETURNING wallet, challenge, expires_at, consumed_at
      `,
      [challenge, wallet.toLowerCase()]
    );

    return result.rows[0] ? toDiscordLinkChallenge(result.rows[0]) : undefined;
  }
}

interface DiscordLinkChallengeRow {
  wallet: string;
  challenge: string;
  expires_at: Date;
  consumed_at: Date | null;
}

function toDiscordLinkChallenge(row: DiscordLinkChallengeRow): DiscordLinkChallenge {
  return {
    wallet: row.wallet,
    challenge: row.challenge,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at ?? undefined
  };
}

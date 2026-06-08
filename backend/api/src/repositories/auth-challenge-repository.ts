import type { Pool } from "pg";

export interface AuthChallenge {
  wallet: string;
  nonce: string;
  message: string;
  expiresAt: Date;
  consumedAt?: Date;
}

export interface AuthChallengeRepository {
  create(challenge: AuthChallenge): Promise<AuthChallenge>;
  findByNonce(nonce: string): Promise<AuthChallenge | undefined>;
  consume(nonce: string): Promise<void>;
}

export class InMemoryAuthChallengeRepository implements AuthChallengeRepository {
  private readonly challengesByNonce = new Map<string, AuthChallenge>();

  async create(challenge: AuthChallenge) {
    this.challengesByNonce.set(challenge.nonce, challenge);
    return challenge;
  }

  async findByNonce(nonce: string) {
    return this.challengesByNonce.get(nonce);
  }

  async consume(nonce: string) {
    const challenge = this.challengesByNonce.get(nonce);
    if (challenge) {
      this.challengesByNonce.set(nonce, { ...challenge, consumedAt: new Date() });
    }
  }
}

export class PostgresAuthChallengeRepository implements AuthChallengeRepository {
  constructor(private readonly pool: Pool) {}

  async create(challenge: AuthChallenge) {
    await this.pool.query(
      `
        INSERT INTO wallet_sessions (wallet, nonce, issued_at, expires_at)
        VALUES ($1, $2, now(), $3)
      `,
      [challenge.wallet.toLowerCase(), challenge.nonce, challenge.expiresAt]
    );

    return challenge;
  }

  async findByNonce(nonce: string) {
    const result = await this.pool.query<AuthChallengeRow>(
      `
        SELECT wallet, nonce, expires_at, consumed_at
        FROM wallet_sessions
        WHERE nonce = $1
      `,
      [nonce]
    );

    return result.rows[0] ? toAuthChallenge(result.rows[0]) : undefined;
  }

  async consume(nonce: string) {
    await this.pool.query(
      `
        UPDATE wallet_sessions
        SET consumed_at = now()
        WHERE nonce = $1
      `,
      [nonce]
    );
  }
}

interface AuthChallengeRow {
  wallet: string;
  nonce: string;
  expires_at: Date;
  consumed_at: Date | null;
}

function toAuthChallenge(row: AuthChallengeRow): AuthChallenge {
  return {
    wallet: row.wallet,
    nonce: row.nonce,
    message: "",
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at ?? undefined
  };
}

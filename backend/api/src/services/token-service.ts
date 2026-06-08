import { createHmac, timingSafeEqual } from "node:crypto";

interface AuthTokenPayload {
  wallet: string;
  exp: number;
  iat: number;
}

export class TokenService {
  constructor(private readonly secret: string) {}

  sign(wallet: string, ttlSeconds = 60 * 60 * 24) {
    const now = Math.floor(Date.now() / 1000);
    const payload: AuthTokenPayload = {
      wallet: wallet.toLowerCase(),
      iat: now,
      exp: now + ttlSeconds
    };

    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = sign(`${encodedHeader}.${encodedPayload}`, this.secret);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token: string): AuthTokenPayload | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, this.secret);
    if (!safeEqual(signature, expectedSignature)) return null;

    try {
      const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthTokenPayload;
      if (!payload.wallet || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

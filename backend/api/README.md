# Ritual Ascension API

The API can run in two persistence modes:

- Without `DATABASE_URL`, it uses seeded in-memory repositories for local demo flows and tests.
- With `DATABASE_URL`, it uses Postgres-backed repositories where implemented.

## Local Database

Create a Postgres database, set `DATABASE_URL`, then run:

```bash
npm run db:migrate -w backend/api
```

The first migration creates the backend data model for wallet sessions, passports, identity links, quest attempts, XP events, achievement unlocks, evolution events, oracle conversations, verified products, and review records.

## Scripts

```bash
npm run dev -w backend/api
npm run typecheck -w backend/api
npm test -w backend/api
```

## Deployment Signals

- `GET /api/health` returns a lightweight liveness response and echoes `X-Request-Id`.
- `GET /api/ready` reports API, database, and chain configuration readiness.
- `ALLOWED_ORIGINS` should be set to the deployed frontend origin in production.
- `ADMIN_WALLETS` controls wallet-session access to moderation routes.
- `JWT_SECRET` must be changed from the local default before production startup.

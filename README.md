# Ritual Ascension

AI-native onboarding, progression, reputation, and identity for builders in the Ritual ecosystem.

This repo starts from the provided PRD and gives the project a runnable foundation:

- `frontend/web`: Next.js app with landing, onboarding, dashboard, quests, oracle, achievements, leaderboard, and public profile routes.
- `backend/api`: lightweight TypeScript API server exposing seeded V1 endpoints.
- `shared/domain`: shared classes, quests, achievements, XP, reputation, and mock profile logic.
- `blockchain/contracts`: Solidity starting points for the soulbound Passport NFT and Progress Manager.
- `docs/prd-summary.md`: implementation notes distilled from the PRD.

## Quick Start

```bash
npm install
npm run dev
```

The web app runs on `http://localhost:3000` by default.

To run the mock API:

```bash
npm run dev:backend
```

The API runs on `http://localhost:4000`.

The backend now supports optional Postgres persistence. Copy `backend/api/.env.example`, set `DATABASE_URL`, and run:

```bash
npm run db:migrate -w backend/api
```

You can also use the clearer segmented scripts:

```bash
npm run dev:frontend
npm run dev:backend
npm run build:contracts
```

## Folder Map

```text
frontend/web          Next.js frontend
backend/api           TypeScript API server
blockchain/contracts  Hardhat Solidity contracts
shared/domain         Shared product rules and seed data
docs                  PRD notes and implementation summary
```

Generated local output such as `.next`, `dist`, `apps/web`, Hardhat `artifacts`, `cache`, `typechain-types`, and `*.log` files is ignored and can be regenerated from the workspace scripts.

## First Milestone Target

The current build is aimed at M1/M2 from the PRD: wallet-oriented onboarding, class selection, passport state, XP and level display, quest browsing, and the shape of the public profile and leaderboard.

Production integrations still to add:

- PostgreSQL and Redis-backed rate limits where needed.
- Ritual RPC transaction verification/indexing.
- Discord bot and activity ingestion.
- IPFS metadata and artwork updates.

## On-chain Passport Minting

The onboarding flow uses a local signed demo mint by default. To switch it to a real `PassportNFT.mintPassport(uint8)` transaction, set these frontend variables and matching backend chain variables:

```bash
NEXT_PUBLIC_PASSPORT_NFT_ADDRESS=0x...
NEXT_PUBLIC_RITUAL_CHAIN_ID=...
RITUAL_RPC_URL=...
RITUAL_CHAIN_ID=...
PASSPORT_NFT_ADDRESS=0x...
PROGRESS_MANAGER_ADDRESS=0x...
```

After the wallet transaction confirms, the frontend calls `/api/passport/sync-chain` so the backend records the on-chain passport state.

## Oracle Mentor Provider

The Oracle Mentor works locally without a provider key by deriving a recommendation from passport state and unfinished quests. To use an OpenAI-compatible chat completions API instead, configure:

```bash
ORACLE_PROVIDER=openai-compatible
ORACLE_ENDPOINT=https://...
ORACLE_MODEL=...
ORACLE_API_KEY=...
```

The provider should return JSON with `message`, `recommendedQuest`, `learningOutcome`, and `nextMilestone`; malformed or unavailable provider responses fall back to the local mentor.

## Verification Sources

Quest verification uses demo activity sources unless live endpoints are configured:

```bash
RITUAL_TESTNET_INDEXER_ENDPOINT=https://...
RITUAL_TESTNET_INDEXER_API_KEY=...
DISCORD_ACTIVITY_ENDPOINT=https://...
DISCORD_ACTIVITY_API_KEY=...
```

The testnet endpoint should return Ritual wallet activity, and the Discord endpoint should return message count and roles for a linked Discord ID. Both may wrap the payload as `{ "activity": ... }` or return the activity object directly.

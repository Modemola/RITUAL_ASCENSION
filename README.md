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

## First Milestone Target

The current build is aimed at M1/M2 from the PRD: wallet-oriented onboarding, class selection, passport state, XP and level display, quest browsing, and the shape of the public profile and leaderboard.

Production integrations still to add:

- Wagmi/Viem wallet connection and SIWE authentication.
- PostgreSQL, Redis, and durable API services.
- Ritual RPC transaction verification.
- Contract deployment pipeline and generated ABIs.
- Oracle provider integration.
- IPFS metadata and artwork updates.

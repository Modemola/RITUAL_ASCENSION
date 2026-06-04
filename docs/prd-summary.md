# Ritual Ascension PRD Summary

## V1 Product Pillars

- Soulbound Passport: non-transferable NFT identity tied to one wallet.
- Builder Class: permanent class selection at mint time.
- Quest Engine: verifiable on-chain and off-chain progression.
- XP and Levels: quantified progress from level 1 to 50.
- Achievements: permanent merit badges attached to the passport profile.
- Reputation: cached public score derived from XP, achievements, projects, agents, and consistency.
- Passport Evolution: five visual stages triggered by milestones.
- Oracle Mentor: AI guide that recommends existing quests from user context.
- Leaderboard and Public Profiles: public discovery by wallet.

## Build Order

1. Foundation: web app, API shape, shared domain model, contract skeletons.
2. Wallet auth: Wagmi, WalletConnect, SIWE nonce and JWT flow.
3. Passport minting: on-chain mint and backend passport record.
4. Dashboard and XP: XP events, level math, passport card, activity feed.
5. Quest engine: quest start, proof submit, tx hash verification.
6. Achievements and evolution: unlock rules, stage transition rules, notifications.
7. Oracle mentor: provider integration, memory, daily limits.
8. Leaderboard and profiles: reputation recalculation and public pages.

## Current Scaffold Decisions

- Use a monorepo so shared product rules do not drift between frontend and API.
- Seed static domain data first so all routes have meaningful content before chain and database integrations exist.
- Keep the API dependency-light while the product surface is still taking shape.
- Add Solidity contracts as source files now, with deployment tooling deferred until chain configuration is known.

# Ritual Ascension monorepo

npm workspaces: `frontend/*`, `backend/*`, `shared/*`, `blockchain/*`.

```
frontend/web/          Next.js 15 app router frontend
backend/api/            Node/TypeScript API (plain node:http, no framework)
shared/domain/           Shared types + static data consumed by both frontend and backend
blockchain/contracts/     Hardhat 3 + viem Solidity project (see below)
scripts/dev-all.mjs      Runs frontend + backend dev servers together (`npm run dev`)
```

Root-level `npm run typecheck` / `npm run build` fan out to the relevant workspaces. There is no root-level Hardhat project — `blockchain/contracts` is self-contained with its own `hardhat.config.ts`, `node_modules`, and dependencies.

## Hardhat + viem project (blockchain/contracts)

### Project layout

```
blockchain/contracts/
  src/               Solidity source files (*.sol) — PassportNFT, ProgressManager
  test/              TypeScript integration tests (network.create() + viem)
  scripts/deploy.ts  Deployment script (no Hardhat Ignition modules — plain script)
  hardhat.config.ts
```

### Working in this project

When writing or modifying tests, configuring `blockchain/contracts/hardhat.config.ts`, or interacting with the network from TypeScript, invoke the **`hardhat`** skill. It covers Solidity and TypeScript testing, how to choose between them, `forge-std` cheatcodes, the `network.create()` API, `networkHelpers`, and the compile-then-typecheck workflow. The skill itself points to the matching `hardhat-toolbox-*` skill for toolbox-specific guidance (clients, contract interaction, assertions) — this project uses `hardhat-toolbox-viem`.

Run compile/test from inside `blockchain/contracts`, or via `npm run build -w blockchain/contracts` from the repo root.

### Docs

- Hardhat 3 — https://hardhat.org/llms.txt
- viem — https://viem.sh/llms.txt

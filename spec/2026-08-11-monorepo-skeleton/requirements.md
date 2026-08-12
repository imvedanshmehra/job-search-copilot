# Requirements — Phase 0: Monorepo skeleton

## Scope

Roadmap phase: [Phase 0 — Monorepo skeleton](../roadmap.md#mvp).

Set up the pnpm + Turborepo monorepo shell described in [tech-stack.md](../tech-stack.md#repo-layout): the `/apps` (`web`, `api`, `worker`) and `/packages` (`db`, `sources`, `ats`, `scoring`, `core`, `contracts`) folders, empty-but-booting Next.js/Express/worker entrypoints, and Docker Compose for Postgres 16 + pgvector.

_Done when (from roadmap.md):_ `pnpm dev` boots all three processes and they can hit a Postgres health check.

No business logic, no schema, no scoring, no UI beyond a placeholder — that's Phase 1 onward. This phase only proves the skeleton runs.

## Out of scope for this phase

- Prisma schema / migrations (Phase 1).
- `packages/core` and `packages/contracts` shapes (Phase 2) — folders exist and build, but stay empty/placeholder.
- Any source or ATS adapter implementation (Phase 5 / 13) — `packages/sources` and `packages/ats` are empty placeholder packages.
- Any scoring logic (Phase 7 / 8) — `packages/scoring` is an empty placeholder package.
- `node-cron` scheduling in `apps/worker` (Phase 6) — the worker entrypoint boots and exits/idles, it does not schedule anything yet.
- CI pipeline setup (not called for by this phase's done condition).
- Auth of any kind — out of scope for the whole MVP per [mission.md](../mission.md).

## Decisions

Resolved in scoping conversation with the user (2026-08-11):

1. **Health check owner: `api` only.** `apps/api` exposes `GET /health`, which runs a trivial query against Postgres and reports success/failure. `apps/web` and `apps/worker` only need to boot cleanly for this phase — worker doesn't need its own DB probe until Phase 6 when it actually starts touching the database on a schedule.
2. **Postgres/pgvector image: `pgvector/pgvector:pg16`.** Official pgvector project image, Postgres 16 with the extension pre-installed, most actively maintained option. Matches the Postgres 16 requirement in tech-stack.md exactly.
3. **Lint/format: set up now.** ESLint + Prettier configured at the repo root and shared across `/apps` and `/packages` in this phase, not deferred. tech-stack.md mandates strict TypeScript with no `any`; wiring shared lint config while the skeleton is still empty is cheap and prevents drift once Phase 1+ lands real code.
4. **Node version: 22 LTS**, pinned via `.nvmrc` and `package.json` `engines`.

## Context

- This is the first implementation phase of the project — repo currently contains only `/spec` and `README.md`, no code.
- Constitution documents govern all choices not explicitly decided above: [mission.md](../mission.md) (product principles, non-goals), [tech-stack.md](../tech-stack.md) (stack, repo layout, architectural rules).
- Per tech-stack.md, `api` and `worker` share one codebase/Dockerfile with different entrypoints (`start:api` / `start:worker`) — they are separate processes sharing logic through `/packages`, not separate projects. This phase should reflect that shared structure even though there's no shared business logic yet.
- `web` must never get direct Postgres/DB credentials or a DB client — even in skeleton form, `apps/web` talks to `apps/api` over HTTP only, never to Postgres directly.
- The done condition only requires `pnpm dev` to boot all three processes and for the health check to be reachable — it does not require Docker Compose to be started automatically by `pnpm dev`; starting Postgres is a documented separate step.

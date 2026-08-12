# Plan — Phase 0: Monorepo skeleton

See [requirements.md](requirements.md) for scope and decisions. Task groups are meant to be done in order; each should leave the repo in a working state.

## 1. Root workspace scaffolding

- Add `.nvmrc` pinned to Node 22 LTS, and `engines.node` in the root `package.json` matching it.
- Add `pnpm-workspace.yaml` declaring `apps/*` and `packages/*`.
- Add root `package.json` with `packageManager` pinned (pnpm), root scripts (`dev`, `build`, `lint`, `format`), and Turborepo as a dev dependency.
- Add `turbo.json` with a `dev` pipeline (persistent, no cache) and placeholder `build`/`lint` pipelines.
- Add a root `tsconfig.base.json` with `strict: true` (and the rest of the strict family) for all packages/apps to extend.
- Add root `.gitignore` (`node_modules`, `.turbo`, `dist`, `.next`, `.env*` except `.env.example`).

## 2. Lint/format tooling

- Add shared ESLint config (flat config) at the root covering TypeScript strict rules, importable/extendable by each app/package.
- Add shared Prettier config at the root.
- Wire `lint` and `format` scripts at root (via Turborepo) and confirm they run against the empty workspaces without error.

## 3. `/packages` folder skeletons

Create each package folder from tech-stack.md's repo layout with a minimal `package.json` + `tsconfig.json` (extending the root base) so the workspace resolves and Turborepo can graph them, even though most are empty until later phases:

- `packages/core`
- `packages/contracts`
- `packages/db`
- `packages/sources`
- `packages/ats`
- `packages/scoring`

No exports beyond an empty `index.ts` per package for now.

## 4. `apps/web` — Next.js entrypoint

- Scaffold Next.js 15, App Router, TypeScript strict, Tailwind + shadcn/ui installed per tech-stack.md.
- Single placeholder page confirming the app boots.
- No DB client, no server-side Postgres access — confirm nothing in `apps/web`'s dependencies pulls in `pg`/Prisma.
- `dev` script bound to a fixed local port.

## 5. `apps/api` — Express entrypoint

- Minimal Express app in TypeScript, strict mode, sharing the root tsconfig.
- `GET /health` route: connects to Postgres (via `pg`, not Prisma — schema doesn't exist until Phase 1) and runs a trivial query (`SELECT 1`); returns 200 with DB status on success, 5xx with an error body on failure.
- Reads DB connection info from environment variables; add `.env.example` documenting them.
- `dev` script (e.g. `tsx watch`) bound to a fixed local port distinct from `web`.

## 6. `apps/worker` — worker entrypoint

- Minimal Node/TypeScript process sharing the same codebase/tsconfig approach as `apps/api` per tech-stack.md's "api and worker share one codebase" rule — structure so future shared code lives in `/packages`, not duplicated between the two.
- Entrypoint boots, logs that it started, and idles/exits cleanly. No `node-cron` wiring yet (Phase 6) and no DB probe (per requirements.md decision 1).
- `start:worker` script distinct from `apps/api`'s `start:api`, per tech-stack.md's entrypoint-only distinction between the two.

## 7. Docker Compose for Postgres + pgvector

- `docker-compose.yml` at repo root with one `postgres` service using `pgvector/pgvector:pg16`.
- Named volume for data persistence across restarts.
- Exposes the standard Postgres port to localhost; credentials and DB name via `.env`/`.env.example`, matching what `apps/api`'s health check expects.
- Document the manual start step (`docker compose up -d`) since `pnpm dev` does not start Docker itself (see requirements.md context).

## 8. Wire `pnpm dev` end to end

- Root `pnpm dev` runs `turbo run dev` across `web`, `api`, and `worker` in parallel (persistent tasks, not cached).
- Confirm all three processes boot concurrently from a single command with Postgres already running via Docker Compose.

## 9. Manual verification pass

- Follow [validation.md](validation.md) top to bottom exactly as written, on a clean checkout, before calling the phase done.

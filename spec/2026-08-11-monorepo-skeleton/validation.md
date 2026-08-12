# Validation — Phase 0: Monorepo skeleton

How to confirm this phase is actually done and mergeable. Run on a clean checkout of the branch, not just in whatever state the working directory happens to be in.

## 1. Clean install works

```
pnpm install
```
Succeeds with no errors, using the Node version from `.nvmrc` (22 LTS).

## 2. Lint and format pass on an empty skeleton

```
pnpm lint
pnpm format -- --check
```
Both succeed with zero errors/warnings across all apps and packages, proving the shared config actually resolves from each workspace, not just the root.

## 3. Postgres + pgvector boots

```
docker compose up -d
docker compose ps
```
The `postgres` service (image `pgvector/pgvector:pg16`) is `healthy`/running.

## 4. All three processes boot together

```
pnpm dev
```
- `apps/web` serves its placeholder page on its configured port (visit it in a browser or `curl` it — 200 response).
- `apps/api` is listening on its configured port.
- `apps/worker` logs a startup line and stays running (or idles cleanly) without crashing.
- All three came up from this single command, no separate manual process launches.

## 5. API health check actually reaches Postgres

With `pnpm dev` and Docker Compose both running:

```
curl -i http://localhost:<api-port>/health
```
- Returns `200` with a body indicating the DB connection succeeded.
- Stop the `postgres` container (`docker compose stop postgres`), re-request `/health`, and confirm it now returns a `5xx` with a clear error body instead of hanging or crashing the API process. Restart Postgres afterward (`docker compose start postgres`) and confirm `/health` returns `200` again.

## 6. Web has no DB access

- Confirm `apps/web/package.json` has no `pg` or `prisma`/`@prisma/client` dependency.
- Grep `apps/web` for any Postgres connection string or `pg`/Prisma import — none should exist. All data access is meant to go through `apps/api` over HTTP from Phase 3 onward; this phase just confirms the boundary isn't violated at the skeleton level.

## 7. api/worker share code, don't fork it

- Confirm `apps/api` and `apps/worker` are driven by the same root `tsconfig`/build setup and differ only in their entrypoint script (`start:api` vs `start:worker`), not in duplicated config or a second copy of shared logic.

## 8. Repo layout matches tech-stack.md

- `/apps/web`, `/apps/api`, `/apps/worker` exist.
- `/packages/db`, `/packages/sources`, `/packages/ats`, `/packages/scoring`, `/packages/core`, `/packages/contracts` exist, each a valid (if empty) pnpm workspace package that `pnpm install` and `turbo run build` recognize.

## Definition of done

All 8 checks above pass on a clean checkout. This matches the roadmap's own done condition (`pnpm dev` boots all three processes and they can hit a Postgres health check) plus the additional guardrails from tech-stack.md's architectural rules that this phase must not silently violate (web/DB boundary, api/worker code sharing, strict TS, shared lint).

Once green, this phase is mergeable and Phase 1 (Core schema) can start.

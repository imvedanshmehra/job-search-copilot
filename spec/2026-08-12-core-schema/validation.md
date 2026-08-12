# Validation — Phase 1: Core schema

How to confirm this phase is actually done and mergeable. Run on a clean checkout of the branch, not just in whatever state the working directory happens to be in.

## 1. Clean install and generate still work

```
pnpm install
pnpm --filter @job-search-copilot/db exec prisma generate
```
Succeeds with no errors. (Adjust the package name to whatever `packages/db`'s `package.json` actually declares.)

## 2. Infra boots

```
docker compose up -d
docker compose ps
```
Both the `postgres` and the new `minio` services are `healthy`/running.

## 3. Migration applies cleanly to a fresh database

```
pnpm --filter @job-search-copilot/db exec prisma migrate reset --force
```
Runs against the empty Postgres container with no errors, applying all migrations from scratch — proves the migration history is self-contained and not dependent on manual DB state.

## 4. Schema matches requirements.md decisions

Inspect `packages/db/prisma/schema.prisma` (or `psql \d` against the running DB) and confirm:
- `User`, `Resume`, `ResumeVariant`, `SearchPreference`, `JobPosting`, `Match`, `Application` all exist.
- Every model except `JobPosting` has a `userId` column with a foreign key to `User`.
- `ResumeVariant` has a unique constraint on `(resumeId, label)`, and `label` is a plain string column (not an enum) — confirms variants aren't restricted to a fixed role set.
- `SearchPreference` has a unique constraint on `userId`.
- `JobPosting` has a unique constraint on `(source, externalId)`, and no `userId` column.
- `Match` has a unique constraint on `(userId, jobPostingId)`.
- `Application` has a unique constraint on `matchId`.
- `WorkMode`, `MatchStatus`, `ApplicationStatus` all exist as Postgres enum types with the values listed in plan.md.
- No `vector`-typed column exists anywhere yet (confirms decision 3 — deferred to Phase 8).

## 5. Seed script creates exactly one user, idempotently

```
pnpm db:seed
```
- Succeeds, and `SELECT * FROM "User";` shows exactly one row with the fixed, documented ID from plan.md §11.
- Run `pnpm db:seed` a second time without resetting the DB first — it succeeds again with no error and the `User` table still has exactly one row (same ID, not a duplicate).

## 6. Seeded user ID is discoverable for later phases

- The fixed literal ID used in `packages/db/prisma/seed.ts` is documented in a comment or a small exported constant, unambiguous enough that Phase 2 can copy it verbatim into `packages/core` without re-deriving it or querying the DB by hand.

## 7. No premature coupling

- Grep `apps/web`, `apps/api`, `apps/worker` for any import of `@prisma/client` or `packages/db` — none should exist yet. This phase only builds the schema and seed script; wiring it into the API is Phase 3+ (resume ingestion is the first consumer).
- `packages/core` and `packages/contracts` remain empty placeholders, untouched by this phase (still Phase 2 scope).

## 8. Repo-wide checks still pass

```
pnpm lint
pnpm format -- --check
pnpm build
```
All succeed across the whole workspace, including the newly non-empty `packages/db`.

## Definition of done

All 8 checks above pass on a clean checkout. This matches the roadmap's own done condition (tables exist, can be seeded by hand via a script, and the seed script creates the one MVP user row everything else points to) plus the schema-shape guardrails from requirements.md's decisions.

Once green, this phase is mergeable and Phase 2 (Shared contracts) can start.

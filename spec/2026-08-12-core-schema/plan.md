# Plan — Phase 1: Core schema

See [requirements.md](requirements.md) for scope and decisions. Task groups are meant to be done in order; each should leave the repo in a working state.

## 1. Prisma setup in `packages/db`

- Add `prisma`/`@prisma/client` as dependencies of `packages/db`.
- `prisma init` style scaffold: `packages/db/prisma/schema.prisma` with the Postgres datasource reading `DATABASE_URL` from env, and the Prisma client generator.
- `packages/db/src/index.ts` exports a singleton `PrismaClient` instance for `apps/api` and `apps/worker` to import (per tech-stack.md: `packages/db` owns "Prisma schema, migrations, repositories").
- Add root-level `.env.example` entries for `DATABASE_URL` (Postgres) if not already present from Phase 0.

## 2. `User` model

- Fields: `id` (`String @id @default(cuid())`), `email` (`String @unique`), `name` (`String?`), `createdAt`, `updatedAt`.
- No auth fields (password hash, sessions) — out of scope per mission.md.

## 3. Enums

Define in `schema.prisma`:
- `WorkMode`: `REMOTE`, `ON_SITE`, `HYBRID`.
- `MatchStatus`: `PENDING`, `APPROVED`, `REJECTED`.
- `ApplicationStatus`: `APPLIED`, `NO_RESPONSE`, `INTERVIEWING`, `REJECTED`, `OFFER`, `WITHDRAWN`.

## 4. `Resume` and `ResumeVariant` models

- `Resume`: `id`, `userId` (FK → `User`), `storageKey` (`String`), `originalFilename` (`String`), `mimeType` (`String`), `fileSizeBytes` (`Int`), `uploadedAt` (`DateTime`), `createdAt`, `updatedAt`. Index on `userId`.
- `ResumeVariant`: `id`, `userId` (FK → `User`), `resumeId` (FK → `Resume`, the master it was targeted from), `label` (`String`, free text — e.g. "Frontend", "Staff Backend"), `storageKey`, `originalFilename`, `mimeType`, `fileSizeBytes`, `uploadedAt`, `createdAt`, `updatedAt`. Unique constraint on `(resumeId, label)` — a master resume can't have two variants with the same name; no fixed role set, per requirements.md context.

## 5. `SearchPreference` model

- `id`, `userId` (FK → `User`, `@unique` — one preference row per user for MVP), `workModes` (`WorkMode[]`, Postgres array — a user may accept more than one mode), `payMin` (`Int?`), `payMax` (`Int?`), `payCurrency` (`String`, default `"USD"`), `locations` (`String[]`), `createdAt`, `updatedAt`.

## 6. `JobPosting` model

- No `userId` — shared/unscoped per tech-stack.md and requirements.md.
- Fields: `id`, `source` (`String`, adapter identifier e.g. `"greenhouse"`), `externalId` (`String`), `title`, `company`, `location` (`String?`), `workMode` (`WorkMode?`), `salaryMin` (`Int?`), `salaryMax` (`Int?`), `salaryCurrency` (`String?`), `url` (`String`), `description` (`String`, `@db.Text`), `postedAt` (`DateTime?`), `fetchedAt` (`DateTime`), `createdAt`, `updatedAt`.
- Unique constraint on `(source, externalId)` per requirements.md decision 2 — this is what Phase 6's worker dedup relies on.

## 7. `Match` model

- `id`, `userId` (FK → `User`), `jobPostingId` (FK → `JobPosting`), `resumeVariantId` (FK → `ResumeVariant`, the chosen variant), `score` (`Float`), `rationale` (`String`, `@db.Text`), `status` (`MatchStatus`, default `PENDING`), `createdAt`, `updatedAt`.
- Unique constraint on `(userId, jobPostingId)` — one match per user per posting.
- Indexes on `userId` and `status` (the review queue in Phase 9 will filter by both).

## 8. `Application` model

- `id`, `userId` (FK → `User`), `matchId` (FK → `Match`, `@unique` — one application per approved match), `status` (`ApplicationStatus`, default `APPLIED`), `appliedAt` (`DateTime?`, nullable until the user actually submits — covers the "manual apply" queue path from Phase 10), `createdAt`, `updatedAt`.

## 9. First migration

- Run `prisma migrate dev --name init` locally against the Phase 0 Docker Compose Postgres instance to generate `packages/db/prisma/migrations/`.
- Confirm the generated SQL matches the model list above (spot-check FKs, unique constraints, enum types).

## 10. MinIO service in Docker Compose

- Add a `minio` service to root `docker-compose.yml` (image `minio/minio`), with a named volume for persistence, exposing the API and console ports to localhost.
- Add `.env.example` entries for MinIO root user/password and the bucket name Phase 3 will use.
- Document the manual start step alongside the existing Postgres one (`docker compose up -d` already starts both once added).

## 11. Seed script

- `packages/db/prisma/seed.ts`: creates exactly one `User` row using a fixed, literal ID (a hardcoded UUID string, documented inline as "the MVP seeded user — Phase 2's `packages/core` constant must match this literal exactly").
- Wire `prisma`'s `seed` config in `packages/db/package.json` and a root script (e.g. `pnpm db:seed`) that runs it.
- Script is idempotent — re-running it against an already-seeded DB does not error or duplicate the row (upsert on the fixed ID).

## 12. Manual verification pass

- Follow [validation.md](validation.md) top to bottom exactly as written, on a clean checkout, before calling the phase done.

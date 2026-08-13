# Validation — Phase 2: Shared contracts

How to confirm this phase is actually done and mergeable. Run on a clean checkout of the branch, not just in whatever state the working directory happens to be in.

## 1. Clean install and build still work

```
pnpm install
pnpm --filter @job-search-copilot/contracts build
pnpm --filter @job-search-copilot/core build
```
Succeeds with no errors. (Adjust package names to whatever `packages/contracts` and `packages/core`'s `package.json` actually declare.)

## 2. Schemas match requirements.md decisions

Inspect `packages/contracts/src/` and confirm:
- One Zod schema exists for each of `Resume`, `ResumeVariant`, `SearchPreference`, `JobPosting`, `Match`, `Application` — no `User` schema (decision 3).
- Every `DateTime` field (`createdAt`, `updatedAt`, `uploadedAt`, `postedAt`, `fetchedAt`, `appliedAt`) uses `z.string().datetime()`, not `z.coerce.date()` or a bare `z.date()` (decision 4).
- `WorkModeSchema`, `MatchStatusSchema`, `ApplicationStatusSchema` values match `packages/db/prisma/schema.prisma`'s enums exactly, value-for-value (decision 5). Diff them side by side; this is the one place manual duplication can silently drift.
- `JobPosting`'s schema has no `userId` field; every other entity schema does.
- No request/response envelope schemas exist yet (e.g. no `CreateResumeRequest`) — only canonical entity schemas (decision 2).

## 3. `packages/core` re-exports, doesn't duplicate

- `packages/core/src/types.ts` (or equivalent) only re-exports `z.infer<>` types imported from `@job-search-copilot/contracts` — no independently hand-written interface duplicates a contracts schema's shape (decision 1).
- `packages/core` exports `MVP_USER_ID` and its value is byte-identical to the `MVP_USER_ID` literal in `packages/db/prisma/seed.ts` (`"00000000-0000-0000-0000-000000000001"`) — diff the two literals directly, don't eyeball it.

## 4. No Prisma dependency leak

```
grep -r "@prisma/client" packages/core/package.json packages/contracts/package.json
grep -r "@prisma/client" packages/core/src packages/contracts/src
```
Both return nothing. `packages/core` and `packages/contracts` must not depend on `@prisma/client`, directly or via source import (decision 1, tech-stack.md web boundary rule).

## 5. Type errors propagate across `web` and `api` (roadmap's done condition)

This is the roadmap's literal done condition for this phase — prove it, then leave no trace:

1. Temporarily add a one-line scratch file in each app, e.g. `apps/web/scratch-contract-check.ts` and `apps/api/scratch-contract-check.ts`, each importing the same entity type from `@job-search-copilot/core` (e.g. `import type { Match } from "@job-search-copilot/core";`) and using one field of it in a way that only type-checks if the shape is correct (e.g. `const s: Match["status"] = "PENDING";`).
2. Typecheck both apps (`pnpm --filter @job-search-copilot/web exec tsc --noEmit`, same for `api`) — both succeed.
3. Temporarily edit `MatchStatusSchema` in `packages/contracts` to remove `"PENDING"` from the enum (or otherwise break the shape both scratch files rely on) and rebuild `packages/contracts`.
4. Re-run both typechecks — both `web` and `api` now fail on the same underlying schema change, proving a single shared schema drives type errors in both consumers.
5. Revert the temporary schema edit and delete both scratch files. `git status` shows a clean tree before moving on — none of this is committed.

## 6. Workspace dependencies are wired but unused

- `apps/web/package.json` and `apps/api/package.json` both list `@job-search-copilot/core` and `@job-search-copilot/contracts` as dependencies.
- Grep `apps/web` and `apps/api` source (excluding the scratch files from check 5, which should no longer exist) for any import of `@job-search-copilot/core` or `@job-search-copilot/contracts` — none should exist yet. Actual usage is Phase 3+ (decision 6).
- `packages/db` is untouched by this phase — no changes to `packages/db/prisma/schema.prisma` beyond what Phase 1 already has.

## 7. Repo-wide checks still pass

```
pnpm lint
pnpm format -- --check
pnpm build
```
All succeed across the whole workspace, including the newly non-empty `packages/core` and `packages/contracts`.

## Definition of done

All 7 checks above pass on a clean checkout. This matches the roadmap's own done condition (web and api can both import the same schema for one entity and get type errors on mismatch) plus the shape/boundary guardrails from requirements.md's decisions.

Once green, this phase is mergeable and Phase 3 (Resume ingestion) can start.

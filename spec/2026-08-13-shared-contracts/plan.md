# Plan — Phase 2: Shared contracts

See [requirements.md](requirements.md) for scope and decisions. Task groups are meant to be done in order; each should leave the repo in a working state.

## 1. `zod` dependency in `packages/contracts`

- Add `zod` as a dependency of `packages/contracts` (`^3.x`).
- `packages/core` does not depend on `zod` directly for schema authoring — it only imports inferred types and schema values re-exported from `packages/contracts` — but does depend on `packages/contracts` as a workspace package (`workspace:*`).

## 2. Enums in `packages/contracts`

- `packages/contracts/src/enums.ts`:
  - `WorkModeSchema = z.enum(["REMOTE", "ON_SITE", "HYBRID"])`
  - `MatchStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"])`
  - `ApplicationStatusSchema = z.enum(["APPLIED", "NO_RESPONSE", "INTERVIEWING", "REJECTED", "OFFER", "WITHDRAWN"])`
  - Export each alongside its inferred type (`export type WorkMode = z.infer<typeof WorkModeSchema>`, etc.) — values must match `packages/db/prisma/schema.prisma` exactly, per requirements.md decision 5.

## 3. `Resume` and `ResumeVariant` schemas

- `packages/contracts/src/resume.ts`:
  - `ResumeSchema`: `id` (`z.string()`), `userId` (`z.string()`), `storageKey` (`z.string()`), `originalFilename` (`z.string()`), `mimeType` (`z.string()`), `fileSizeBytes` (`z.number().int().nonnegative()`), `uploadedAt` (`z.string().datetime()`), `createdAt`, `updatedAt` (`z.string().datetime()`).
  - `ResumeVariantSchema`: same file/meta fields as `Resume` plus `resumeId` (`z.string()`) and `label` (`z.string()`), no fixed enum per Phase 1 requirements.md.
  - Export inferred types alongside each schema (`export type Resume = z.infer<typeof ResumeSchema>`).

## 4. `SearchPreference` schema

- `packages/contracts/src/search-preference.ts`:
  - `id`, `userId` (`z.string()`), `workModes` (`z.array(WorkModeSchema)`), `payMin`, `payMax` (`z.number().int().nullable()`), `payCurrency` (`z.string()`), `locations` (`z.array(z.string())`), `createdAt`, `updatedAt`.

## 5. `JobPosting` schema

- `packages/contracts/src/job-posting.ts`:
  - `id`, `source` (`z.string()`), `externalId` (`z.string()`), `title`, `company` (`z.string()`), `location` (`z.string().nullable()`), `workMode` (`WorkModeSchema.nullable()`), `salaryMin`, `salaryMax` (`z.number().int().nullable()`), `salaryCurrency` (`z.string().nullable()`), `url` (`z.string().url()`), `description` (`z.string()`), `postedAt` (`z.string().datetime().nullable()`), `fetchedAt` (`z.string().datetime()`), `createdAt`, `updatedAt`.
  - No `userId` field — matches Phase 1's schema and tech-stack.md's multi-tenancy design.

## 6. `Match` schema

- `packages/contracts/src/match.ts`:
  - `id`, `userId`, `jobPostingId`, `resumeVariantId` (`z.string()`), `score` (`z.number()`), `rationale` (`z.string()`), `status` (`MatchStatusSchema`), `createdAt`, `updatedAt`.

## 7. `Application` schema

- `packages/contracts/src/application.ts`:
  - `id`, `userId`, `matchId` (`z.string()`), `status` (`ApplicationStatusSchema`), `appliedAt` (`z.string().datetime().nullable()`), `createdAt`, `updatedAt`.

## 8. `packages/contracts` barrel export

- `packages/contracts/src/index.ts` re-exports everything from `enums.ts`, `resume.ts`, `search-preference.ts`, `job-posting.ts`, `match.ts`, `application.ts` — this is the only import path consumers use (`@job-search-copilot/contracts`), not the individual files.

## 9. `packages/core`: re-exported types and `MVP_USER_ID`

- Add `packages/contracts` as a workspace dependency of `packages/core`.
- `packages/core/src/constants.ts`: `export const MVP_USER_ID = "00000000-0000-0000-0000-000000000001";` with a comment noting it must stay byte-identical to `packages/db/prisma/seed.ts`'s literal (Phase 1 requirements.md decision 5).
- `packages/core/src/types.ts`: re-export the `z.infer` types from `@job-search-copilot/contracts` for each entity and enum (`Resume`, `ResumeVariant`, `SearchPreference`, `JobPosting`, `Match`, `Application`, `WorkMode`, `MatchStatus`, `ApplicationStatus`) — no independently hand-written interfaces, per requirements.md decision 1.
- `packages/core/src/index.ts` re-exports `constants.ts` and `types.ts`.

## 10. Wire workspace dependencies into `apps/web` and `apps/api`

- Add `@job-search-copilot/core` and `@job-search-copilot/contracts` (`workspace:*`) as dependencies in `apps/web/package.json` and `apps/api/package.json`.
- `pnpm install` at the root so the workspace links resolve.
- No import of either package in `apps/web` or `apps/api` source yet — per requirements.md decision 6, actual usage starts in Phase 3.

## 11. Manual verification pass

- Follow [validation.md](validation.md) top to bottom exactly as written, on a clean checkout, before calling the phase done.

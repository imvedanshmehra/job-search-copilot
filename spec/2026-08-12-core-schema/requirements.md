# Requirements — Phase 1: Core schema

## Scope

Roadmap phase: [Phase 1 — Core schema](../roadmap.md#mvp).

Prisma schema (in `packages/db`) for the core entities: `User`, `Resume`, `ResumeVariant`, `SearchPreference`, `JobPosting`, `Match`, `Application`. Every entity except `JobPosting` carries a `userId` foreign key from this phase on, per [tech-stack.md](../tech-stack.md#designing-for-future-multi-tenancy-without-building-it). Migrations run locally via `prisma migrate dev`.

_Done when (from roadmap.md):_ tables exist, can be seeded by hand via a script, and the seed script creates the one MVP user row everything else points to.

No API routes, no business logic, no scoring, no file upload handling — those are Phase 2 onward. This phase only defines and migrates the schema, plus the seed script.

## Out of scope for this phase

- `packages/core` shared types and `packages/contracts` Zod schemas that mirror this schema (Phase 2).
- Any API endpoint that reads or writes these tables (Phase 3+).
- Actual file upload handling / talking to object storage (Phase 3) — this phase only adds the `storageKey` column shape that Phase 3 will populate.
- Vector/embedding columns for `pgvector` similarity search (Phase 8) — deferred per decision 3 below.
- Any prefilter or LLM scoring logic (Phase 7/8) — `Match.score` and `Match.rationale` exist as columns only.
- Playwright/apply-handoff logic (Phase 10) — `Application` exists as a table only.
- Auth of any kind — out of scope for the whole MVP per [mission.md](../mission.md).
- Enforcing the "up to 3 variants per resume" count — that's a Phase 3 application-level rule, not a schema constraint (see context below).

## Decisions

Resolved in scoping conversation with the user (2026-08-12):

1. **Resume/ResumeVariant storage: S3-compatible object storage, backed by MinIO via Docker Compose.** `Resume` and `ResumeVariant` store a `storageKey` (string) pointing at an object in a bucket, not file bytes in Postgres and not a bare local filesystem path. MinIO is added to `docker-compose.yml` alongside Postgres so local/single-VPS deployment stays self-hosted with no external account or cost, consistent with mission.md's local-first framing. Phase 3 implements the actual upload/put-object flow against this; Phase 1 only adds the schema column and the MinIO service. Promoted to a stack-wide choice in [tech-stack.md](../tech-stack.md) (Object storage row) since it applies beyond this phase — Phase 3's upload flow must proxy through the API rather than handing the browser direct MinIO credentials, per tech-stack.md's updated web/DB boundary rule.
2. **JobPosting dedup key: composite unique constraint on `(source, externalId)`.** Each source adapter (Phase 5+) is expected to supply a stable external ID from its origin (e.g. a Greenhouse job ID). This survives URL or title changes at the source and is more robust than hashing content or trusting URL uniqueness. `externalId` is a required string. Promoted to an architectural rule in [tech-stack.md](../tech-stack.md) ("One adapter, one interface") since every future source adapter (Phase 5, 12) must honor this contract, not just this phase's schema.
3. **No `pgvector` columns in this phase.** Phase 1 is pure structural schema per roadmap.md ("no business logic yet — just shapes" is Phase 2's framing, and Phase 1 itself only asks for tables and a seed script). Embedding columns are added in Phase 8 when LLM scoring actually needs them, avoiding speculative schema per tech-stack.md's stance against premature abstraction. Prisma has no native `vector` type, so that phase will need a raw-SQL migration addition regardless of when the column lands — no benefit to doing it early.
4. **`Match` and `Application` status enums are defined in full now**, not incrementally:
   - `MatchStatus`: `PENDING`, `APPROVED`, `REJECTED` — all three are needed by Phase 9's approve/reject queue.
   - `ApplicationStatus`: `APPLIED`, `NO_RESPONSE`, `INTERVIEWING`, `REJECTED`, `OFFER`, `WITHDRAWN` — covers the "applied, no response, rejected, interview, etc." set named in roadmap Phase 11, plus `OFFER`/`WITHDRAWN` as the natural remaining terminal states so Phase 11 doesn't need an enum migration.
   Defining these now is a cheap, low-risk addition to a `CREATE TYPE` statement; deferring only buys a later migration for no benefit.
5. **Seeded MVP user gets a fixed, documented ID.** `packages/core` (which will own the shared "current user" constant per tech-stack.md) doesn't exist until Phase 2. The Phase 1 seed script creates exactly one `User` row with a fixed, hardcoded ID (a literal UUID checked into the seed script and documented in this spec — see plan.md). Phase 2 imports that same literal into `packages/core` rather than generating a new one, so the seeded row and the future shared constant never drift apart.
6. **Primary keys use `cuid()`.** Prisma-idiomatic default, no extra Postgres extension required (unlike `uuid_generate_v4()`), sortable-ish for debugging. Not specified in tech-stack.md, so recorded here as a default rather than a deviation.

## Context

- Builds directly on Phase 0 (merged) — `packages/db` currently has only a placeholder `index.ts`; this phase adds `packages/db/prisma/schema.prisma`, migrations, and a seed script.
- Per tech-stack.md: "No native `vector` type support — use raw SQL / `$queryRaw` / TypedSQL for `pgvector` columns and queries" — relevant once Phase 8 adds embeddings, not this phase (see decision 3).
- Per tech-stack.md's multi-tenancy section: every entity except `JobPosting` gets `userId` from this phase on, even though MVP hardcodes a single user. `JobPosting` and source-fetched data stay unscoped/shared.
- Per mission.md: MVP is single-user, local-first. `SearchPreference` is scoped one-per-user for MVP (unique on `userId`) — the roadmap and mission describe one set of filters per user, not multiple saved presets.
- `ResumeVariant.label` is free-text (`String`), not a fixed enum. Roadmap Phase 3's "up to 3 targeted variants (frontend/backend/full-stack)" is an example set, not an exhaustive one — the user should be able to name variants however fits their search (e.g. "Staff Backend", "Resume Variant 2"). Uniqueness is enforced per `(resumeId, label)` so two variants of the same master resume can't share a name; the "up to 3" count is a Phase 3 application-level rule, not a schema constraint (Postgres has no declarative max-row-count-per-group constraint without a trigger, which is more machinery than this needs).
- `Match` is constrained to one row per `(userId, jobPostingId)` — the scorer (Phase 8) picks the single best resume variant per posting per user, not multiple competing matches for the same posting.
- `Application` links 1:1 to the `Match` it originated from (unique `matchId`), reflecting Phase 10's "on approval, ... apply handoff" flow — an application only exists once a match has been approved.

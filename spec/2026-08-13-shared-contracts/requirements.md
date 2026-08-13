# Requirements — Phase 2: Shared contracts

## Scope

Roadmap phase: [Phase 2 — Shared contracts](../roadmap.md#mvp).

`packages/core` (shared types) and `packages/contracts` (Zod schemas) for the entities defined in Phase 1's schema: `Resume`, `ResumeVariant`, `SearchPreference`, `JobPosting`, `Match`, `Application`. No business logic yet — just shapes.

*Done when (from roadmap.md):* web and api can both import the same schema for one entity and get type errors on mismatch.

## Out of scope for this phase

- Any API endpoint that reads or writes these entities (Phase 3+).
- Request/response envelope schemas for specific endpoints (e.g. `CreateResumeRequest`) — added incrementally as each endpoint is built, per decision 2 below.
- A `User` entity schema/type — per decision 3, only the `MVP_USER_ID` constant is exported.
- File upload handling, resume ingestion UI (Phase 3).
- Normalization utilities for source adapters — `packages/core`'s "normalization utils" (per tech-stack.md's repo layout) come online once a producer of unnormalized data exists (Phase 5).
- Prefilter/scoring logic (Phase 7/8).



## Decisions

Resolved in scoping conversation with the user (2026-08-13):

1. `packages/contracts` **is the source of truth;** `packages/core` **re-exports.** Each entity gets exactly one Zod schema, defined in `packages/contracts`. `packages/core` does not hand-write parallel TS interfaces — it imports the Zod schemas from `packages/contracts` and re-exports `z.infer<>` types, so there is exactly one place a shape change has to happen. Neither package depends on `@prisma/client` — schema shapes are hand-mirrored from `packages/db/prisma/schema.prisma`, not generated from it, so that `apps/web` (which must never gain a DB dependency, per tech-stack.md's web boundary rule) can safely import both.
2. **Contracts cover canonical entity shapes only, not request/response envelopes.** One schema per entity, matching roadmap.md's "no business logic yet — just shapes" framing and its done condition (import the same schema for *one entity*). Endpoint-specific request/response schemas (e.g. a `CreateResumeRequest` that omits server-generated fields) are added in the phase that builds that endpoint, when the actual shape divergence from the entity — which fields are client-supplied vs. server-assigned — is concrete rather than speculative.
3. **No** `User` **schema/type — only the** `MVP_USER_ID` **constant.** MVP hardcodes a single user (per mission.md, tech-stack.md) and no phase before Phase 16 (multi-tenancy) reads or writes a `User` shape over a process boundary. `packages/core` exports `MVP_USER_ID`, copied verbatim from `packages/db/prisma/seed.ts`'s `MVP_USER_ID` literal (`"00000000-0000-0000-0000-000000000001"`), per Phase 1 requirements.md decision 5. A full `User` contract is deferred to whichever phase first needs to move a `User` shape across a process boundary.
4. **DateTime fields are ISO strings, not coerced** `Date` **objects.** Every `DateTime` column (`createdAt`, `updatedAt`, `uploadedAt`, `postedAt`, `fetchedAt`, `appliedAt`) is `z.string().datetime()` in the contract schema — this is what actually crosses the wire in JSON, with no implicit coercion at the validation boundary. Consumers (Phase 3+) parse into `Date` at the point of use, not at the contract layer.
5. **Enums are hand-declared with** `z.enum`**, matching Prisma's enum values exactly, and are not imported from** `@prisma/client`**.** `WorkMode`, `MatchStatus`, `ApplicationStatus` get `z.enum([...])` definitions in `packages/contracts` with the same string values as `packages/db/prisma/schema.prisma`. This duplicates the value list once — `schema.prisma` is unaffected, Prisma keeps generating its own enum types for `packages/db`'s internal use — in exchange for keeping `packages/core` and `packages/contracts` free of a `@prisma/client` dependency. Keeping the two lists in sync is a manual discipline for now (checked in validation.md); a codegen step to derive one from the other is a premature abstraction for a 3-enum surface at this stage.
6. `apps/web` **and** `apps/api` **get** `packages/contracts` **and** `packages/core` **as workspace dependencies, but no usage code yet.** Wiring the dependency (package.json entries, install resolves) happens in this phase so the import path exists; actually importing and using a schema in a route handler or a page is Phase 3+ business logic. The roadmap's done condition ("web and api can both import the same schema... and get type errors on mismatch") is proven via a temporary, non-committed scratch check during validation (see validation.md), not via permanent code — that keeps this phase's diff to "just shapes" as roadmap.md specifies, while still concretely proving the capability end to end before merging.



## Context

- Per tech-stack.md's repo layout: `/core` is "Shared types, Zod schemas, normalization utils" and `/contracts` is "Zod schemas for every API request/response, shared by web and api" — decision 1 resolves the apparent overlap. `contracts` holds the canonical per-entity Zod schemas (and, from Phase 3 on, endpoint request/response schemas); `core` holds the TS types inferred from them plus cross-cutting shared values (enum types, `MVP_USER_ID`), and will hold normalization utilities once Phase 5 needs them.
- Per tech-stack.md's web/DB boundary rule: `apps/web` must never gain a `@prisma/client` or Postgres dependency, directly or transitively — this is why decision 1 rules out importing Prisma-generated types into `packages/core` or `packages/contracts`.
- The six entities in scope, matching Phase 1's schema and excluding `User` per decision 3: `Resume`, `ResumeVariant`, `SearchPreference`, `JobPosting`, `Match`, `Application`.
- `JobPosting` remains the one entity with no `userId` field, consistent with tech-stack.md's multi-tenancy design and Phase 1's schema.


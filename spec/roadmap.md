# Roadmap

High-level implementation order. Each phase is small on purpose — a phase should be shippable and demoable on its own before the next one starts. Don't start a phase until the previous one's "done" bullet is true.

## MVP

**Phase 0 — Monorepo skeleton**
Set up pnpm workspaces + Turborepo, the `/apps` and `/packages` folders from [tech-stack.md](tech-stack.md), empty Next.js/Express/worker entrypoints, and Docker Compose for Postgres + pgvector.
_Done when:_ `pnpm dev` boots all three processes and they can hit a Postgres health check.

**Phase 1 — Core schema**
Prisma schema for the core entities: `User` (single seeded row for MVP), `Resume`, `ResumeVariant`, `SearchPreference`, `JobPosting`, `Match`, `Application`. Every entity except `JobPosting` carries a `userId` foreign key from this phase on — see [tech-stack.md](tech-stack.md#designing-for-future-multi-tenancy-without-building-it). Migrations run locally.
_Done when:_ tables exist, can be seeded by hand via a script, and the seed script creates the one MVP user row everything else points to.

**Phase 2 — Shared contracts**
`packages/core` (shared types) and `packages/contracts` (Zod schemas) for the entities above. No business logic yet — just shapes.
_Done when:_ web and api can both import the same schema for one entity and get type errors on mismatch.

**Phase 3 — Resume ingestion**
API endpoint + minimal web page to upload a master resume and up to 3 targeted variants (frontend/backend/full-stack), store them, list them back.
_Done when:_ user can upload 4 files and see them listed in the UI.

**Phase 4 — Search preferences**
API endpoints + a settings page for the user's filters: target roles/keywords (what to search for — e.g. "senior frontend engineer", "staff backend engineer"), work mode (remote/on-site/hybrid), pay range, location(s), and any other prefilter-relevant criteria. Stored in `SearchPreference`, not hardcoded.
_Done when:_ user can set and save filters, including at least one target role, in the UI and read them back after a reload.

**Phase 5 — First job source adapter**
One adapter in `packages/sources` (pick the simplest public source with a queryable API, e.g. a Greenhouse job board search endpoint) that takes the user's target roles as a query, fetches, and normalizes only the matching postings into the `JobPosting` schema. No scheduling yet — runs from a script.
_Done when:_ running the adapter manually with a target role inserts only role-matching normalized postings into the DB — not the source's full listing.

**Phase 6 — Worker scheduling**
`node-cron` in `apps/worker` runs the Phase 5 adapter hourly, passing it the user's current target roles from `SearchPreference`. Dedupes postings already seen.
_Done when:_ leaving the worker running for a few hours produces new, role-matching postings without duplicates.

**Phase 7 — Prefilter rules**
Cheap rule-based filter in `packages/scoring` that reads the user's `SearchPreference` (Phase 4) — work mode, pay, location, since role relevance was already applied at fetch time in Phase 5/6 — plus baseline sanity rules (seniority, etc.) and runs on every new posting before anything touches the LLM.
_Done when:_ a posting that fails the user's own filters (e.g. wrong work mode) is dropped before scoring, and this is visible in a log or flag on the record.

**Phase 8 — LLM scoring**
LLM scoring step in `packages/scoring`: for postings that survive the prefilter, score against each resume variant, pick the best match, store a `Match` with a rationale.
_Done when:_ a `Match` row exists with a score, a chosen resume variant, and a human-readable reason.

**Phase 9 — Review queue UI**
Web page listing pending matches (posting + matched variant + rationale), with approve/reject actions wired to the API.
_Done when:_ user can see a match, approve or reject it, and the queue reflects that decision.

**Phase 10 — Apply handoff**
On approval, Playwright opens a headed browser session on the posting's application page and pre-fills what it can from the matched resume variant. For unsupported ATS platforms (Workday/Taleo/iCIMS), the queue instead shows "manual apply" with a deep link.
_Done when:_ approving a supported posting opens a pre-filled form for the user to finish and submit by hand.

**Phase 11 — Application status tracking**
Track and display status per application (applied, no response, rejected, interview, etc.), updated manually by the user for MVP.
_Done when:_ user can set and see a status per application in the UI.

This is the MVP line. Everything below is explicitly post-MVP and should not be pulled forward without revisiting [mission.md](mission.md).

## Post-MVP

**Phase 12 — More sources**
Add a second and third source adapter using the Phase 5 interface.

**Phase 13 — ATS adapters**
Real adapters in `packages/ats` for supported ATS platforms beyond deep-linking, so more postings become auto-fillable in Phase 10's flow.

**Phase 14 — Hardening**
Structured logging, retries/backoff on fetchers, error surfacing in the UI instead of silent worker failures.

**Phase 15 — Match quality feedback loop**
Feed approve/reject decisions back into prefilter rules or scoring prompts to reduce queue noise over time.

**Phase 16 — Multi-tenancy**
Only once the single-user product has proven the matching is worth paying for: replace the hardcoded MVP user with real accounts and auth (e.g. NextAuth/Clerk), enforce the `userId` scoping already present since Phase 1 at the API layer per-session instead of per-constant, and add whatever billing/plan model the product needs at that point. This phase should be additive against the existing schema, not a migration of it.

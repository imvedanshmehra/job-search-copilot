# Tech stack

This is a constitution, not a suggestion list. Deviating from a choice here is an architectural decision and should be discussed before code is written, not decided ad hoc in a PR.

## Choices and rationale

| Concern    | Choice                          | Why                                                                                                                                                 |
| ---------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework  | Next.js 15, App Router          | Server Actions for mutations; RSC for the queue views. The web app is UI only — see boundary rule below.                                            |
| Language   | TypeScript, `strict: true`      | No `any` in committed code. Untyped boundaries (LLM output, external HTTP) get validated into types via Zod, not cast.                              |
| DB         | Postgres 16 + `pgvector`        | One database. Docker Compose for local. `pgvector` for resume/JD embedding similarity search. Core tables carry `userId` from day one — see below.  |
| ORM        | Prisma                          | Type-safe schema and migrations. No native `vector` type support — use raw SQL / `$queryRaw` / TypedSQL for `pgvector` columns and queries. Primary keys use `cuid()` — Prisma-idiomatic default, no extra Postgres extension required. |
| Object storage | MinIO (S3-compatible), via Docker Compose | Resume/resume-variant files live outside Postgres. Self-hosted MinIO keeps local/single-VPS deployment free of an external account or cost, consistent with the local-first MVP. Code is written against the S3 API, so a hosted-SaaS future can point at real AWS S3 without a rewrite — same interface, different endpoint/credentials. |
| Validation | Zod                             | Every external boundary: API responses, LLM output, form input. If data crosses a process boundary, it goes through a Zod schema.                   |
| LLM        | `@anthropic-ai/sdk`             | Two-stage: cheap rule-based prefilter first, LLM scoring only on survivors.                                                                         |
| Browser    | Playwright                      | Headed by default, not headless — the user is meant to see and finish the application, not have it happen invisibly.                                |
| Backend    | Node + Express, separate app    | Owns all DB access and business logic. The web app never touches Postgres directly.                                                                 |
| Scheduling | `node-cron` in a worker process | Shares the backend codebase, separate entry point. Do NOT use Vercel cron or Next.js route handlers — scheduling must not depend on the web deploy. |
| Styling    | Tailwind + shadcn/ui            | The queue UI is a tool, not a showcase — keep it dense and keyboard-driven.                                                                         |
| Testing    | Vitest + Playwright test        | Fixture-based tests for source/ATS parsers — these break silently when a site changes markup, so fixtures need to catch that.                       |

## Repo layout

```
/apps
  /web          Next.js: UI only. No DB client, no LLM calls. Talks to /api over HTTP.
  /api          Express: REST API, auth boundary, all business logic
  /worker       Node: cron, fetchers, scorer, Playwright runner
/packages
  /db           Prisma schema, migrations, repositories
  /sources      One adapter per job source, common interface
  /ats          One adapter per ATS, common interface
  /scoring      Prefilter rules + LLM scoring
  /core         Shared types, Zod schemas, normalization utils
  /contracts    Zod schemas for every API request/response, shared by web and api
```

Monorepo via pnpm workspaces + Turborepo. Three deployable processes: `web`, `api`, `worker`.

## Designing for future multi-tenancy without building it

MVP is single-user and ships with no auth system. But [mission.md](mission.md) treats a future hosted, multi-user version as a real possibility, so MVP's job is to not paint that into a corner:

- **Every core entity (**`Resume`**,** `ResumeVariant`**,** `SearchPreference`**,** `JobPosting` **ownership records,** `Match`**,** `Application`**) gets a** `userId` **column from the Phase 1 schema onward**, even though MVP only ever has one seeded `User` row and the API hardcodes that user. Adding real accounts later becomes "add auth, stop hardcoding the id," not "add a column to every table and backfill it."
- **Every API route already scopes queries by** `userId`, read from a single hardcoded constant in MVP instead of a session. This keeps the scoping logic exercised from day one instead of retrofitted alongside a first real auth system.
- `JobPosting` **and source-fetched data stay unscoped/shared** — postings are the same for everyone, so don't scope those by user; only preferences, resumes, matches, and applications are per-user.
- Don't build auth, sessions, billing, or a plan/tier model now. Don't add a library like NextAuth/Clerk until there's a second real user. Speculative auth code is exactly the kind of premature abstraction this project avoids elsewhere.

## Architectural rules

- `api` **and** `worker` **share one codebase and Dockerfile**, differing only in entrypoint (`npm run start:api` vs `npm run start:worker`). They are separate _processes_, not separate _projects_ — a 40-second Playwright session must not sit on the API event loop, and the two scale differently. Don't fork logic between them; share it through `/packages`.
- `web` **gets no database or object storage credentials.** Every read and write — including resume file uploads — goes through the API, which proxies to Postgres and MinIO. This is what makes the auth boundary real if/when multi-user ever happens — if the browser or RSCs can talk to Postgres or MinIO directly, there are two places to enforce scoping and one will be forgotten. Don't add a Postgres client or an S3 client to `apps/web`, and don't hand out pre-signed upload URLs to the browser for "just this one upload."
- **Types flow through** `packages/contracts`**.** The API validates incoming requests against the same Zod schemas the web app uses to type its fetch calls. No duck-typed API responses.
- **No tRPC.** A plain REST surface with shared Zod contracts stays easy to expose to a second client (desktop app, CLI) later. Don't introduce an RPC layer that couples the client to the server's function signatures.
- **One adapter, one interface.** Every job source and every ATS implements a common interface in `packages/sources` / `packages/ats` respectively. Adding a new source/ATS should never require touching the worker's scheduling or scoring logic. Every source adapter must supply a stable `externalId` per posting (e.g. a Greenhouse job ID) — `JobPosting` dedups on `(source, externalId)`, which survives URL or title changes at the source in a way that content hashing or URL uniqueness don't.
- **Prefilter before LLM, always.** Scoring a posting with the LLM is the expensive step in the pipeline. Nothing reaches the scorer without passing the cheap rule-based prefilter first.
- **User filters are data, not code.** Work mode (remote/on-site/hybrid), pay range, location(s), and similar search preferences are stored per-user in a `SearchPreference` table (`packages/db`) and read by the prefilter at run time. They are never hardcoded constants in `packages/scoring` — a user changing a filter in the UI must not require a deploy.

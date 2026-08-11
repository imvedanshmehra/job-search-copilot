# Job Search Co-Pilot

## Product summary

A job search assistant that:

1. Polls job sources hourly and normalizes postings into one schema.
2. Filters them with cheap rules, then scores survivors with an LLM against a master resume.
3. Presents a **review queue** where the user approves or rejects each application.
4. On approval, opens a pre-filled application form in a browser session for final human submit.
5. Tracks application status over time.

**The system never submits an application without an explicit human click.** This is a product decision, not a temporary limitation. Do not build an "autopilot" toggle.

### Non-goals for MVP

- No LinkedIn scraping or automated LinkedIn interaction of any kind (ToS violation, account-ban risk).
- No CAPTCHA solving or bot-detection evasion. When a CAPTCHA appears, hand control to the human.
- No multi-user support, auth, or tenancy. Single user, runs locally or on one small VPS.
- No Workday / Taleo / iCIMS adapters. Those postings go to the queue as "manual apply" with a deep link.
- No cover letter generation. Later.
- No mobile app.

---

## 1. Stack

| Concern    | Choice                          | Notes                                                                                                                      |
| ---------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Framework  | Next.js 15, App Router          | Server Actions for mutations; RSC for the queue views                                                                      |
| Language   | TypeScript, `strict: true`      | No `any` in committed code                                                                                                 |
| DB         | Postgres 16 + `pgvector`        | Docker Compose for local                                                                                                   |
| ORM        | Prisma                          | Type-safe schema and migrations. No native `vector` type support — use raw SQL/TypedSQL for `pgvector` columns and queries |
| Validation | Zod                             | Every external boundary: API responses, LLM output, form input                                                             |
| LLM        | `@anthropic-ai/sdk`             | Two-stage                                                                                                                  |
| Browser    | Playwright                      | Headed by default, not headless                                                                                            |
| Backend    | Node + Express, separate app    | Owns all DB access and business logic; the web app never touches Postgres directly                                         |
| Scheduling | `node-cron` in a worker process | Shares the backend codebase, separate entry point. Do NOT use Vercel cron or Next.js route handlers                        |
| Styling    | Tailwind + shadcn/ui            | Queue UI is a tool, not a showcase — keep it dense and keyboard-driven                                                     |
| Testing    | Vitest + Playwright test        | Fixture-based tests for parsers (see §4)                                                                                   |

### Repo layout

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

Monorepo via pnpm workspaces + Turborepo. Three deployable processes.

`api` **and** `worker` **share the same codebase and Dockerfile, differing only in entrypoint** (`npm run start:api` vs `npm run start:worker`). They are separate processes because a 40-second Playwright session must not sit on the API event loop, and because they scale differently — but they are not separate projects.

`web` **gets no database credentials.** Every read and write goes through the API. This is the constraint that makes the auth boundary real later; if the Next.js server components can query Postgres directly, you will have two places to enforce user scoping and one of them will be forgotten.

Types flow through `packages/contracts` — the API validates incoming requests against the same Zod schemas the web app uses to type its fetch calls. Do not use tRPC here; a plain REST surface with shared Zod contracts is easier to expose to a second client (a desktop app, a CLI) later.

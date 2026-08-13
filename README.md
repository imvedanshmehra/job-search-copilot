# Job Search Co-Pilot

A job search assistant that polls job boards hourly, matches postings against your resume variants (frontend / backend / full-stack) using cheap rules plus an LLM, and puts good matches in a review queue. You approve or reject; approval opens a pre-filled application for you to review and submit yourself.

**The system never submits an application without an explicit human click.** No autopilot toggle, no exceptions.

## Docs

The `/spec` directory is the project constitution — read it before making product or architecture decisions:

- [spec/mission.md](spec/mission.md) — the problem, who it's for, non-negotiable principles, non-goals.
- [spec/tech-stack.md](spec/tech-stack.md) — stack choices with rationale, repo layout, architectural rules.
- [spec/roadmap.md](spec/roadmap.md) — implementation order, in small shippable phases.

## Status

Phase 0 (monorepo skeleton) complete. Following the phases in [spec/roadmap.md](spec/roadmap.md).

## Local development

Requires Node 22 (see `.nvmrc`) and pnpm.

```sh
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp packages/db/.env.example packages/db/.env

pnpm install

# Start Postgres + pgvector and MinIO (not started automatically by `pnpm dev`)
docker compose up -d

# Apply migrations, then seed the one MVP user row
pnpm --filter @job-search-copilot/db exec prisma migrate deploy
pnpm db:seed

# Boots web (:3000), api (:3001), and worker together
pnpm dev
```

- `apps/web` — http://localhost:3000
- `apps/api` — http://localhost:3001/health
- MinIO console — http://localhost:9001 (API on :9000)

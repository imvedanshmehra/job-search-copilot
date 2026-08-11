# Job Search Co-Pilot

A job search assistant that polls job boards hourly, matches postings against your resume variants (frontend / backend / full-stack) using cheap rules plus an LLM, and puts good matches in a review queue. You approve or reject; approval opens a pre-filled application for you to review and submit yourself.

**The system never submits an application without an explicit human click.** No autopilot toggle, no exceptions.

## Docs

The `/spec` directory is the project constitution — read it before making product or architecture decisions:

- [spec/mission.md](spec/mission.md) — the problem, who it's for, non-negotiable principles, non-goals.
- [spec/tech-stack.md](spec/tech-stack.md) — stack choices with rationale, repo layout, architectural rules.
- [spec/roadmap.md](spec/roadmap.md) — implementation order, in small shippable phases.

## Status

Pre-implementation. Following the phases in [spec/roadmap.md](spec/roadmap.md), starting from Phase 0 (monorepo skeleton).

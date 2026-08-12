# Mission

## Problem

Applying to jobs well takes two things that don't scale together: broad coverage of postings, and a resume tailored to each one. Doing both by hand means either you apply to few jobs carefully, or many jobs sloppily. Job Search Co-Pilot removes the coverage/tailoring tradeoff by automating the parts that don't need judgment — finding postings, matching them to the right resume variant — while keeping the parts that do need judgment — deciding to apply, and the final submit — in the user's hands.

## Who this is for

A job-seeker who already has a master resume and has (or is willing to produce) role-targeted variants of it — e.g. frontend, backend, full-stack. Not a recruiting tool, not a resume-writing tool.

MVP ships as a single-user, local-first tool. The product direction is to open this up to multiple users as a hosted SaaS if the single-user version proves the matching is good enough to be worth paying for — so the data model and service boundaries are built to make that transition additive, not a rewrite, even though auth, billing, and tenancy are explicitly out of scope for MVP. See [tech-stack.md](tech-stack.md) for how.

## What the system does

1. Ingests one master resume plus a small set of targeted variants (e.g. frontend / backend / full-stack).
2. Takes user-set search preferences — work mode (remote / on-site / hybrid), pay range, location(s), and similar filters — that scope what's worth scoring at all.
3. Polls job sources on a schedule and normalizes postings into one schema.
4. Filters cheaply with rules (including the user's search preferences), then scores survivors with an LLM against each resume variant to find the best match.
5. Surfaces matches in a review queue for the user to approve or reject.
6. On approval, opens a pre-filled application in a browser session for the human to review and submit.
7. Tracks application status over time.

## Non-negotiable principles

These are product decisions, not temporary limitations. Changing any of them is a mission change, not a feature request.

- **A human clicks submit. Always.** The system prepares and pre-fills; it never has credentials or capability to submit an application itself. No "autopilot" toggle, no exceptions for "trusted" sources.
- **No ToS-risking automation.** No LinkedIn scraping or automated LinkedIn interaction. No CAPTCHA solving or bot-detection evasion — when one appears, hand control to the human.
- **Match quality over volume.** A smaller number of well-matched suggestions beats a flooded queue. The prefilter, the user's own filters, and the scorer all exist to protect the user's review time, not to maximize postings ingested.
- **Single user for MVP; multi-tenant-ready underneath.** No auth system, no billing, no tenancy _built_ for MVP — it runs locally or on one small VPS for one person. But don't design MVP data or service boundaries in a way that a second user later requires a migration instead of a feature flag. See [tech-stack.md](tech-stack.md).
- **The queue is a tool, not a feed.** Optimize for a user scanning and deciding quickly, not for engagement.

## Non-goals (MVP)

- No LinkedIn scraping or automated LinkedIn interaction of any kind.
- No CAPTCHA solving or bot-detection evasion.
- No auth, billing, or tenancy _built_ — MVP runs as one seeded user. (The data model still avoids closing this door — see [tech-stack.md](tech-stack.md).)
- No Workday / Taleo / iCIMS adapters — those postings go to the queue as "manual apply" with a deep link.
- No cover letter generation.
- No mobile app.

## What success looks like

- The user checks one queue instead of five job boards.
- The queue only shows jobs that fit both the user's stated filters (work mode, pay, location) and the resume match — not just keyword hits.
- Every suggestion in the queue names _which_ resume variant it matched and _why_, well enough that approve/reject is a fast decision.
- Time from "job posted" to "user notified of a good match" is close to the polling interval (≤ 1 hour), not days.
- The user never has to wonder whether the system applied to something without them.
- If this becomes a hosted product, turning on a second account doesn't require redesigning the schema or the API.

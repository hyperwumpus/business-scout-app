# Scouter v3.5 — Visor Build

A standalone, local-first web app for the Scouter workflow: turn a local-business
observation into a trustworthy Target Card, decide whether to pursue it, draft
honest outreach, and track quotes → payments → expenses per lead — with a Day-7
review that tests whether structured scouting beats random prospecting.

Fusion of two designs: Friday's V1 (visor identity, explained Opportunity Score,
core loop, commercial layer) + the Aspen validation direction (Fact/Signal/
Hypothesis/Unknown evidence, pursuit decisions with kill criteria, time/friction
logging). Full design spec: `../scouter-import/SCOUTER-V3.5-PLAN.md`.

## Run it

**Double-click `scouter-v3-5.html`** — it opens in your browser. No build step, no
server, no install. Everything (CSS + JS) is inline in the one file.

Internet is only needed for the Google Font; the app works fully offline with a
system-font fallback.

## Your data

- All state lives in your browser's **localStorage** (key `scouter35_v1`).
- **Back up with EXPORT BACKUP** (top bar) — downloads a dated JSON file.
  Import it back with IMPORT. Do this before any big change.
- Backup discipline: the exported JSON is the raw record. Organizing happens on
  copies — never edit the backup file itself and expect the app to follow.
- API keys (Settings, last section, optional) are stored in localStorage only.
  The app never sends them anywhere itself.

## What's inside

- **Pipeline** — kanban across the core loop: Discover → Understand → Choose
  offer → Draft outreach → Track outcome. Click any card for its Target Card.
- **Discover** — manual lead intake. Category = suggested picks + custom (nothing
  hardcoded). Place ID dedup: the same business can't be saved twice.
- **Target Card** — business facts, explained Opportunity Score (each component
  cites its evidence; unknowns show as gaps, never as opportunities), evidence
  split into **Public evidence** vs **Verified owner pain**, pursuit decision
  (Pursue / Park / Drop) with required kill criteria, offer picker, outreach
  drafts (draft → reviewed → sent; Scouter never sends anything automatically),
  quotes with line items, payments, expenses, episode tie-ins, and an activity
  log with time + friction.
- **Day-7 Review** — Scouter-assisted metrics vs. your random-prospecting
  baseline (set it honestly in the view).
- **Money** — global ledger: quoted / received / net across all leads.
- **Settings** — offer catalog, score-weight calibration (a hypothesis, not
  truth), API keys last, roadmap placeholders, danger zone.

## Seed data

The app ships with 3 clearly-labeled seed leads (Yellowstone Candy Co.,
Leishman Electric, brother's tiling business) and 3 example offers. They're
marked **SEED EXAMPLE** — edit or delete them freely; use Danger Zone →
Restore seed data to get them back. No contact details were invented: phone /
address / email fields are empty unless you fill them.

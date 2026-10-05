# Scouter v3.5 — Fusion Plan

**Date:** 2026-10-05
**Goal:** Fuse the best of the Friday V1 design (Chat 1: "Audit Scouter and plan V1")
with the Aspen validation direction (Chat 2: "Build Scouter local-services V2")
into one improved build. Build target: TBD (see end).

---

## What each chat contributed

### Chat 1 (Friday) — the design that "wasn't perfect"
- **Core loop:** Discover → understand → choose an offer → save → draft outreach → track outcome
- **Visor/DBZ visual identity** (user: "i like the visor direction so far"):
  graphite/amber base, deep-green lens workspace, lime selection/targeting,
  orange/gold opportunity signals + main actions, small purple HyperWumpus accents, red for errors/urgent
- **Explained Opportunity Score** (deterministic V1 weights — a prioritization hypothesis, not truth):
  Website not listed in Places = 50 · Rating = 20 · Review volume = 20 · Phone available = 10
- **Epistemic honesty rules:** "website not listed on Google" is an observation, not proof of no website;
  failed retrieval = unknown, not a confirmed gap; incomplete scores shown with coverage separate
- **Target Card** as the core unit; user notes/stages/tasks/offers/outreach persisted
  **separately** from provider-sourced business data
- Commercial layer: quotes (line items), payments, expenses, Odd Jobs episode tie-ins per job
  (this matches the Oct 1 app backup schema — v3.5 must stay compatible with it)
- **Known imperfections to fix:** saved leads discarded Place ID, website URL, rating, review count;
  duplicate detection by name (conflates branches); hardcoded "painters" example; every lead got the
  same concept URL; SMS copy claimed things that weren't true; setup led with API keys before
  explaining value; direction was "an untested product direction too confidently";
  "aren't i just doing fiver" — concluded: pause feature dev, validate first

### Chat 2 (Aspen / new build) — the new direction
- **"Seven-day Aspen test"** = the manual validation experiment (5 sourced briefs + 7-day tracker
  spreadsheet). In the shared link Aspen appears only as that test's codename — not a defined
  persona. New direction = turn the *manual validation workflow* into the app, stay in the
  **local-business digital-services lane**, no premature verticals/APIs.
- **Fact / Signal / Hypothesis / Unknown** evidence model, with evidence URLs + dates
- **Strict separation:** public evidence vs. verified owner pain
- **Pursuit decision with drop conditions / counterevidence** (kill criteria — V1 lacked these)
- Tailored owner discovery question per brief; outreach draft → review status
- **Activity + time-to-research + friction logging; Day-7 review metrics** —
  the whole point: test whether structured scouting beats random prospecting
- Guardrails: never auto-contact businesses, never make service promises
- Future extension points named but not built: Scouter Discover, Intelligence, Workbench, Ops, Trades mode
- Shipped: browser-local V2 on GitHub branch `scouter-v2-validation`, draft PR #1 vs V1

---

## v3.5 = the fusion

### KEEP from Friday (design that worked)
1. **Visor visual identity** — it was the one design call you were happy with. Keep it.
2. **Core loop** (Discover → understand → choose an offer → save → draft outreach → track outcome).
3. **Explained Opportunity Score** as a *calibratable hypothesis* — keep 50/20/20/10 as the starting
   weights, keep the "make the score understandable before making it sophisticated" rule.
4. **Target Card** as the core unit of work.
5. **Commercial layer:** quotes with line items, payments, expenses, episode tie-ins (Odd Jobs).
6. **Separation** of user data (notes, stages, offers, outreach) from provider-sourced business data.

### KEEP from the Aspen direction (validation-first DNA)
7. **Fact / Signal / Hypothesis / Unknown** evidence labels on every claim — this is Friday's
   epistemic-honesty rules grown into a real system. Evidence URLs + dates required.
8. **Public evidence vs. verified owner pain** kept visually separate on the Target Card.
9. **Pursuit decision + drop conditions** per lead — kill criteria, not just pipeline stages.
10. **Time/friction logging + Day-7 review** ("does Scouter beat random prospecting?") —
    Friday's chat ended with "pause feature dev and validate"; v3.5 bakes that in instead of
    deferring it.
11. **Guardrails:** no auto-contact, no service promises.
12. **Extension points named, not built:** Discover, Intelligence, Workbench, Ops, Trades.

### NEW in v3.5 (fix Friday's imperfect list + bridge the two)
13. **Leads carry full intelligence:** Place ID, actual website URL, rating, review count saved at
    capture — intelligence follows the prospect into the pipeline (fixes V1's data loss).
14. **Dedup by Place ID,** not business name (no more conflated branches).
15. **Category picker = suggested selections + custom option** — nothing hardcoded (fixes "why is
    painters hard coded").
16. **Setup explains the win first,** API keys second (fixes key-first onboarding).
17. **Honest outreach copy only** — drafts never claim a preview/website that doesn't exist
    (fixes the false SMS).
18. **Score + evidence on one card:** the Opportunity Score shows its work *through* the
    Fact/Signal/Hypothesis/Unknown labels — e.g. "Website not listed (Signal, observed Oct 5)".
    Unknowns render as gaps, never as confirmed opportunities.
19. **Defer Purchase Likelihood / Your Fit scores** until there's enough evidence + a configured
    service profile (carried over from Friday — still not enough evidence).
20. **Seeded with real data, not demo data:** the 5 sourced briefs + the 3 live leads already in
    the Scouter workspace (Yellowstone Candy Co. $1,250 quote pending, Leishman Electric,
    brother's tiling business) — and backup/export discipline stays (raw preserved, JSON exports).

### Explicitly NOT in v3.5
- No new verticals or APIs beyond the local-business digital-services lane
- No Trades mode, no Workbench/Ops modules (extension points only)
- No subscription/pricing UI ($19/$39 was an untested hypothesis — parked until validation says otherwise)

---

## Open decision: where does v3.5 live?
- **Option A (recommended): upgrade the existing Scouter artifact** — it's the live workspace,
  already holds the 3 real leads + money tracking, and already went through the lead-to-payment
  rebuild. Fuse v3.5 into it: evidence labels, pursuit/drop conditions, Day-7 review.
- **Option B: standalone local app** like the ChatGPT builds (browser-local, GitHub branch).
  Better if v3.5 should stay separate/experimental and not touch the live leads.

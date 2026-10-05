# Scouter fusion: design and comparison

## Product boundary

Scouter helps an independent worker find plausible work, understand whether there is a real problem, choose a realistic offer, and track the pursuit and outcome. The seven-day local-business digital-services experiment is the current lane, not Scouter's final definition.

This build keeps the Target Card as the working unit. The visor visual identity frames attention: graphite/amber shell, deep-green lens, lime targeting, orange/gold observations, purple HyperWumpus/Odd Jobs accents, and red for errors or urgent states. The score's interpretation is adjacent to the score, and owner evidence is a separate section.

## Smallest coherent architecture

One standalone HTML file contains three conceptual layers:

- Domain rules: `score`, `validate`, `reviewMetrics`, `offerReady`, `quoteTotal`, `ledger`.
- Local state: versioned schema, localStorage persistence with cross-tab conflict checks, validated JSON replacement, session research timer.
- Views/forms: Targets, manual Discover, Day-7 review, Money, My toolkit; Target Card tabs Understand, Decide & offer, Outreach, Outcomes and Activity.

A target has an internal ID, a provider snapshot and snapshot history, user-owned pursuit fields, sourced public evidence, outreach records, quote line items, payments, expenses and episode notes. Provider facts are never overwritten by service notes. Known Place IDs deduplicate; identical names alone do not. Each manually sent message links to exactly one outreach activity. Blank minutes or amounts mean unrecorded, while a recorded zero remains zero.

Public evidence uses Fact / Signal / Hypothesis / Unknown with URL and observation date. Non-Unknown public claims require a source URL. Owner statements live in activities with exact words, speaker/role, explicit speaker verification and explicit concrete-pain interpretation. Those flags record the operator's evidence assessment; Scouter does not externally authenticate the owner. Neither a high score nor a pending quote sets owner pain.

Decision requirements make stopping criteria visible: a question, counterevidence and drop condition accompany Pursue, Park or Drop. Review requires the user's identity and an operator-verified contact route. Editing relevant data invalidates Reviewed drafts; Sent text remains an immutable record. Capability confirmation and owner-discovery prerequisites inform offer readiness. Historical quotes can still be accurately recorded without retrospectively manufacturing those prerequisites.

## Fair manual comparison

The review window is editable and dates use America/Boise. Research includes General/discarded-candidate activity, not only saved targets. Method-specific time, outreach, responses, conversations, owner evidence and friction are shown together. Quotes and payments use their actual dates; the undated seed quote is excluded from the test window. The tiling pilot is excluded from digital-services totals. Current target/decision counts are explicitly labeled as current, rather than retrospective snapshots.

No baseline or advantage is seeded. The user must record comparable batches and describe differences in geography, services, sample size and time budget. Missing time is visible. Late responses remain in the log. These are descriptive validation metrics, not causal proof or automatic rejection of unanswered prospects.

## Comparing the three approaches

| Approach | Main emphasis | What to inspect |
| --- | --- | --- |
| `scouter-v2-validation` | Manual evidence-to-decision validation | Existing tracker-derived workflow and broader Scouter extension plan |
| Other AI's `scouter-v3.5` | Its independently proposed fusion and plan | Its navigation, density, seed assumptions and breadth in its own folder |
| `scouter-v3.5-chatgpt` | Visor Target Cards with explicit evidence and pursuit requirements | Adjacent score coverage, untouched unknowns, snapshot/user separation, local manual baseline and cents-based commercial records |

This build's differentiating choices are a card-centered progression, separate provider snapshot history, no score before sourced coverage exists, no assumed seed histories, explicit stopping criteria, and a baseline that begins unrecorded. Those are independent product decisions. The other fusion's code, synthetic owner statements, contact details, ratings, research times and baseline values were not copied.

## Extension seams; no premature modules

| Future module | Existing seam | Deferred |
| --- | --- | --- |
| Discover | Manual capture, categories and provider snapshots with Place IDs | Search providers, APIs and automated ingestion |
| Intelligence | Typed evidence and pure scoring rules | Automated research, enrichment or inferred owner pain |
| Workbench | Service capability, wanted result and delivery-fit fields | Builders, generated deliverables and execution automation |
| Ops | Activity IDs, quotes, receipts, expenses and episode notes | Invoicing dispatch, payments integration, scheduling and CRM sync |
| Trades | Explicit `parked-trades` lane and separate seed | Estimating, job scheduling and trade-specific execution |

Future adapters should preserve source identity and dates, distinguish missing from known zero, and append provider snapshots rather than mixing them into user-owned work. No unrelated verticals or external API integrations are implemented.

## Reference access and scope

The two original shared ChatGPT links and the replacement link were opened, but each returned “Shared chat not found.” The user's detailed fusion brief, existing V2 context, and read-only local Scouter project supplied the usable design context. The local project was inspected without modifying its synced files. The other branch's README, plan and HTML were reviewed as reference only.

The original five business briefs remain part of V2's inherited folder. This comparison app deliberately uses the latest requested three-seed set. Original uploaded workbook/text files, private project sources and browser backup data are not added to this branch.

LocalStorage is a single-browser workspace, not a multi-user database. The schema is intentionally independent; cross-build imports require a future explicit migration. The app has no automatic outreach, service guarantees, API setup or publishing capability.

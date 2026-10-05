# Smallest coherent V2 architecture

## Decision

Use a dependency-free browser application, a static loopback server, a versioned domain model and a browser-storage adapter. This preserves V1’s approachable HTML/JavaScript and local saved-prospect model. V1’s external Places SDK, CDN styling and direct SMS pitch action are outside this validation build. Source, domain rules, presentation and persistence now have separate files, enabling a backend later without coupling qualification to a particular opportunity provider.

The existing local concept was a UI simulation; the supplied V1 repository is a working 267-line HTML application with Places search, `scout_pipeline` browser storage, concept links and three legacy statuses. It has no framework, build pipeline, tests or package manifest. V2 is a new implementation proposed on a separate branch of that repository. The main branch remains V1 for comparison.

## Files

- `src/seed.js`: exact source-derived five-business dataset and empty validation results.
- `src/domain.js`: model defaults, evidence/outcome boundaries, offer and review prerequisites, date-scoped metrics, backup validation, legacy mapping, safe CSV export and future module registry.
- `src/store.js`: load/save adapter with schema validation. Replace this adapter for a future repository/backend.
- `src/app.js`: workflow views, forms and manual user actions.
- `src/style.css`: responsive local styles without external fonts or CDN dependencies.
- `server.mjs`: read-only static server bound to 127.0.0.1; no external API routes or contact functions.
- `tests/domain.test.mjs`: source integrity, missing values, periods, comparison methods, outcome distinctions, qualification gates, restore validation, CSV and V1 migration.

## Domain

`Workspace(schemaVersion=2)` owns a Profile, Experiment, Opportunities, Activities and five Review rows.

Profile records current skills, tools, confirmed service capability, geography/travel, availability, goals, urgency, preferred job size, permitted channels, exclusions and delivery constraints. Capabilities start unconfirmed.

An Opportunity has a stable ID, `lane=digital-services`, method, business identity and location, service hypothesis, website/contact route, qualification, pursuit decision, current response, reviewed learning draft, discovery notes and a small manual offer workspace. It retains its original brief separately from editable fields. Each Evidence item has `kind=Fact|Signal|Hypothesis|Unknown`, text, URL, observed date and provenance. A fact is public observation, never an owner-pain flag. No opportunity score is invented.

Activity is the source of actual events: date, business or General, method at time of logging, type, minutes, message/channel/recipient, response/interpretation, owner exact words and verified-owner flag, quote, received payment, scope/status, unique commercial reference, next action/due and friction. Owner statements come only from identified speakers and explicit verified-owner records. These are user attestations, not external authentication. Discovery notes alone do not unlock an offer. A quote also needs scope and a unique reference; a payment record needs scope and a unique reference. Revisions edit the same record. Quote and payment values cannot be stored on unrelated activity types.

Evidence does not carry owner words. Owner words do not imply payment. Acceptance does not imply payment. Responses are explicit; the application never decides that silence means rejection. Current response is manually reconciled with the event log, so logging events cannot silently rewrite contact history.

## Workbook mapping

| Original tab | Application representation |
| --- | --- |
| Businesses | Business intake, public evidence and source dates; pursuit decision/reason; owner result/problem notes; current response and next action/due |
| Activity log | Actual typed events with all original fields, plus method, friction, verified speaker and commercial reference |
| Day 7 review | Counts and sums from activities in the experiment window; current pursuit counts; five synthesis questions with conclusion, supporting IDs, missing evidence and next test |

Workbook rows S01–S05 map to the same stable IDs. Text briefs supply full unknowns, counterevidence, discovery questions, contact caveats and drafts. No activities existed in the supplied workbook, so there is nothing to migrate into event history. Seeded public observation dates are the original retrieval dates, not page publication dates or a new verification by this app.

## Metrics and comparison

One metrics function owns every total. Activities are filtered inclusively by experiment start/end and, when selected, research method. Counts represent activities, not unique businesses. Research totals include discarded candidates logged under General. Blank numeric entries remain null, and sums display Not logged/Not recorded when there are no numeric entries. When some entries are timed and others are blank, known minutes are summed and missing-time counts stay visible. Paid-work amount gaps are also shown. Late activity stays in the log but is excluded from the Day-7 window. Pursuit decisions show current state and are not a historical snapshot.

The baseline is a method within this same digital-services experiment, not a new vertical. Both methods use the same record shape. No rate, win probability or market score is used. Until comparable baseline activity exists, the app states there is no evidence of a time advantage. The user records comparison setup and limitations in the review.

## Future extension contracts

The `MODULES` registry records ownership without exposing inactive modules as usable features:

| Module | Contract / current scope | Later extension |
| --- | --- | --- |
| Discover | Profile fit and manual opportunity intake | Providers return candidate identity, source and observation date. They cannot mark owner pain or invent activity. |
| Intelligence | Evidence, falsifiable questions, drop conditions and manual owner discovery | Research enrichment retains provenance and kind; prioritization must expose reasoning. |
| Workbench | Parked; confirmed capability and scope fields are its handoff | Delivery workflows consume agreed scope, service capability and constraints. They must not infer acceptance. |
| Ops | Activity, scope, quote and payment records only | Project/job lifecycle, expenses, invoices and economics with independent payment reconciliation. |
| Trades | Parked outside this lane | Separate experiment, profile and service schema for site visit, measurements, labor/materials and job scheduling. |

A future multi-experiment release should add a workspace experiment repository and scope opportunity/activity IDs to an experiment before activating Trades or any other lane. Current validation explicitly rejects a different lane. Do not simply mix Trades candidates into this dataset.

## Current limits

Single user, one browser and one experiment; local data, no cloud sync. Export backups for recovery. Schema-version checking is in place; automatic migration from unknown V2 formats is deliberately rejected. V1 migration preserves source records without inventing dates or events. There is no AI model or automated web research. Draft generation is a transparent learning-message template. No buttons send contact, promise service delivery or publish work.

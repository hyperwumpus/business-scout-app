# Scouter 3.5 — ChatGPT fusion

An independently authored fusion of the V1 visor/Target Card direction and V2's evidence-first validation workflow. This is a comparison build, based on `scouter-v2-validation`; the other AI's `scouter-v3.5` build was reviewed as a reference, not reused as code.

## Open

Download `scouter-v3-5-chatgpt.html` and double-click it to open in a browser. Everything needed is inline: no build, server, API keys, CDN, account or network connection is required. The file uses a classic script, not module imports. A local server is optional for development.

Data persists in that browser's localStorage under `scouter.chatgpt.35.v1`. Browser policies and file location can affect file-origin storage. If persistence is unavailable, the app reports that limitation. Use **Export JSON** for a portable backup; copy the complete JSON or download the file. **Import JSON** validates before replacing the workspace. This build's backups are intentionally separate from V2 and the other fusion build; there is no automatic cross-build migration.

## First session

1. Enter your identity, actual capabilities, tools and delivery limits in **My toolkit**.
2. Open a **Target Card** or capture a target manually. Categories are editable. Keep the actual Place ID, website, rating and review count when known.
3. In **Understand**, record dated, sourced Fact / Signal / Hypothesis / Unknown entries. Log the owner's exact words separately.
4. In **Decide & offer**, write a tailored discovery question, counterevidence and a drop condition. Record delivery fit before treating a service hypothesis as a feasible offer.
5. In **Outreach**, review the intended contact route, draft a learning question, mark the exact text Reviewed, and record Sent only after manually sending it outside Scouter. The app cannot send messages.
6. Log research, responses, conversations, minutes and friction. Include discarded candidates through General activity. Identify the method as Structured scouting or Random prospecting.
7. Record itemized quotes, receipts, expenses and optional Odd Jobs episode notes. Review the seven-day comparison before concluding that structured scouting helped.

## Honest seeds

- Yellowstone Candy Co.: user-supplied pending $1,250 quote. Original scope and date are unknown; a single placeholder line preserves the total without inventing a scope or price split.
- Leishman Electric: name and category only; discovery question is an editable draft.
- Brother's tiling business: a parked future pilot, excluded from digital-services validation totals.

There are no invented contact details, provider ratings, owner statements, send history, payments, research times or baseline results. All seed scores start unavailable with 0% coverage. A quote does not prove pain, acceptance or received money.

## Opportunity Score

The deterministic starting weights are website listing 50, rating 20, review volume 20 and phone listing 10. Only known components in a manually recorded, dated, sourced Google Places snapshot count as covered. Unknown components are never normalized away: the score remains points out of 100, with coverage separate. The full rule and component explanations are expandable in the Target Card. Weights and review-volume thresholds are adjustable in My toolkit; they remain prioritization hypotheses, not buying-intent predictions.

## Verification

Run `node --test core.test.mjs` with Node.js. Twelve domain tests cover score coverage, Place-ID deduplication, seed integrity, evidence/owner-pain separation, pursuit/review requirements, missing versus zero values, review-window filtering, money arithmetic and backup validation.

Browser checks exercised pursuit validation, draft → reviewed → manually recorded sent, owner statements, random-prospecting General research, persistence across reload, quotes versus receipts/expenses, JSON text export/restore and invalid-backup rejection. The test workspace was restored to the clean seeds. Desktop and 390px responsive layouts were inspected, with no horizontal document overflow or browser error logs. UI checks used localhost; the automation browser disallows `file:` navigation, so direct double-click execution was not automated. The JSON file-download event could not be confirmed in that browser; the visible complete-JSON export and paste/import round trip were verified.

See `DESIGN-AND-COMPARISON.md` for scope, extension seams and reference limitations.

# Scouter V1

A working, single-user web app for finding potential freelance clients and turning real requests into paid jobs. Its visor interface combines an ivory housing, a green radar screen, orange actions, and purple Odd Jobs accents.

## Start

Requires Node.js 24 or newer. No dependency installation is needed.

```sh
cd scouter
npm start
```

Open **http://127.0.0.1:4317**. The server must remain running while you use the app. Stop it with Ctrl+C. Run `npm start` again to reopen the same workspace.

If the port is busy, use `PORT=4319 npm start` and open that port. The app is intentionally bound to this computer's loopback interface; it is not deployed or designed for public hosting without additional authentication and infrastructure.

## Your first job

1. In **Settings**, select services you can deliver and add your tools, availability, and truthful proof of experience.
2. Add a request, referral, or prospective client with **Add opportunity**. Alternatively connect Google Places or YouTube and run a real search.
3. Review the opportunity brief. A listing identifies a potential client; it does not prove they need your service. Requests you enter are labeled separately.
4. Save the opportunity, choose an offer, draft outreach, and log your contact attempts and follow-up date.
5. Build a quote, agree on scope, and move the job through the pipeline. Record actual payments, costs, and time.
6. Attach Odd Jobs episode notes: before, after, lesson, media link, production status, and filming permission.

## Included

- Twelve service categories across digital fixes, creative gigs, and hands-on jobs.
- Google Places (New) text search with location, pagination, contact details, website filtering, and current target details.
- An explained website priority score: website not listed (50), rating (up to 20), review count (up to 20), and available phone (10). Missing data remains unknown. This is a transparent prioritization rule, not an estimate of sales probability.
- Other services use an unscored qualification brief rather than invented demand or budget.
- YouTube channel discovery and public channel statistics for editing, clips, graphics, and other creator services.
- Local business comparison using real Google listings: website presence, ratings, review counts, and source links. Comparable listings are not automatically confirmed competitors.
- Mobile PageSpeed Insights audits for performance, accessibility, and SEO.
- Template outreach without a key; OpenAI outreach through the Responses API with `store:false`. Editable email, SMS, and phone drafts. No messages are sent automatically.
- Eight pipeline stages, activity history, next action, and follow-up dates.
- Itemized quotes with cent-based totals, text download, and print/save as PDF.
- Actual payment, expense, and time tracking with net before tax and net per hour. This records income; it does not process payments.
- Odd Jobs episode journal attached to each opportunity.
- Persistent SQLite storage, JSON backup/restore, and ledger CSV export.
- Responsive layouts, semantic forms, keyboard controls, and plain-text rendering of imported/provider content.

## Connect your own accounts

Enter API keys in **Settings → Connect your APIs**. Empty fields preserve saved keys. Use **Remove saved key** to remove one. Keys are never returned by the server or included in backups.

Alternatively copy `.env.example` to `.env` and fill in the values. Restart after environment changes. Locally saved keys take priority over environment values; removing a saved key falls back to an environment key if one exists.

| Connection | Setup | Used for |
|---|---|---|
| Google Places (New) | Enable Places API (New) in a Google Cloud project, configure billing and an API key, and restrict the key to the appropriate API. [Official setup](https://developers.google.com/maps/documentation/places/web-service/get-api-key). | Business search, current details, local comparison |
| YouTube Data API v3 | Enable YouTube Data API v3 and create an API key. [Official setup](https://developers.google.com/youtube/v3/getting-started). | Creator/channel discovery and statistics |
| PageSpeed Insights | A key is optional, but unkeyed requests may be quota limited. [Official setup](https://developers.google.com/speed/docs/insights/v5/get-started). | Live mobile Lighthouse audits |
| OpenAI | Create a key for an API project with available usage. Choose a supported Responses model; default is `gpt-5-mini`. [API keys](https://platform.openai.com/api-keys), [Responses reference](https://developers.openai.com/api/reference/resources/responses/methods/create). | AI outreach drafts |

Connection badges indicate whether a key is configured; they do not claim it has been verified. Authentication, enabled APIs, key restrictions, quota, billing, and internet access are checked when a request runs. Provider failures produce explicit messages, never fallback sample results.

Search and AI usage are billed or metered by your own accounts. Google searches request one page of up to twelve businesses; YouTube searches retrieve up to ten channels and then fetch statistics. Searches run only when requested.

## Storage and backups

The default workspace is `.data/scouter.sqlite`. It survives server and browser restarts. The directory and database use restrictive filesystem permissions. API keys are stored locally in that database or `.env`; they are **not encrypted at rest**. Do not share those files.

Google and YouTube listings are held transiently in the browser. Saving a provider target stores its reference ID plus your own offer, notes, pipeline, quotes, ledger, and episode records. Provider names, addresses, ratings, and channel statistics are not retained in the database or backups. After restarting, use **Load current details** to retrieve fresh provider information. Google attribution and provider links appear next to displayed data.

Use **Settings → Export backup** regularly. Import validates the complete backup before writing and adds missing opportunities without overwriting existing ones. It restores the profile and skips duplicate record/provider IDs. CSV exports are a ledger, not a restorable workspace backup. Currency changes are blocked while monetary records exist; amounts are not automatically converted.

For a separate workspace, set `SCOUTER_DATA_DIR` to a different directory when starting the app. Keep it private. Do not expose this local server to a public network. The current implementation is for personal use and has no multi-user login, cloud sync, marketplace scraping, or automated job fulfillment/video editing.

## Verification

```sh
npm test
```

The 13 automated tests cover the scoring rules, honest unknowns, monetary calculations, invalid input, provider-data minimization, restart persistence, duplicate prevention, atomic backup restore, provider request/response handling, missing credentials, and a complete local HTTP job workflow.

Provider contract tests use controlled responses and incur no external usage. Browser verification also exercised a real request → quote → paid ledger → episode → template draft → reload workflow in a separate test workspace. Live keyed Google, YouTube, and OpenAI calls still require your credentials. An actual unkeyed PageSpeed request reached Google but was rejected with a quota-limit response; a completed live audit has not been verified.

## Structure

```text
public/             Visor UI, forms, responsive styling
server/domain.mjs   Services, validation, scores, money rules
server/store.mjs    SQLite persistence and backups
server/providers.mjs Google, YouTube, PageSpeed, OpenAI integrations
server/main.mjs     Local server, API routes, request safeguards
tests/core.test.mjs Workflow and integration contract tests
```

The earlier uploaded static prototype is unchanged. This app lives in its own `scouter` folder.

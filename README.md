# Scouter V2

An opportunity workspace for independent workers. This version implements the local-business digital-services lane: service fit, public evidence, qualification, manual pursuit, owner discovery, commercial records and learning. The October 5–11, 2026 Aspen test is the first experiment, not the definition of the product.

## Run

Requires Node.js 20 or newer. There are no package installations or API keys.

```sh
cd scouter-v2
npm start
```

Open http://127.0.0.1:4173. Keep the server running while using the app. An alternative port can be set with `SCOUTER_PORT=4174 npm start`; browser storage is separate for each origin/port.

```sh
npm test
```

## First use

1. Open **My service profile**. Enter your name, tools, availability, delivery constraints and any services you can confidently deliver today. Service exploration is not confirmed capability.
2. Review a business in **Opportunities**. The four evidence kinds distinguish observed facts, interpreted signals, testable hypotheses and unknowns. Each item keeps its source URL, observation date and provenance. The original imported brief remains available.
3. In **Pursuit**, choose Pursue, Pass or Later and record your reason. Verify the business contact route, review the learning message and replace the name placeholder. Save it as Reviewed to copy. Send outreach yourself; then log the message actually sent. No contact action exists in Scouter.
4. Record responses and conversations through the activity dialog. Exact owner words, speaker and date are separate from your interpretation. Update the current response status in Pursuit explicitly.
5. In **Owner discovery**, record the wanted result, problem interpretation, current workaround and priority. The scope workspace unlocks only when owner evidence and confirmed delivery fit are present. Scope, proposed price, timing and acceptance remain separate from the activity log’s quote or actual received payment.
6. Use the research timer or enter actual minutes. Include failed searches under General, choose the research method, and describe workflow friction. A blank time or money field remains unrecorded; 0 is a recorded zero.
7. In **Validation review**, review period-filtered activities and the five Day-7 questions. Add a comparable random-prospecting batch and log its method separately before claiming Scouter saves time.

## Saved data and portability

Data is saved to this browser’s local storage when you press Save. It stays across reloads but does not sync between devices, browsers or ports. Browser data clearing removes it. Export a JSON backup regularly; restore validates it before replacing the workspace. The backup contains profile, evidence, original briefs, owner statements, offers, activities and review notes. CSV exports represent Businesses, Activity log and Day 7 review. Some browsers may request permission for downloading three CSVs together.

The supplied text and workbook are preserved in the original local deliverable and are not uploaded with this public source branch. `src/seed.js` contains the five source-derived public business briefs. The workbook is an archived input, not a second live database. Initial seed data carries no outreach, owner evidence, timing, quotes or payments. Owner and business public pages were not re-researched during this build; the source retrieval date remains October 5, 2026, as supplied.

## Bring V1 prospects forward

The reference is [hyperwumpus/business-scout-app](https://github.com/hyperwumpus/business-scout-app), inspected at commit `b7848c21be557411100c92f0686babb93a1793ce`.

V1 stores its pipeline under `scout_pipeline` on the origin where you used it. Open V1, use browser developer tools → Application → Local Storage, and copy the value of `scout_pipeline`. In V2, choose **My service profile → Import V1 prospects** and paste the JSON array. Import adds records without replacing the five briefs and skips duplicate V1 IDs.

The original phone, address, website-presence flag, concept URL and legacy status are preserved in the original-record section. V1 does not retain observation dates, owner words, exact sent messages or payment evidence. Import therefore leaves all pursuit decisions undecided, resets the current contact state to Not contacted pending reconciliation, and adds an Unknown item asking for requalification. Historical Closed is not a sale. Historical Pitch Sent is not fabricated as a dated outreach event. Reconcile actual history manually in the log. API keys are not imported.

## Scope

Discover and Intelligence operate through manual intake and evidence review. Ops implements the small outcome/activity subset needed for the experiment. Workbench and Trades have architecture contracts but no product screens or integrations. There is no Google Places connection, automated prospecting, email/SMS sending, AI service, cloud backend or deployment in this version.

See ARCHITECTURE.md for the boundaries, data model, source-to-app mapping and future extension path.

## Verification

Nine automated domain tests cover the core evidence and accounting rules. Browser workflow tests also cover intake, evidence editing, service profile, outreach review, owner discovery, offer prerequisites, duplicate quotes, reload persistence, V1 migration, JSON restore, research timing, baseline comparison, activity CSV export, synthesis and mobile width. QA data is created in an isolated browser context, not in your workspace.

`npm run test:browser` requires Playwright and a running app at port 4173. Set `SCOUTER_PLAYWRIGHT_MODULE` to a Playwright module path and `SCOUTER_BROWSER_EXECUTABLE` to an installed Chrome executable if they are not available through normal defaults. Core `npm test` requires no dependencies.

On macOS you can also launch with `Launch Scouter.command` if Node is available in your login shell. Keep its Terminal window open. The app protects against overwriting changes made in another open tab: reload if it reports a workspace conflict.

## Compare with V1

This branch replaces the root app with Scouter V2. The original V1 HTML and README are preserved at `legacy/v1.html` and `legacy/README.md`. V1 used Google Places search and a three-status saved pipeline. V2 uses manual evidence intake, qualification, owner discovery and recorded outcomes to test whether the workflow is useful. The main branch continues to contain V1. No GitHub Pages deployment is configured by this change.

# Scouter

A responsive opportunity workspace for independent workers. Start with the current local-business digital-services experiment: capture evidence, understand owner pain, decide whether to pursue, review outreach, log effort and track outcomes.

## Use

Open `index.html` directly in a browser, or serve this folder as a static site. No build, API keys or external dependencies are required. The public hosting package contains only `index.html` and `.nojekyll`.

Scouter saves to this browser under `scouter.workspace.v1`. It does not upload your entered business notes, owner statements or financial records to a server. Export JSON regularly and before switching browsers/devices. Import validates the backup before replacing the local workspace. A live URL does not create cross-device synchronization.

The prior comparison build's localStorage key and JSON schema are supported. On the same browser origin, Scouter copies a valid legacy workspace into the new key without deleting the original. Existing new-key data wins. Moving from a local file to a hosted origin requires Export JSON in the old app, then Import JSON at the new URL. An invalid saved workspace is preserved rather than silently replaced by seeds.

The original local comparison file is also updated to the neutral Scouter branding so it can export existing file-origin data. The new deployable folder and branch are named `scouter-web`.

## Live hosting

The `gh-pages` branch contains only the deployable app. In the repository's Settings → Pages, select **Deploy from a branch**, **gh-pages**, **/ (root)**, then Save. GitHub publishes after its build completes. Expected project URL: `https://hyperwumpus.github.io/business-scout-app/` (not live until Pages is enabled and the deployment succeeds).

Reference: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Product direction

1. **Now: responsive web app.** A stable HTTPS URL, usable Target Cards, manual evidence/pursuit workflow, browser-local storage and portable backups. The useful outcome is finding and winning paid work more efficiently than random prospecting.
2. **Next, if daily usage validates it:** an installable PWA with intentional offline/update handling; durable sign-in and cross-device storage when needed. Add actual discovery providers only after the manual loop demonstrates value.
3. **Native mobile only when justified:** field camera/media capture, background work, notifications or other phone capabilities that materially improve the workflow. A native wrapper alone does not solve opportunity quality or data sync.

This release does not add a service worker, cloud database or automated contact. Trades remains a parked lane. Future Discover, Intelligence, Workbench and Ops capabilities retain explicit seams in the data model.

## Validation

`node --test core.test.mjs`: fourteen domain tests, including legacy backup upgrade, legacy storage loading and current-storage precedence. Earlier workflow/browser checks covered pursuit gates, manual outreach recording, owner reports, research-method comparison, money totals and JSON restore. The branding/storage changes are also inspected through a localhost browser preview. Browser data and exported user backups are not part of the publishing branch.

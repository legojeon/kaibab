KaiBab
======
A compact, unofficial KAIST cafeteria-menu extension in Korean and English.

Brand spelling: KaiBab. Folder, repository and package spelling: kaibab.
Kai + Bab makes the two parts readable without suggesting KAIST endorsement.

Structure
  extension/  Load this folder in chrome://extensions (Manifest V3).
  docs/       Bilingual privacy policy and GitHub Pages landing page.
  store/      Store descriptions, review notes, checklist and image assets.
  tests/      Security checks and live browser checks (development only).
  scripts/    Reproducible store-asset and upload ZIP builders.
  dist/       Generated upload ZIP; excluded from Git.

Local install
Enable Developer mode at chrome://extensions, click Load unpacked, and select extension/.
Pin KaiBab in the toolbar. Click its icon; use KO / EN to switch language.
After moving an unpacked extension to a new directory, Chrome needs to load that new directory.

Development
Install Node.js and Python 3. Then:
  npm ci
  npx playwright install chromium --no-shell
  npm test
  npm run test:live
  npm run assets
  npm run package
Playwright is a development dependency only. The installed extension has no runtime packages.
No API keys, .env files, account login or backend are required.

Publication
Read store/SUBMISSION-CHECKLIST.txt and store/LISTING.txt first.
Only upload dist/kaibab-1.2.0-chrome-web-store.zip to Chrome Web Store.
The archive contains manifest.json at the root and only explicitly allowlisted extension files.
Do not upload a ZIP of this entire repository.
The GitHub / Pages URLs in the documentation are proposed until deployed and verified.
No repository, website or store listing has been published by these local build scripts.

Data and affiliation
Preferences and menu cache stay in local extension storage. Requests go directly to KAIST;
KAIST receives ordinary network information and the requested cafeteria/date/language.
No developer collection server, advertising, analytics, browsing-history permission,
content scripts or remote executable code are used. See docs/privacy.html.
Not affiliated with or endorsed by KAIST. No official KAIST logo is included.
Public menu content remains attributable to its original source; access alone does not
establish a blanket reuse licence. Review source terms before broad distribution.

Licence
No open-source licence has been selected yet. Public source visibility does not itself
grant an MIT/Apache licence. Choose a licence intentionally before describing it as open source.

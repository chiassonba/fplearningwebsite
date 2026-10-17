# First Principles Learning

Initial static website for fplearning.ca.

## Preview locally

Open `index.html` in a browser, or serve this directory with any static HTTP server. No dependencies or build step are required.

## Project structure

- `index.html`: page markup
- `css/styles.css`: responsive visual styling
- `js/main.js`: small progressive enhancement
- `images/`: reserved for site imagery

## Inquiry email drafts

The form is contained in index.html. Its Prepare email button opens a pre-filled draft addressed to fplearning.info@gmail.com with all form answers. Visitors review the draft and send it using their configured email app. JavaScript and a configured mailto handler are required. No email service or activation is needed.

To change the recipient later, update the email address in index.html and js/main.js.

## GitHub Pages publishing

Publish this repository using GitHub Pages, with the main branch and / (root) as the source. Set the custom domain to fplearning.ca before updating DNS. CNAME contains that domain; .nojekyll serves the static files without Jekyll processing.

At WHC, replace the parking A record for @ with these four GitHub Pages A records:

- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

Set www as a CNAME to chiassonba.github.io. Preserve email-related records, including MX and emailfwd. After DNS validation and certificate provisioning, enable Enforce HTTPS in GitHub Pages and verify both fplearning.ca and www.fplearning.ca.

Reference: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## FP-LCARS command station

- Page: https://fplearning.ca/lcars.html. This standalone page is unlisted in the public navigation and includes `noindex, nofollow, noarchive` metadata. It remains publicly accessible.
- Assets live under `lcars/` and do not change the production homepage styles or scripts. There is no build step or external runtime dependency.
- The tab title is `FP-LCARS`, the heading is First Principles Learning Command Station, and the top-right registry is `FPL 221987`.
- Search defaults to Google.ca; Astrometrics opens Google Maps, Subspace Media opens Spotify, FPLearning Interlink opens the public FPL website, and FPL Resources opens the administrative file library.
- Saved destinations, search selection and page-audio preference are stored in this origin's browser local storage. They are not uploaded or shared with other visitors. Extension-local settings do not automatically migrate to this hosted page.
- The optional page chirps use the unchanged reference audio documented in `lcars/AUDIO-SOURCES.json`. The Antonio font licence is supplied in `lcars/assets/OFL-Antonio.txt`.
- To use this hosted page at browser startup or as a custom new-tab destination, set the address to `https://fplearning.ca/lcars.html`. Browser-wide keyboard audio still comes from the separately installed GX mod. The page sound toggle only controls audio inside this page.
- FPL Resources and FPLearning Interlink open inside the LCARS screen. The Command Station button or sidebar Navigation button returns to the search and saved destinations; leaving the embedded screen unloads its content.
- Edit links manages Saved coordinates and Sidebar links as separate lists. Add link creates another entry; Remove deletes one; Up and Down change its order. The Navigation return control stays at the top of the sidebar. Each link has an Open in selector: LCARS screen or New tab. Save links saves both lists together in one local-storage record, preserving existing labels and addresses from the original six-tile layout. Closing the editor without saving discards draft changes. Owned FPL links default to the screen; external services default to new tabs.
- Typed website addresses open inside the LCARS screen; text searches open the selected search engine in a new tab. Google.ca sends `X-Frame-Options: SAMEORIGIN`, so normal Google search cannot be embedded here. Other sites may impose their own embedding restrictions. The screen always provides an Open in new tab link; the page does not claim it can detect or bypass those restrictions.
- Subspace Media opens a Spotify player panel. Paste a playlist, album, track, artist, podcast show or episode URL and choose Load player. Normal Spotify share links are converted to official `open.spotify.com/embed/` URLs without adding an SDK or API key. The last chosen player is remembered locally. Specific Spotify links also work when typed in Search or saved as LCARS-screen destinations. New-tab link choices remain available; normal Spotify browsing is available through Open in new tab. Playback availability is determined by Spotify and the listener's browser/account.

## Administrative file library

- Page: https://fplearning.ca/files.htm (no link is added to the public homepage).
- Published assets: `files/FPLFiles/`, with one subdirectory per collection.
- Add and commit a file anywhere below `files/FPLFiles/` (for example, `files/FPLFiles/Wallpapers/example.png`). Its folder and subfolders will appear automatically when the library is refreshed, without editing `files.htm`.
- HTML and HTM files are labelled **Open app** and launch in a new tab. Other files have **Download** links. When adding a small web app with companion JS/CSS, keep its relative files together in a subfolder.
- The page builds a collapsible tree from the public GitHub repository's recursive tree API. It requires JavaScript for automatic discovery; API rate limits or temporary failures can prevent refreshing. The six initial Brand links are also provided as static fallback links.
- The `Brand/` collection is a published snapshot of six FPL logo/icon files already present in `images/`. If the originals are later updated, synchronize the published copies as well.
- The page has `noindex, nofollow, noarchive` metadata and is not linked from the site's public navigation or sitemap. This discourages indexing but does not restrict access: both the page and assets are public. Do not store student records, credentials, or other sensitive material here.
- There is no installer in this library. Avoid large binaries in the GitHub Pages repository, since replacements remain in Git history.

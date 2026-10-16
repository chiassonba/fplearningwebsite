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

## Administrative file library

- Page: https://fplearning.ca/files.htm (no link is added to the public homepage).
- Published assets: `files/FPLFiles/`, with one subdirectory per collection.
- Add and commit a file anywhere below `files/FPLFiles/` (for example, `files/FPLFiles/Wallpapers/example.png`). Its folder and subfolders will appear automatically when the library is refreshed, without editing `files.htm`.
- HTML and HTM files are labelled **Open app** and launch in a new tab. Other files have **Download** links. When adding a small web app with companion JS/CSS, keep its relative files together in a subfolder.
- The page builds a collapsible tree from the public GitHub repository's recursive tree API. It requires JavaScript for automatic discovery; API rate limits or temporary failures can prevent refreshing. The six initial Brand links are also provided as static fallback links.
- The `Brand/` collection is a published snapshot of six FPL logo/icon files already present in `images/`. If the originals are later updated, synchronize the published copies as well.
- The page has `noindex, nofollow, noarchive` metadata and is not linked from the site's public navigation or sitemap. This discourages indexing but does not restrict access: both the page and assets are public. Do not store student records, credentials, or other sensitive material here.
- There is no installer in this library. Avoid large binaries in the GitHub Pages repository, since replacements remain in Git history.

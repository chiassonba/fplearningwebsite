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

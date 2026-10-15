# CLAUDE.md - First Principles Learning website

## 1. Purpose
- This repository contains the public-facing First Principles Learning website for prospective families seeking virtual academic support.
- It presents the service, approach, testimonials, and a parent inquiry form; visitors prepare an email in their own mail app rather than submitting to a site backend (`index.html`, `js/main.js`).

## 2. Stack and versions
- Static HTML5 (`index.html`, `index2.html`), CSS (`css/styles*.css`), and browser-native JavaScript (`js/main*.js` plus inline scripts in each HTML page).
- No application framework, dependency manifest, package lockfile, or compiler is present in the inspected root/directory listing; `README.md` states there are no dependencies or build step.
- Browser APIs used in `js/main.js`: `FormData`, `reportValidity()`, `window.open()`, `Date`. Browser version support is not documented.
- GitHub Pages is the documented publisher (`README.md`); `CNAME` specifies `fplearning.ca`. The empty `.nojekyll` file disables Jekyll processing.
- Asset cache-busting URL suffixes such as `?v=18` on production CSS and `?v=2` on production JS (`index.html`) are **not** the project release version.

## 3. Directory map
- `index.html` - public landing page and parent inquiry form; production assets and no preview-only robots directive.
- `index2.html` - staging/preview landing page with visible preview notice, `noindex, nofollow`, and preview assets.
- `css/styles.css` - production layout, colours, form, testimonials, and mobile media query.
- `css/styles-preview.css` - separately maintained staging CSS, including `.preview-notice`.
- `js/main.js` - production form-to-email-draft handling and current-year footer update.
- `js/main-preview.js` - corresponding preview form handler/year update.
- `images/` - site logo, favicon, Canadian flag and other referenced image assets.
- `README.md` - local preview instructions, directory overview, inquiry flow, and GitHub Pages/DNS publishing steps.
- `CHANGELOG.md` - chronological numbered change entries and an `Unreleased` heading.
- `CNAME` - custom-domain name for GitHub Pages.
- `.nojekyll` - empty marker file for static GitHub Pages serving.
- `.gitignore` - ignores OS files and editor directories.

## 4. Run, test, build
- `README.md` documents opening `index.html` in a browser, or serving the directory with **any static HTTP server**; it does not prescribe an exact shell command.
- Preview page is `index2.html`, using `css/styles-preview.css` and `js/main-preview.js` (observed in `index2.html`).
- Prerequisites for inquiry drafting: browser JavaScript and an email application/browser `mailto:` handler (`README.md`, `js/main.js`).
- Documented Pages setup: publish `main` branch from repository root and use `CNAME` (`README.md`). This is documented setup, not an independently verified deployment setting.
- No `package.json`, `pyproject.toml`, `Makefile`, test runner, linter configuration, or `.github/workflows/` appeared in the complete inspected root/subdirectory listing. There are therefore **no confirmed shell run/test/build commands**.
- At creation of this guide, no browser execution, build, linter, or test suite was run. Do not claim they passed.

## 5. Conventions observed in existing code
- Naming/organization: public files have base names, preview counterparts use `-preview` (`css/styles.css` vs `css/styles-preview.css`; `js/main.js` vs `js/main-preview.js`). HTML uses section IDs like `#contact` and CSS uses classes like `.inquiry-form` (`index.html`, `css/styles.css`).
- Layout/style: both HTML pages use two-space indentation; JS statements use two-space nesting (`index.html`, `js/main.js`). CSS generally puts multiple compact declarations on each line; it uses `:root` custom properties and a `max-width:700px` media query (`css/styles.css`, `css/styles-preview.css`).
- Form/error handling: required HTML fields and input types supply native validation; JS cancels submission and returns if `reportValidity()` is false. Optional fields fall back to `Not provided` (`index.html`, `js/main.js`).
- Data flow: `new FormData(inquiryForm)` reads form values; `encodeURIComponent` encodes the email subject/body and `window.open(mailtoUrl, "_blank", ...)` delegates to the visitor's mail app (`js/main.js`, `js/main-preview.js`). No backend persistence appears in those handlers.
- Navigation: an inline click handler in both HTML pages scrolls to `#` destinations, removes the visible hash via `history.replaceState`, and moves focus for the skip link (`index.html`, `index2.html`).
- Typing/docs/lint: JavaScript is plain untyped `.js`, with no JSDoc declarations in the inspected handlers (`js/main.js`, `js/main-preview.js`). No formatter/lint configuration appeared in the root listing; `README.md` is the human-readable setup document.

## 6. Architecture and key decisions
- Each HTML page references its own stylesheet and external JS handler and shares assets from `images/` (`index.html`, `index2.html`).
- The site is static: the inquiry button opens a prefilled `mailto:` draft, **not** an automatic email send or server submission (`README.md`, `js/main.js`).
- GitHub Pages/custom domain routing is described in `README.md`; `CNAME` and `.nojekyll` exist. Current Pages, DNS and HTTPS settings were not verified.
- There is no standalone architecture decision record in the inspected tree; use `README.md` for documented setup and `CHANGELOG.md` for observed decisions and promotions.
- Preview/production changes are deliberately separate, evidenced by `index2.html` preview controls and the staging/promotion entries in `CHANGELOG.md`.

## 7. Versioning and changelog
- The latest recorded release-like version is **0.1.24** (`CHANGELOG.md`); no separate version constant or release script was located in inspected files.
- Historical entries use `## [major.minor.patch] - YYYY-MM-DD`, a category heading (e.g. `### Changed`), then `- ` bullet lines. `## [Unreleased]` comes first.
- Observed sequence increments patch numbers (e.g. 0.1.23 to 0.1.24). **UNVERIFIED:** no file documents a mandatory bump procedure beyond the changelog's observed format.
- Copy of the latest entry, as found in `CHANGELOG.md`:

```markdown
## [0.1.24] - 2026-10-14

### Changed

- Promoted the approved intake-form section placement from staging to production `index.html`: testimonials now precede the parent inquiry form, which appears immediately before the service-area section.
- Moved the existing production contact section intact; preserved all form fields, validation attributes, `#contact` anchor links, submission integration, recipient instructions, and testimonial contents.
- Preserved production-only title, CSS and JavaScript references, metadata, and search-engine visibility; did not introduce preview banner or `noindex` controls.
- Kept `index2.html` unchanged as the staging reference.
- Verified unique form/contact anchors, two direct `#contact` links, expected section order, and balanced section tags.
```
- Preserve all historical `CHANGELOG.md` entries. For meaningful authorized future changes, increment the version and append a properly categorized entry; do not replace history. **Current guide-only task exception:** change no file except this guide.

## 8. Hard constraints
### Global rules (all projects)
- Preserve working functionality unless a change is explicitly authorized.
- Prefer incremental changes over rewrites.
- Never silently alter production systems.
- Validate syntax and indentation after every change.
- Run relevant tests, report the outcomes, and check for regressions.
- Bump the version for meaningful changes and add a changelog entry.
- Document significant architectural decisions.
- Provide a backup or recovery path before any data migration, and protect existing user data.
- Do not claim completion without testing.
- Avoid unnecessary dependencies and complexity.

### Website rules (rule set A)
- Never modify index.html without explicit approval to promote tested changes from index2.html.
- All experiments, layout changes and new content go in index2.html first.
- index2.html must keep its preview banner and metadata and stay hidden from search indexing. index.html must stay publicly indexable.
- Never assume a change in index2.html has been promoted to production.

### Repo-grounded constraints
- Keep the public `index.html` references separate from `index2.html` preview references and preserve the preview notice and robots metadata (both HTML files).
- Do not disclose secrets, credentials, or private student/family data in source or documentation; the site already contains public testimonial copy (`index.html`). Do not reproduce identifying testimonial content in this guide.
- The user authorized **only** creation of `CLAUDE.md` (or `CLAUDE.proposed.md` if it existed); do not edit the HTML, assets, README, or changelog as part of this task.

## 9. Known issues and landmines
- `README.md` still describes an earlier Gmail inquiry address; `index.html`, `index2.html`, `js/main.js`, and `js/main-preview.js` currently use the domain mailbox. Treat README's recipient instructions as stale.
- `index.html` footer still says `Learning with care.`; `index2.html` has `Building Understanding. Developing Independence.`. This is an existing production/staging difference, **not** authority to promote it.
- Both HTML pages currently comment out the decorative `.break-free` banner markup; related CSS selectors remain in `css/styles.css` and `css/styles-preview.css`.
- Email draft creation depends on browser popup/`mailto:` behavior and a configured local email handler; the handler never verifies delivery (`js/main.js`). No successful browser end-to-end test was observed.
- The inquiry draft places entered fields into a URL-encoded `mailto:` URL; large free-text answers may expose length/handler limitations. This is a code-based risk, not a reproduced failure (`js/main.js`).
- Preview and public stylesheets are separate full files, so a preview CSS fix does not automatically modify public CSS (`css/styles*.css`).

## 10. Current state
- **Implemented in code; read, not executed here:** public and preview pages, navigation handler, testimonials, parent form, `mailto:` draft generation, responsive styles, referenced imagery (`index.html`, `index2.html`, `js/main*.js`, `css/styles*.css`).
- **Recorded in changelog; inspected:** version 0.1.24 documents the approved production relocation of the inquiry section beneath testimonials (`CHANGELOG.md`, `index.html`).
- **Partial/deliberately separate:** staging footer differs from production; preview banner and `noindex` controls exist only on staging (`index.html`, `index2.html`).
- **Missing from inspected repository:** executable test/build pipeline and dependency manifest. **UNVERIFIED:** real-world Pages deployment status, actual email-app interoperability and accessibility/browser regression test outcomes.
- **Verification performed:** repository file reads and structure inspection only; no tests or browser executions were run.

## 11. Unknowns
- **UNVERIFIED:** actual GitHub Pages source settings, domain DNS/HTTPS state, and whether deployed pages exactly match inspected `main` contents; repo files alone do not prove these.
- **UNVERIFIED:** minimum supported browsers and end-to-end form/`mailto:` success, including blocked popups and long messages; no automated or manual run was performed.
- **UNVERIFIED:** canonical release/version-bump procedure beyond historical `CHANGELOG.md` entries; no release script or policy file was found.
- **UNVERIFIED:** whether an external deployment/test service exists outside the inspected repository; no such configuration was present in the tree.

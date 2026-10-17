# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

## [0.1.26] - 2026-10-17

### Added

- Added the standalone FP-LCARS command station at `lcars.html`, with isolated local CSS, JavaScript, font and original reference audio assets.
- Applied First Principles Learning Command Station branding, top-right registry `FPL 221987`, interface label `LCARS / FPLearning`, and the FPLearning Interlink sidebar link.
- Defaulted search to Google.ca and provided editable destinations including Google Maps, Spotify and the existing FPL Resources file library.
- Animated the network-access scanner line through stationary rings using a lightweight CSS rotation, with a static alternative for reduced motion.
- Kept preferences in browser local storage and supplied an optional page-audio toggle using the reference website's unchanged sound files.
- Included font licensing, audio provenance and setup documentation. Kept the page unlisted with noindex metadata.
- Preserved the production homepage, staging page and their existing assets.

## [0.1.25] - 2026-10-15

### Added

- Created an independent, responsive FPL-branded administrative file library at `files.htm` using the existing navy/gold colour palette, FPL logo, favicon, and footer slogan.
- Added recursively expandable and collapsible folder sections that discover new files and nested folders under `files/FPLFiles/` from the public GitHub tree API, with a manual refresh control.
- Added appropriate download links for ordinary resources and open-in-new-tab links for `.htm`/`.html` mini-apps, including safe text-only rendering of repository filenames.
- Published a `Brand/` example collection mirroring six existing FPL logo and favicon assets, reusing their original Git blob objects rather than generating or altering images.
- Included accessible status messaging, mobile layout, and static fallback links for the six starter Brand assets if dynamic discovery fails.
- Added `noindex, nofollow, noarchive` metadata and deliberately omitted any public homepage link or navigation promotion.
- Documented how to add files/folders, how live discovery behaves, and why content must not contain sensitive information.

### Verified

- JavaScript parsed successfully; new CSS has balanced brace delimiters and matches production brand colours.
- Existing production `index.html` and staging `index2.html` remain unchanged, and no installer was added.


## [0.1.24] - 2026-10-14

### Changed

- Promoted the approved intake-form section placement from staging to production `index.html`: testimonials now precede the parent inquiry form, which appears immediately before the service-area section.
- Moved the existing production contact section intact; preserved all form fields, validation attributes, `#contact` anchor links, submission integration, recipient instructions, and testimonial contents.
- Preserved production-only title, CSS and JavaScript references, metadata, and search-engine visibility; did not introduce preview banner or `noindex` controls.
- Kept `index2.html` unchanged as the staging reference.
- Verified unique form/contact anchors, two direct `#contact` links, expected section order, and balanced section tags.


## [0.1.23] - 2026-10-14

### Changed

- Relocated the existing parent inquiry form on the staging page `index2.html` from above the testimonials to directly below the success stories and before the service-area section.
- Preserved the form fields, required attributes, labels, input IDs, submission behavior, recipient email, explanatory note, and JavaScript integration without rewriting the form.
- Retained the `#contact` anchor target used by the primary navigation and hero call-to-action, allowing visitors to jump directly to the form.
- Preserved the parent, student, and former-student testimonials and their order, plus the preview banner and `noindex, nofollow` metadata.
- Left the production page `index.html` and production assets unchanged, pending explicit approval.


## [0.1.22] - 2026-10-08

### Changed

- Replaced the preview footer slogan “Learning with care.” with “Building Understanding. Developing Independence.”
- Restricted the text change to the staging page `index2.html`; kept footer markup, layout, and all unrelated content unchanged.
- Preserved the public production page `index.html` without modification.

## [0.1.21] - 2026-09-23

### Changed

- Broadened the preview service-area heading from Canada alone to Canada and beyond.
- Clarified that First Principles Learning occasionally supports students beyond Canada while preserving its Canadian ownership and operation message.
- Kept the Canadian badge and all unrelated page content unchanged.
- Left the production page unchanged pending explicit approval.


## [0.1.20] - 2026-09-23

### Changed

- Promoted the approved complete mobile navigation to the public page.
- Kept Our approach, Testimonials, and Get in touch visible in a full-width mobile navigation row.
- Preserved 44-pixel minimum touch targets for comfortable use on mobile screens.
- Updated the production stylesheet cache version so the mobile navigation loads immediately.
- Preserved public metadata and search-engine accessibility without transferring preview-only controls.


## [0.1.19] - 2026-09-23

### Changed

- Restored the full navigation on mobile in the preview so Our approach, Testimonials, and Get in touch remain directly accessible.
- Arranged the mobile navigation as a full-width row beneath the brand with spacing suitable for narrow screens.
- Added 44-pixel minimum touch targets to the preview navigation links.
- Updated the preview stylesheet cache version so the mobile navigation correction loads immediately.
- Left the production page and stylesheet unchanged pending explicit approval.


## [0.1.18] - 2026-09-23

### Changed

- Promoted the approved testimonial order to the public page: Parent, Student, then Former Student.
- Preserved all testimonial wording, attribution labels, names, credentials, and styling.
- Preserved public metadata and search-engine accessibility without transferring preview-only controls.


## [0.1.17] - 2026-09-23

### Changed

- Reordered the preview testimonials by perspective: Parent, Student, then Former Student.
- Kept the revised order confined to `index2.html` pending explicit approval.
- Preserved all testimonial wording, attribution labels, names, credentials, and styling.


## [0.1.16] - 2026-09-23

### Changed

- Promoted the approved testimonial introduction from `index2.html` to the public page.
- Promoted the approved top alignment for the success-stories introduction so it aligns with the first testimonial instead of the vertical centre of the full testimonial list.
- Updated the production stylesheet cache version so the corrected alignment loads immediately.
- Preserved public metadata, search-engine accessibility, and all preview-only controls.


## [0.1.15] - 2026-09-23

### Changed

- Reworked the preview testimonial introduction to represent feedback from parents, current students, and former students.
- Kept the testimonial heading top-alignment proposal confined to `index2.html` and the preview stylesheet.
- Verified that the preview retains all currently approved production content, including the favicon, domain email, experience statement, testimonial content, and inquiry behavior.
- Left `index.html` and the production stylesheet unchanged pending explicit approval.


## [0.1.14] - 2026-09-23

### Fixed

- Restored the production testimonials section to its previously approved vertically centred alignment.
- Moved the proposed top-aligned success-stories introduction to `index2.html` and the preview stylesheet for visual review only.
- Updated both production and preview stylesheet cache versions so each page loads its intended layout immediately.


## [0.1.13] - 2026-09-23

### Changed

- Top-aligned the success-stories introduction with the first testimonial on desktop so the section is immediately recognizable.
- Preserved the existing single-column mobile layout and all testimonial content and styling.
- Updated the production stylesheet cache version so the alignment correction loads immediately.

## [0.1.12] - 2026-09-23

### Changed

- Promoted `info@fplearning.ca` to every public contact reference and inquiry-draft recipient.
- Promoted the approved tight-crop FPL favicon to the public browser tab.
- Added a production JavaScript cache version so the new inquiry recipient loads immediately.
- Preserved public metadata and search-engine accessibility without transferring any preview-only controls.

## [0.1.11] - 2026-09-23

### Changed

- Replaced the preview favicon with the tighter supplied FPL icon crop so the logo occupies more of the browser-tab icon area.
- Preserved the favicon as a preview-only embedded image while leaving production untouched.

## [0.1.10] - 2026-09-23

### Added

- Added the supplied FPL dark icon as the preview page's browser-tab favicon.
- Embedded the favicon directly in `index2.html` so production assets and `index.html` remain untouched during review.

## [0.1.9] - 2026-09-23

### Changed

- Replaced all preview-page references to the former Gmail address with `info@fplearning.ca`.
- Added a preview-only inquiry script so prepared email drafts use the new domain address without changing production behavior.
- Updated the preview script reference with a cache version so the new recipient loads immediately.

## [0.1.8] - 2026-09-23

### Changed

- Promoted the approved experience and family-history statement to the public hero section.
- Promoted the approximately 25 percent smaller "There are no strings on me!" banner to production.
- Promoted the Parent, Former Student, and Student testimonial perspective labels to the public site.
- Updated the production stylesheet cache version so all approved refinements load immediately.
- Preserved public metadata, search-engine accessibility, and testimonial privacy conventions.

## [0.1.7] - 2026-09-23

### Added

- Added compact gold perspective labels above each preview testimonial attribution: Parent, Former Student, and Student.

### Changed

- Reworked preview testimonial attribution layout so each role appears directly above the existing name and credential line.
- Updated the preview stylesheet cache version so the new labels load immediately.

### Privacy

- Preserved the testimonial naming rule: parents use first name and last initial, while students use first name only.

## [0.1.6] - 2026-09-23

### Changed

- Updated the preview hero introduction to state more than 20 years of experience working with over 100 families.
- Added that First Principles Learning often supports more than one student within the same household.
- Connected this experience directly to the site's emphasis on consistent, long-term educational support.

## [0.1.5] - 2026-09-22

### Changed

- Reduced the preview page's "There are no strings on me!" banner by approximately 25 percent, including its container, spacing, headline, decorative circles, and celebration marks.
- Updated the preview stylesheet cache version so the resized banner loads immediately.

## [0.1.4] - 2026-09-22

### Added

- Promoted Anthony's and Anna's approved student testimonials to the public site.

### Changed

- Promoted the stacked testimonial-card layout to the production stylesheet.
- Updated the production stylesheet cache version so the approved layout loads immediately.
- Preserved all public metadata and search-engine accessibility settings.

## [0.1.3] - 2026-09-22

### Added

- Added student testimonials from Anthony, a BBA graduate, and Anna, a Grade 11 Honour Roll student to the preview page.

### Changed

- Grouped preview testimonial cards into a vertically spaced list for consistent two-column section layout.
- Updated the preview stylesheet cache version to ensure the new testimonial layout loads immediately.

## [0.1.2] - 2026-09-22

### Changed

- Promoted the approved hash-free in-page navigation behavior from the preview page to the public `index.html`.
- Preserved production metadata and search-engine accessibility; no preview banner, preview title, preview stylesheet, or `noindex` directive was transferred.

## [0.1.1] - 2026-09-22

### Changed

- Updated preview-only in-page navigation so section links scroll without leaving hash fragments in the browser address bar.
- Preserved keyboard focus behavior for the preview page's skip link.

## [0.1.0] - 2026-09-19

### Added

- Initial static site structure.
- Responsive First Principles Learning landing page, styles, and minimal client-side script.
- Local Git repository and project housekeeping files.

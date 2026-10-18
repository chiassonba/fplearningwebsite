# Math Lab source

Public address: https://fplearning.ca/math-lab/

This component contains the public Function Explorer, pure mathematics and local KaTeX rendering. Notebook development is on hold. There are no classroom accounts or API dependencies in this entry point.

Use Node.js 24. In this directory, install with npm install --ignore-scripts, run npm test, then npm run build. Commit the updated source and generated ../math-lab assets together. The rest of the website has no build step.

The build uses relative asset paths for subdirectory hosting. Keep the website root CNAME as fplearning.ca. No DNS changes are required for this path.

The initial public build was checked in FPLab with TypeScript and browser tests, including first-principles IROC, export/replay, both themes and 320px layout. Package versions are pinned; the first install should retain the generated package-lock.json for subsequent npm ci --ignore-scripts installs.

React, React DOM, KaTeX and Zod licence notices are in ../math-lab/licenses/.

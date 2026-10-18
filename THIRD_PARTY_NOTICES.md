# Third-Party Notices

Relay uses third-party packages and may include third-party assets. This file is an initial inventory guide, not a complete license audit. Check the exact versions in `package-lock.json`, each package's published license, and the provenance of all bundled assets before a release.

## Runtime dependencies

The current `package.json` declares the following direct runtime dependencies:

- `@fortawesome/fontawesome-svg-core`
- `@fortawesome/free-regular-svg-icons`
- `@fortawesome/free-solid-svg-icons`
- `@fortawesome/react-fontawesome`
- `clsx`
- `i18next`
- `idb`
- `jspdf`
- `react`
- `react-dom`
- `react-i18next`
- `react-router-dom`

## Development and build dependencies

The current `package.json` also declares build, test, type-checking, and styling dependencies including Vite, TypeScript, Vitest, Testing Library, Tailwind CSS, the Vite PWA plugin, and Oxlint. Consult `package.json` and `package-lock.json` for the complete versioned list.

## Assets

The repository includes application icons and other static assets. Asset authorship and license provenance must be verified individually before redistributing the project. Do not assume that an asset is covered by the license of a JavaScript package or by Relay's custom license.

## Before release

- Generate or review a complete third-party license inventory from the lockfile.
- Confirm the license and attribution requirements for each direct and transitive dependency.
- Identify the origin and license of bundled images, icons, fonts, audio, and other media.
- Preserve required upstream notices and provide any required source or attribution.
- Update this file with exact names, versions, license identifiers, and source links where required.

Third-party materials remain under their own licenses. Relay's custom license does not override rights or obligations granted by those licenses.

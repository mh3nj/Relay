# Third-Party Notices — Audit Required Before Release

Relay uses third-party packages and includes third-party or generated assets. This file is a preparation checklist, **not a completed attribution inventory**. Do not publish it as proof that every dependency and asset has been audited.

## Dependencies to inventory

The supplied `package.json` includes (among others):

- React and React DOM
- Vite and `@vitejs/plugin-react`
- TypeScript
- Tailwind CSS and `@tailwindcss/vite`
- React Router DOM
- i18next and react-i18next
- `idb`
- `vite-plugin-pwa`
- Font Awesome packages
- Vitest and Testing Library
- jsdom
- oxlint
- jsPDF

This list is illustrative and should be generated from the exact lockfile and installed dependency tree for the release being published. Transitive dependencies also have license terms.

## Required release audit

- [ ] Generate a dependency license inventory from the lockfile / installed package metadata.
- [ ] Review licenses for direct and transitive dependencies.
- [ ] Review all fonts, icon packs, images, illustrations, sound effects, maps, and other bundled assets.
- [ ] Identify assets created by the maintainer versus assets from third parties.
- [ ] Include required copyright notices, attribution text, and license copies.
- [ ] Confirm that the planned Relay license does not purport to remove rights granted by third-party licenses.
- [ ] Confirm any font, map, or icon redistribution requirements are met.
- [ ] Re-run the audit when dependencies or assets change.

## Asset provenance

The repository contains image assets under `src/assets/` and `public/`, including app icons and a collection of map-like PNG assets. Their provenance and redistribution terms must be verified by the maintainer before public release.

## Reporting an omission

If you identify a missing notice or an asset whose origin is unclear, please report it privately to the maintainer before publicly redistributing it.

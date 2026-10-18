# Relay GitHub Repository Setup Checklist

This checklist is designed for `https://github.com/mh3nj/Relay`. It does not change GitHub settings automatically.

## Before publishing this package

- [ ] Review README claims against the current branch and remove anything no longer accurate.
- [ ] Capture real screenshots from the current app; add them under `docs/images/` and link them in the README. Do not use concept art as if it were an app screenshot.
- [ ] Decide whether a live demo will be hosted. If so, verify the URL and update the README.
- [ ] Remove `dev.pid`, `dev.log`, generated output, personal files, and local-only configuration from the Git index. The supplied `.gitignore` excludes `*.pid` and `*.log`, but verify tracked files with `git ls-files`.
- [ ] Search the repository and Git history for API keys, tokens, personal data, private backups, and environment files.
- [ ] Verify `package-lock.json` matches `package.json`.
- [ ] Run `npm ci`, `npm test`, `npm run lint`, and `npm run build` on a clean checkout; fix failures or document them accurately.
- [ ] Complete `THIRD_PARTY_NOTICES.md` from package metadata and asset provenance.
- [ ] Finalize the custom license with qualified legal review; move the final text into a root-level `LICENSE` file and update README links/wording.
- [ ] Ensure the license permits the contribution workflow you want, including reviewed contributions and private personal modifications.
- [ ] Decide and publish a contact path for security reports.
- [ ] Review the privacy guide against every outbound request and storage mechanism in the release branch.

## GitHub repository settings

- [ ] Repository description: `Offline-first Morse code learning platform with lessons, practice modes, games, audio tools, and local progress tracking.`
- [ ] Suggested topics: `morse-code`, `morse-code-learning`, `morse-code-trainer`, `typescript`, `react`, `vite`, `pwa`, `offline-first`, `audio-processing`, `learning-app`.
- [ ] Add the README, license (only when finalized), security policy, and contribution guide to the repository root.
- [ ] Enable Issues only if you intend to review them; use the supplied issue templates.
- [ ] Enable pull requests only if reviewed external contributions are part of your workflow.
- [ ] Add branch protection/rulesets for `main`: require CI checks, block force pushes, and require review if you want a review gate.
- [ ] Verify GitHub Actions permissions are minimal and that CI runs on pull requests.
- [ ] Configure private vulnerability reporting / GitHub Security Advisories if available and desired; update `SECURITY.md` to point to the actual configured channel.
- [ ] Set a repository social preview image after preparing a branded image with correct dimensions and no unlicensed assets.
- [ ] Add a verified website URL only after deployment exists.
- [ ] Create the first release only after checks pass and third-party licensing is audited.

## Suggested first release sequence

1. Complete the legal and asset audit.
2. Merge the documentation and CI setup.
3. Wait for CI to pass on the exact commit.
4. Test production deployment, direct route refreshes, installability, offline reload, backup export/import, and optional AI disclosure.
5. Add release notes and tag a version.
6. Publish a short changelog entry and a verified demo URL, if applicable.

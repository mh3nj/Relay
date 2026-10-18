# Contributing to Relay

Thanks for taking an interest in Relay. Contributions are reviewed by the maintainer; opening a pull request does not guarantee acceptance or publication.

## Before you start

1. Read the repository's license and third-party notices.
2. For substantial changes, open an issue or discussion first so the direction can be agreed upon.
3. Do not submit secrets, API keys, personal backups, private logs, or copyrighted assets without permission.
4. Keep contributions focused and explain the user-facing reason for the change.

## Licensing and contribution permission

Relay is intended to use a custom personal-use license, not a conventional open-source license. Until the operative license is finalized, do not assume that contributing grants you or others broad redistribution rights.

By submitting a contribution, you confirm that you have the right to submit it and that you identify any third-party code, assets, or special terms. The maintainer may ask you to clarify provenance or sign a separate contribution agreement before accepting a substantial contribution. Do not assume that a pull request automatically transfers copyright or grants relicensing permission.

The maintainer must finalize the project's contribution and licensing terms before accepting external contributions into a public release.

## Local development

```bash
npm ci
npm run dev
```

## Checks

Run these before opening a pull request:

```bash
npm test
npm run lint
npm run build
```

Include the actual output/status of relevant checks in the pull request. If a check cannot be run, say so rather than implying it passed.

## Code expectations

- Preserve existing TypeScript types and avoid introducing `any` without a clear reason.
- Keep feature-specific behavior in the relevant feature module and reusable logic in shared libraries where practical.
- Preserve translation keys across all locale files; do not hard-code user-facing strings if they belong in the i18n system.
- Test right-to-left behavior when touching shared layout or localization code.
- Keep accessibility, keyboard use, reduced-motion preferences, and audio controls in mind.
- Avoid adding a dependency for a small utility that can be implemented safely with existing tools.
- Do not add telemetry, external services, or new outbound network requests without documenting them and receiving maintainer approval.

## Pull request checklist

- [ ] The purpose and behavior change are explained.
- [ ] Tests were added or updated where appropriate.
- [ ] `npm test` passes, or any failure is described.
- [ ] `npm run lint` passes, or any failure is described.
- [ ] `npm run build` passes, or any failure is described.
- [ ] User-facing text is localized where appropriate.
- [ ] No secrets, private data, or unlicensed assets are included.
- [ ] Privacy, offline, and backup behavior is documented if affected.

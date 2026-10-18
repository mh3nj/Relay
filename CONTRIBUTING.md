# Contributing to Relay

Thank you for your interest in improving Relay. Contributions are welcome for review, but the maintainer decides whether to accept, revise, or decline each submission.

## Before you start

1. Read the root [LICENSE](LICENSE) and confirm you understand its personal-use and non-commercial sharing terms.
2. Check existing issues and pull requests to avoid duplicating work.
3. For a substantial change, open an issue first to discuss the problem and intended approach.
4. Never include API keys, private user data, personal backups, or credentials in a commit.

## Development setup

Use a current Node.js LTS version compatible with the project's Vite toolchain.

```bash
npm ci
npm run dev
```

Useful verification commands:

```bash
npm test
npm run lint
npm run build
```

Run relevant checks before submitting. If a check cannot be run in your environment, say so explicitly rather than reporting it as passing.

## Pull request expectations

- Keep each pull request focused on one coherent change.
- Explain the user problem, the solution, and any trade-offs.
- Include reproduction steps for bug fixes and tests for behavior changes where practical.
- Update documentation and locale resources when user-facing behavior changes.
- Preserve existing accessibility, reduced-motion, keyboard, responsive, and right-to-left behavior.
- Avoid adding dependencies unless the benefit justifies the maintenance and bundle cost.
- Do not commit build output, logs, PID files, local environment files, or generated personal data.
- Clearly disclose any AI-assisted contribution if requested during review.

## Licensing and contributions

Only submit work you created or are legally permitted to contribute. By intentionally submitting a contribution for inclusion, you confirm that you have the right to submit it and grant the rights described in the root license. The maintainer may request clarification about provenance or licensing before accepting a contribution.

Submitting a pull request does not transfer copyright automatically and does not guarantee acceptance. Discuss any proposed alternative licensing before sending substantial work.

## Reporting bugs

Use GitHub Issues for non-sensitive, reproducible bugs and feature requests. Include the browser, operating system, steps to reproduce, expected result, actual result, and relevant console output with personal data removed.

For security-sensitive issues, follow [SECURITY.md](SECURITY.md) instead of filing a public issue.

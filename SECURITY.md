# Security Policy

## Reporting a vulnerability

Please do not publish exploitable vulnerabilities, API keys, personal backups, or sensitive logs in a public issue.

Until a private GitHub Security Advisories channel or another verified private reporting address is configured, contact the maintainer through a private GitHub communication channel associated with [`mh3nj`](https://github.com/mh3nj). Do not assume that a public issue is confidential.

When reporting, include:

- A concise description of the suspected issue.
- Affected route, feature, browser, and version/commit if known.
- Reproduction steps that do not expose real secrets or personal data.
- Potential impact and any safe proof of concept.

Please give the maintainer a reasonable opportunity to investigate and prepare a fix before publicly disclosing a vulnerability.

## Scope notes

Relay is a browser application. The optional AI assistant sends prompts to the provider endpoint configured by the user. Reports involving third-party AI providers should distinguish Relay behavior from provider-side handling. Do not test against another person's API key, data, or deployment without explicit authorization.

## Supported versions

No formal version-support policy has been declared yet. Until releases are tagged and a policy is published, the current default branch is the primary development target, without a guarantee of response time or remediation timeline.

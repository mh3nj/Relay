# Security Policy

## Supported versions

Security fixes are currently evaluated against the latest code on the default branch. There is no published stable release or formal support window yet.

## Reporting a vulnerability

Please do not publish exploitable vulnerabilities, API keys, personal data, or sensitive backups in public issues.

Use GitHub's private vulnerability reporting feature for this repository if it is enabled. If private reporting is unavailable, contact the maintainer at **anoushzadparsi@gmail.com** with a concise description and a safe way to reproduce the issue. Avoid sending secrets or real user data.

Please include, where possible:

- affected file, feature, or commit;
- impact and realistic attack scenario;
- reproduction steps or a minimal proof of concept;
- any proposed mitigation.

## Response expectations

This is an individually maintained project, so response and remediation times are not guaranteed. The maintainer will assess the report, may request additional information, and will coordinate disclosure where practical. Please allow time for investigation and a fix before public disclosure.

## Secrets and AI provider keys

Never commit API keys, access tokens, passwords, private backups, or environment files. If a credential is exposed, revoke or rotate it with the issuing provider immediately; removing it from a later commit does not make the exposed credential safe.

Optional AI integration sends requests to the provider configured by the user. Review the provider's terms and privacy practices and avoid transmitting sensitive information.

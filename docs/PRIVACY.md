# Privacy and Data Handling

Relay is designed as a browser-first learning application. This document describes the intended behavior of the source currently being prepared for publication; verify it against the exact deployed build before making privacy claims about a hosted instance.

## Local application data

The application uses browser storage for user-facing state and progress. Browser storage is scoped to the browser profile and site origin, not to a Relay account. It may be lost if site data is cleared, the browser profile is removed, storage is evicted, or the device fails.

Use the application's backup/export controls to keep an independent copy of data you care about. Treat exported backups as personal data: anyone who obtains a backup may be able to inspect its contents.

## Network requests

Core learning features are designed to work without a Relay-owned application backend. Normal web delivery, PWA resource caching, and any configured external features can still involve network requests.

### Optional AI assistance

AI functionality is optional and depends on the provider and endpoint configured by the user. When enabled, the relevant prompt or request content is sent to that external provider over the network. The provider's privacy policy, retention practices, and terms apply to those requests.

Do not send sensitive personal information, passwords, API secrets, or data you do not have permission to disclose. Keep provider API keys private and out of public issues, source files, screenshots, and backups.

## Data minimisation and user control

- No Relay account is required by the supplied application source.
- Use in-app settings and backup/export controls to manage local application data.
- Removing the application or clearing browser data may remove local progress; export a backup first.
- Do not assume local data synchronises between browsers or devices unless you explicitly configure a separate mechanism.

## Third-party services and dependencies

The browser, hosting provider, optional AI provider, and third-party dependencies may have their own data practices. This document does not supersede their policies.

## Reporting a privacy concern

For a reproducible privacy or data-handling concern, use the private reporting route described in [SECURITY.md](../SECURITY.md). Avoid posting personal data, exported backups, or secrets in public issues.

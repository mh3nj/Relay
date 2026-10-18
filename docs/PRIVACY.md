# Relay — Privacy and Data Guide

This guide describes behavior visible in the supplied source snapshot. It is not a guarantee about a future deployment, hosting provider, browser extension, or modified build. Re-check the implementation before each release.

## Design approach

Relay does not implement a mandatory user account or a Relay-owned application backend in the supplied source. Core application records are stored in the browser using IndexedDB, with the chosen language stored in local storage.

## Data stored in the browser

Depending on which features you use, browser storage can contain settings, learning progress, practice/session statistics, custom dictionaries, game scores, review information, and related application records. This data is associated with the browser profile and site origin. It is not automatically synced across devices by Relay.

Browser storage can be cleared by the user, browser, privacy software, or device management policies. Export backups if you want to preserve your data.

## Backups

Relay supports JSON backup export and restoration. In the current source, backup export excludes `aiSettings`, `autoBackupSnapshot`, and `lastAutoBackupAt`; the AI settings exclusion is also applied during import. This protects the configured provider key from being placed in an exported backup by the ordinary backup implementation.

Backups may still contain personal learning history or custom dictionary data. Store them carefully and only import files you trust.

## Optional AI assistant

AI assistance is optional and disabled by default. To use it, the user configures a provider and supplies their own API key. The current implementation supports OpenAI, Anthropic, and a custom HTTPS endpoint.

When a user submits a prompt, Relay sends the relevant chat messages directly from the browser to the configured endpoint. The provider receives that request and processes it under its own terms and policies. Network requests may reveal ordinary request metadata such as IP address and user-agent to the provider. Relay cannot control a provider's retention, training, billing, or processing practices.

The API key is stored in the browser's IndexedDB settings and is not included in the app's normal backup export. Anyone with access to the same unlocked browser profile or developer tools may still be able to access client-side stored data. Do not use a personal API key on a shared or untrusted device.

Custom endpoints must begin with `https://` in the current code. Only configure endpoints you trust. The user is responsible for any provider charges and for complying with the provider's terms.

## Fonts and network activity

The PWA configuration includes runtime caching for Google Fonts stylesheets and font files. When those assets are requested while online, the browser may contact `fonts.googleapis.com` and `fonts.gstatic.com`. This means that “offline-first” should not be read as “no network requests ever.” AI use also requires a network connection.

## Offline behavior

The service-worker configuration precaches the production app shell and common static assets. Offline behavior depends on a successful initial load/cache, browser support, storage availability, and the feature being used. Provider-backed AI cannot work offline. Do not assume every external asset or every browser feature is available offline.

## Data deletion

Use the app's available reset controls where appropriate and clear the site's storage through your browser if you want to remove local records. Clearing browser data can also remove useful settings and progress. Export first if you want a copy.

## Reporting a privacy concern

Please report suspected privacy or data-handling issues privately using the instructions in [`../SECURITY.md`](../SECURITY.md). Do not attach API keys, personal backups, or sensitive logs to a public issue.

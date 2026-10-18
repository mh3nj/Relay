<div align="center">
  <img src="public/icons/Relay-1.png" alt="Relay app icon" width="112" />
  <h1>Relay</h1>
  <p><strong>Learn Morse. Hear the signal. Build the skill.</strong></p>
  <p>An offline-first Morse code learning platform built around structured lessons, deliberate practice, signal tools, games, and personal progress.</p>
  <p>
    <a href="https://github.com/mh3nj/Relay">Repository</a> ·
    <a href="https://github.com/mh3nj/Relay/issues">Issues</a> ·
    <a href="SECURITY.md">Security</a> ·
    <a href="docs/PRIVACY.md">Privacy & data</a>
  </p>
</div>

---

## What is Relay?

Relay is a browser-based Morse code learning environment designed to bring the learning loop into one place: encounter a signal, practise recognising or sending it, review mistakes, and track progress over time.

Rather than focusing only on text-to-Morse conversion, Relay combines a structured learning path with practice modes, interactive games, audio tools, a reference encyclopedia, and locally stored progress. It is built as an installable Progressive Web App (PWA), with an offline-first approach after the app has been loaded and cached by a supported browser.

**Relay is free to use for personal learning.** Its source is published for inspection under a planned custom personal-use license; it is not intended to grant unrestricted commercial or redistribution rights. See [License status](#license-and-permitted-use) before reusing any code or assets.

> **Live demo:** No public deployment URL has been provided yet. The repository is the source of truth for the current implementation.

## At a glance

- **Learn:** Koch-style lesson progression, character-focused learning, mnemonic aids, signal exploration, and transmission practice.
- **Practise:** speed, endless, flashcard, hear-and-type, memory, read-and-type, and translation drills.
- **Play:** five built-in games designed to make recognition and recall more engaging.
- **Translate and analyse:** text/Morse conversion, audio-file decoding, signal analysis, custom dictionaries, and WAV export.
- **Measure progress:** XP, levels, streaks, badges, character mastery, review scheduling, mistake tracking, and WPM trends.
- **Look things up:** a reference encyclopedia for characters, Morse sequences, timing, and procedural signals.
- **Make it yours:** eleven interface languages, light and dark themes, audio/timing controls, accessibility settings, and optional AI assistance.
- **Keep your data local:** browser-based persistence and portable JSON backups, without a Relay account or app-owned backend in the supplied source.

## Product areas

### Learn

The learning area is organised around incremental character learning and repeated exposure. Source modules include lesson navigation and progress, character-focused presentation, mnemonics, a Morse-tree explorer, signal analysis, and transmission practice.

### Practice

Practice modes let learners work on different forms of recall rather than relying on a single exercise format:

- Speed mode
- Endless practice
- Flashcards
- Hear and type
- Memory mode
- Read and type
- Translation drills

### Games

Relay includes five game modules:

- **Morse Invaders**
- **Signal Rush**
- **Decode & Translate**
- **Morse Match**
- **Emergency Relay**

### Translator and signal tools

The translator area includes text/Morse conversion, audio-file decoding, signal-analysis UI, custom-dictionary editing and selection, export controls, and WAV-generation support. The decoder implementation includes envelope smoothing, adaptive thresholding, glitch filtering, timing estimation, and signal classification. Actual decoding quality depends on the input recording, signal conditions, and browser support; it should not be treated as guaranteed for every audio file.

### Progress and review

Progress tools include experience points and levels, streaks, badges, character mastery, due-for-review information, a mistake notebook, calendar heatmap, and trend charts. These are intended to make practice history and areas needing attention easier to inspect.

### Encyclopedia

The encyclopedia provides searchable/filterable character reference material and a prosigns table. Consult it as a learning reference; it is not a substitute for authoritative operational procedures where those matter.

## Privacy, storage, and AI

Relay is designed to operate without a Relay account or application backend. In the supplied source:

- Application records are stored in browser IndexedDB; the selected interface language is stored in local storage.
- Users can export and restore a JSON backup of supported application data.
- AI settings and the configured provider API key are excluded from backup exports.
- AI assistance is disabled by default and requires the user to configure a provider and key.
- When AI is used, the submitted conversation is sent directly from the browser to the configured provider endpoint. The provider's terms, retention practices, and charges apply. Custom endpoints must use HTTPS in the current implementation.
- The PWA configuration caches the application shell for repeat/offline visits. The configuration also includes runtime caching for Google Fonts stylesheets and font files, so those requests may contact Google's infrastructure when online.

Offline availability depends on the app having been loaded and cached, the browser's storage/service-worker support, and the specific feature. AI requests require a network connection. Browser storage can be cleared or evicted, so export backups if the data matters to you.

Read the fuller [Privacy and data guide](docs/PRIVACY.md) before using optional network features.

## Languages and interface

The source registers eleven interface locales:

| Code | Language | Direction |
|---|---|---|
| `en` | English | Left-to-right |
| `fa` | Persian | Right-to-left |
| `de` | German | Left-to-right |
| `tr` | Turkish | Left-to-right |
| `ar` | Arabic | Right-to-left |
| `es` | Spanish | Left-to-right |
| `fr` | French | Left-to-right |
| `ru` | Russian | Left-to-right |
| `zh` | Chinese | Left-to-right |
| `ko` | Korean | Left-to-right |
| `ja` | Japanese | Left-to-right |

Locale registration does not by itself guarantee that every string is perfectly translated or that every layout has been independently reviewed. Contributions should preserve translation keys and test right-to-left layouts where applicable.

## Technology

The supplied project uses:

- React 19 and React DOM
- TypeScript
- Vite and the React plugin
- Tailwind CSS 4 with the Vite integration
- React Router
- i18next and react-i18next
- IndexedDB through `idb`
- `vite-plugin-pwa` / Workbox-backed service-worker generation
- Vitest, Testing Library, and jsdom
- oxlint
- Font Awesome icons

Dependency versions are defined in `package.json` and locked in `package-lock.json`. This list describes the supplied project files and may change as the project evolves.

## Application structure

The app uses route-level feature pages under `src/features/`, with shared UI, hooks, types, and core logic separated into supporting directories.

```text
src/
├── app/                 # Application navigation metadata
├── components/          # Shared layout, UI, charts, and AI components
├── features/
│   ├── dashboard/       # Home/dashboard
│   ├── learn/           # Lessons and transmission practice
│   ├── practice/        # Practice modes
│   ├── translator/      # Translation and audio tools
│   ├── games/           # Five game experiences
│   ├── progress/        # Progress, mastery, and review
│   ├── encyclopedia/    # Reference material
│   └── settings/        # Language, appearance, data, audio, AI, accessibility
├── hooks/               # Shared React hooks
├── i18n/                # Locale registration and translation files
├── lib/                 # Morse logic, audio, persistence, XP, backup, AI, etc.
├── services/            # Application services
├── stores/              # State-related modules
├── types/               # Shared TypeScript types
└── utils/               # Utilities
```

Primary routes currently declared in `src/App.tsx`:

| Route | Area |
|---|---|
| `/` | Dashboard |
| `/learn` | Learn |
| `/practice` | Practice |
| `/translator` | Translator |
| `/games` | Games |
| `/progress` | Progress |
| `/encyclopedia` | Encyclopedia |
| `/settings` | Settings |

## Run Relay locally

### Requirements

- Node.js compatible with the versions required by the installed Vite/TypeScript toolchain. Node.js 22 LTS is a practical starting point.
- npm, which ships with Node.js.
- A modern browser for development and testing.

### Install and start

```bash
git clone https://github.com/mh3nj/Relay.git
cd Relay
npm ci
npm run dev
```

Vite prints the local development URL in the terminal. Open that URL in your browser.

### Available scripts

```bash
npm run dev        # Start the Vite development server
npm test           # Run the Vitest suite once
npm run test:watch # Run Vitest in watch mode
npm run test:ui    # Open the Vitest UI
npm run lint       # Run oxlint
npm run build      # Type-check and create a production build
npm run preview    # Preview the built application locally
```

Before submitting a change, run at least:

```bash
npm test
npm run lint
npm run build
```

A command completing successfully on one machine is not a guarantee that every browser or deployment environment behaves identically. The project maintainer should keep CI results and release checks visible.

## Production build and deployment

Create a production build with:

```bash
npm ci
npm run build
```

Vite writes the generated site to `dist/`. Deploy the contents of that directory to a static host that serves the app over HTTPS. Configure the host to serve `index.html` for application routes (SPA fallback), and verify that service-worker and manifest assets are served from the expected base path.

The current PWA manifest assumes the application is hosted at the origin root (`start_url: "/"`, `scope: "/"`). Hosting under a subpath requires checking and adapting the Vite base path, manifest paths, asset paths, and service-worker behavior before deployment.

No live deployment URL is currently documented here.

## Data and backups

Relay uses browser storage, not a cloud account, for its local application records. Browser data is tied to the browser profile and origin. It may not follow you automatically to another device or browser.

- Export a backup before clearing site data, changing browser profiles, or moving devices.
- Store exported backups somewhere you control.
- Treat backups as personal data if they contain learning history or custom dictionaries.
- AI settings and the API key are deliberately excluded from backup files in the supplied implementation.
- Import only backup files you trust. Backup restoration changes local application data.

See [Privacy and data](docs/PRIVACY.md).

## Testing

Unit tests are present for core areas including Morse mapping, practice logic, XP, badges, mastery, mnemonics, backup behavior, custom dictionaries, and locale registration. The test suite should be run in CI and before releases.

The supplied archive has not been independently executed as part of preparing this documentation package. Therefore, this README does not claim that the current test suite, lint, or production build has passed in a clean environment.

## Contributing

Contributions are welcome for review, but a pull request is not automatically permission to relicense or redistribute Relay. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. The maintainer retains final approval over changes and may decline contributions that do not fit the project's direction or licensing requirements.

## Security

Do not publish API keys, personal backups, logs containing private information, or local configuration. For private vulnerability reports, follow [SECURITY.md](SECURITY.md).

## License and permitted use

Relay is intended to be free for personal, non-commercial use, while commercial exploitation and unauthorized redistribution remain restricted.

A **custom license draft** is included as [`LICENSE-DRAFT.md`](LICENSE-DRAFT.md). It is a proposal for review, not a substitute for legal advice. Do not treat the draft as a finalized, lawyer-reviewed license. Before public release, the maintainer should finalize the terms, place the operative license in a root-level `LICENSE` file, and audit third-party package and asset licenses.

Until a finalized license is published, do not assume that the repository grants permission to reuse, modify, or redistribute the code. GitHub's platform terms may permit viewing and forking a public repository, but that is distinct from receiving a broad software license. See [GitHub's licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).

Relay is **source-available**, not open-source software under the conventional Open Source Definition, if its license prohibits commercial use or restricts redistribution. The Open Source Initiative explains that an open-source license cannot prohibit use in a field of endeavor such as business: https://opensource.org/osd.

## Acknowledgements and third-party notices

Relay relies on third-party libraries. Their names and license information should be verified from installed package metadata and recorded in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) before release. Do not assume the project's custom license overrides the licenses of its dependencies or included assets.

## Contact and project links

- Source: https://github.com/mh3nj/Relay
- Issues: https://github.com/mh3nj/Relay/issues
- Security reporting: see [SECURITY.md](SECURITY.md)

---

<div align="center">
  <sub>Relay — a personal Morse-learning environment built to help you keep listening, practising, and improving.</sub>
</div>

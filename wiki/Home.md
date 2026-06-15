# Plural Star Reimagined Wiki

Plural Star Reimagined is a fork of [Plural Star](https://github.com/TheHanyou/Plural-Star), a private, offline-first React Native app for front tracking, journaling, member management, and shared system tooling.

## Install

- Releases for this fork: <https://github.com/sparklecatdev/Plural-Star-Reimagined/releases/latest>
- Support for the original project belongs to The Hanyou System, not the fork maintainer.

## Pages

- [Features](Features.md)
- [Architecture](Architecture.md)
- [Development](Development.md)
- [Data and Privacy](Data-and-Privacy.md)

## Repo Map

- `App.tsx`: app entry, boot flow, top-level state, tab navigation, modal wiring.
- `src/screens/`: primary screens.
- `src/components/`: reusable UI.
- `src/modals/`: editing and workflow modals.
- `src/services/`: notifications and live activity integration.
- `src/storage.ts`: AsyncStorage wrapper and filesystem backup recovery.
- `src/export/`: JSON, HTML, text, markdown, and email export helpers.
- `src/i18n/`: translations and language setup.
- `android/`, `ios/`: native projects.

## Notes

- The product name for this fork is Plural Star Reimagined.
- Some native artifact names still use `PluralSpace`.
- Privacy policy site files live in `docs/`.

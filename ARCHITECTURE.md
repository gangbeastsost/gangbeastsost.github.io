# Application Architecture

The player is a static browser application built with native ES modules. `index.html` loads `script.js`, which remains the orchestration layer for playback and UI behavior.

## Browser modules

- `script.js` — application startup, playback state, Airport and Airship variants, UI coordination, settings, modals, and visualization orchestration.
- `js/platform.js` — browser detection, Safari audio-path selection, and iOS detection.
- `js/catalog.js` — official/custom/drum/custom-group filtering rules.
- `js/format.js` — duration formatting, HTML escaping, and fallback cover generation.
- `js/shuffle.js` — randomized queue construction.
- `js/sharing.js` — song identifiers, deep-link URL updates, share URLs, clipboard behavior, and copy-button state.
- `js/downloads.js` — individual track downloads and browser-side ZIP creation.
- `js/history.js` — history persistence, delayed recording, loop replay detection, panel rendering, replay, and clearing.

The extracted modules either expose pure functions or accept their browser and application dependencies explicitly. This keeps them independent of the entry module's mutable playback state.

## Catalog and generated content

- `tracks.json` is the source of truth for track metadata and media paths.
- `scripts/validate_catalog.js` checks catalog structure, assets, Safari copies, durations, and share pages.
- `scripts/generate_song_pages.js` creates static per-song pages for OpenGraph and Discord previews.
- `scripts/bake_durations.js` reads audio metadata into the catalog.
- `scripts/add_drums_tracks.js` discovers and inserts drum tracks.

Generated share pages under `song/` and OpenGraph images under `images/og/` stay committed. GitHub Pages and link-preview crawlers can therefore serve complete metadata without a runtime or deployment build. After catalog or share-metadata changes, run `npm run generate:shares`, commit the output, and let CI verify that no generated files are stale.

## Local verification

Run the catalog checks and browser regression suite before and after changing module boundaries:

```sh
npm run validate
npm run test:smoke
```

The smoke suite exercises the modules through the real application rather than testing their implementation details in isolation.

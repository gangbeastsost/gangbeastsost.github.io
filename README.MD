# Gang Beasts OST Player
A fast, intuitive, and responsive website to listen to the Gang Beasts OST with ease. Created using GitHub Copilot. Please don't kill me. I don't use AI for everything. I am not like the big tech corporations that worship AI. The code is probably a spaghetti tangled mess, but as long as it works, then I'm happy. I do not believe AI should be used to create things with mass amounts of complexity ~~cough cough microsoft~~. I have massive amounts of respect for real coders and web designers. Don't take this as a stab in the back.

# Features
- Download all tracks as a ZIP
- Download individual tracks as a .MP3
- Music from custom maps, such as [Airship](https://thunderstore.io/c/gang-beasts/p/MinimackStudios/Airship/), [Airport](https://thunderstore.io/c/gang-beasts/p/konradKG25/Airport/), and more.
- Custom made-up NON OFFICIAL names for tracks not officially released on [doseone's Bandcamp page](https://doseone.bandcamp.com/album/gang-beasts-original-soundtrack) for consistency. (Trawler, Train, Aquarium, Crane.)
- [Sharing](https://github.com/gangbeastsost/gangbeastsost.github.io/tree/main?tab=readme-ov-file#sharing-discord-embeds)
- Waveform Visualization

 
# Shortcuts
- `Space` plays or pauses
- `Right arrow` skips forward 10 seconds
- `Left arrow` skips backward 10 seconds
- `Shift + right arrow` plays the next track
- `Shift + left arrow` plays the previous track
- `L` cycles the loop mode
- `A` toggles autoplay
- `H` opens listen history
- `S` toggles shuffle
- `V` toggles the waveform visualizer while the fullscreen player is open
- `F` toggles the fullscreen player
- `Ctrl + right arrow` moves to the next Airport section
- `Ctrl + left arrow` moves to the previous Airport section
- `?` opens the shortcuts dialog
- Click on the cover for a song to open the fullscreen music player

# Sharing (Discord embeds)
Discord previews don’t run page JavaScript, so links like `/?song=Menu-A` can’t show per-song OpenGraph data on GitHub Pages.

Use the dedicated share pages instead (these will be the format they are copied in if you copy links with the copy button next to the title of the song):
- `https://gangbeastsost.net/song/Menu-A/` (example)

The generated pages under `song/` and their OpenGraph images under `images/og/` are committed to the repository so static hosts and link-preview crawlers can serve them without a build step. After changing the catalog or share metadata, run `npm run generate:shares` and commit the generated changes. CI rejects stale generated pages.

# Development
Serve the repository over HTTP so the player can fetch `tracks.json` and seek through audio files:

```sh
npm start
```

Validate the catalog, referenced M4A audio, metadata, and generated song pages:

```sh
node scripts/validate_catalog.js
```

Pass `--strict` to treat warnings, such as missing baked durations or stale extra share pages, as failures.

Install the development dependencies and browser once, then run the browser smoke tests:

```sh
npm install
npx playwright install chromium
npm run test:smoke
```

The suite starts a local server automatically and covers catalog loading, search and filters, playback controls, deep links, keyboard shortcuts, dialogs, and saved settings.

See `ARCHITECTURE.md` for the browser-module boundaries and maintenance-script layout.

GitHub Actions runs strict catalog validation, verifies that generated share pages are current, and executes the browser suite for pushes and pull requests targeting `main`.

# License
The website source code is available under the [MIT License](LICENSE). The license does not cover the music, cover art, or other third-party media distributed by the site; those works remain the property of their respective rights holders.

# Disclaimer
I do not own the rights to any music on this website. All tracks are the property of their respective owners. This website has been made for entertainment purposes.

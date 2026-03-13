# Gang Beasts OST Player
A fast, intuitive, and responsive website to listen to the Gang Beasts OST with ease. Created using GitHub Copilot. Please don't kill me. I don't use AI for everything. I am not like the big tech corporations that worship AI. The code is probably a spaghetti tangled mess, but as long as it works, then I'm happy. I do not believe AI should be used to create things with mass amounts of complexity ~~cough cough microsoft~~. I have massive amounts of respect for real coders and web designers. Don't take this as a stab in the back.

# Features
- Download all tracks as a ZIP
- Download individual tracks as a .MP3
- Music from custom maps, such as [Airship](https://thunderstore.io/c/gang-beasts/p/MinimackStudios/Airship/), [Airport](https://thunderstore.io/c/gang-beasts/p/konradKG25/Airport/), and more.
- Custom made-up NON OFFICIAL names for tracks not officially released on [doseone's Bandcamp page](https://doseone.bandcamp.com/album/gang-beasts-original-soundtrack) for consistency. (Trawler, Train, Aquarium, Crane.)
- [Sharing](https://github.com/gangbeastsost/gangbeastsost.github.io/tree/main?tab=readme-ov-file#sharing-discord-embeds)
- Waveform Visualization

# Changelog

## 2.1.0 (pending)
- Added full OGG-based library support in `tracks.json` and runtime playback, with automatic Safari fallback to MP3 files in `music/mp3/`.
- Added many new audio assets to the repo: OGG masters, MP3 Safari fallback files, `music/whopper.ogg`, and `music/mp3/whopper.mp3`.
- Added 24 drum tracks and new drum metadata entries (`side: "Drums"`), including generation tooling via `scripts/add_drums_tracks.js`.
- Added new view filter modes in the UI: `Include drum tracks` and `Only drum tracks`, while keeping custom-map filter options.
- Added Airport section timeline support in player logic (section IDs, section seek handling, chapter markers, section-aware share params, and section navigation shortcuts).
- Added generated share pages for Airport sections: `song/Airport-Section-A-1` through `song/Airport-Section-B-3`.
- Added Airport section artwork assets (`images/Airport-Flying.png`, `images/Airport-Return.png`) and OG variants under `images/og/`.
- Added/updated modal attribution info UI for Airport and GB Days/Nights drum tracks (including MVSEP disclaimer text for drums).
- Added whopper easter-egg media assets and expanded whopper mode behavior in player logic.
- Added easter-egg video assets under `vids/` (`torture 1.mp4` through `torture 5.mp4`).
- Added autoplay/card UX improvements in runtime logic (active-card auto-scroll and smoother cover pulse reset behavior).
- Added view-aware OST duration updates so totals follow the active filter.
- Updated keyboard hint content and player UI structure (seek wrappers/chapter overlay containers in mini player and modal).
- Added and refined easter egg presentation assets/styles, including `images/whopper.png` and egg toast/video overlay styling.
- Added OGG duration parsing to `scripts/bake_durations.js` so duration bake supports both MP3 and OGG.
- Extended `scripts/generate_song_pages.js` to generate Airport section share pages.
- Updated `song/Airport-A/index.html` metadata title/OG/Twitter fields to use `Airport` naming.
- Updated `images/Totems.png` (compressed/replaced image asset).
 
# Shortcuts
- `L` toggles looping
- `S` toggles shuffle
- `V` toggles waveform
- `?` opens the shortcuts modal
- `Shift + right arrow` next song
- `Shift + left arrow` previous song
- `Spacebar` pause/play
- `Left arrow` skip ahead 10/s
- `Right arrow` backtrack 10/s
- Click on the cover for a song to open the fullscreen music player

# Sharing (Discord embeds)
Discord previews don’t run page JavaScript, so links like `/?song=Menu-A` can’t show per-song OpenGraph data on GitHub Pages.

Use the dedicated share pages instead (these will be the format they are copied in if you copy links with the copy button next to the title of the song):
- `https://gangbeastsost.net/song/Menu-A/` (example)

# Disclaimer
I do not own the rights to any music on this website. All tracks are the property of their respective owners. This website has been made for entertainment purposes. 
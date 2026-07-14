export function createHistoryController(options = {}) {
  const {
    storageKey = 'gb:history',
    maxEntries = 200,
    listenThresholdMs = 4000,
    browserDocument = globalThis.document,
    browserStorage = globalThis.localStorage,
    getTracks = () => [],
    onPlayTrack = () => {},
  } = options;

  let entries = [];
  let recordedTrackIndex = -1;
  let pendingTimer = null;
  let loopLastTime = null;
  let loopLastIndex = -1;

  function load(nextEntries) {
    entries = Array.isArray(nextEntries) ? nextEntries.slice(0, maxEntries) : [];
  }

  function loadFromStorage() {
    try {
      const raw = browserStorage.getItem(storageKey);
      load(raw ? JSON.parse(raw) : []);
    } catch (cause) {
      load([]);
    }
  }

  function save() {
    try { browserStorage.setItem(storageKey, JSON.stringify(entries)); } catch (cause) {}
  }

  function record(track) {
    if (!track) return;
    entries.unshift({
      title: track.title || '',
      artist: track.artist || '',
      image: track.image || '',
      duration: track.duration || null,
      stage: track.stage || '',
      side: track.side || '',
      ts: Date.now(),
    });
    if (entries.length > maxEntries) entries.length = maxEntries;
    save();
    const panel = browserDocument.getElementById('historyPanel');
    if (panel?.classList.contains('open')) render();
  }

  function cancelPending() {
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = null;
  }

  function resetForTrack(trackIndex) {
    recordedTrackIndex = -1;
    cancelPending();
    loopLastTime = null;
    loopLastIndex = trackIndex;
  }

  function schedule(trackIndex, buildEntry, { force = false } = {}) {
    if (!force && trackIndex === recordedTrackIndex) return;
    recordedTrackIndex = trackIndex;
    cancelPending();
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      try { record(buildEntry()); } catch (cause) {}
    }, listenThresholdMs);
  }

  function observeLoop({ trackIndex, currentTime, duration, isLooping, track }) {
    if (isLooping && track) {
      if (loopLastIndex !== trackIndex || loopLastTime === null) {
        loopLastIndex = trackIndex;
        loopLastTime = currentTime;
        return;
      }
      const wrapped = loopLastTime > duration * 0.85
        && currentTime < duration * 0.2
        && loopLastTime - currentTime > Math.max(0.5, duration * 0.35);
      if (wrapped) record(track);
    }
    loopLastTime = currentTime;
    loopLastIndex = trackIndex;
  }

  function resetLoop() {
    loopLastTime = null;
    loopLastIndex = -1;
  }

  function relativeTime(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function formatEntryDuration(seconds) {
    if (!seconds || !Number.isFinite(seconds)) return '';
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
  }

  function render() {
    const list = browserDocument.getElementById('historyList');
    const stats = browserDocument.getElementById('historyStats');
    if (!list) return;

    if (stats) {
      if (entries.length === 0) stats.textContent = '';
      else {
        const unique = new Set(entries.map((entry) => entry.title + entry.artist)).size;
        stats.textContent = `${entries.length} play${entries.length === 1 ? '' : 's'} · ${unique} unique track${unique === 1 ? '' : 's'}`;
      }
    }

    if (entries.length === 0) {
      list.innerHTML = `
        <div class="history-empty">
          <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path fill="currentColor" opacity=".35" d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
          <p>No history yet</p>
          <span>Tracks you play will appear here</span>
        </div>`;
      return;
    }

    list.innerHTML = entries.map((entry, index) => {
      const duration = entry.duration
        ? `<span class="history-entry__dur">${formatEntryDuration(entry.duration)}</span>`
        : '';
      const image = entry.image ? encodeURI(entry.image) : '';
      return `
        <div class="history-entry" data-idx="${index}" role="listitem">
          <img class="history-entry__cover" src="${image}" alt="" loading="lazy" onerror="this.style.opacity='.3'">
          <div class="history-entry__info">
            <div class="history-entry__title">${entry.title}</div>
            <div class="history-entry__meta">${entry.artist}${duration ? ` &middot; ${duration}` : ''}</div>
          </div>
          <div class="history-entry__right">
            <span class="history-entry__time">${relativeTime(entry.ts)}</span>
            <button class="history-entry__play" data-hist-idx="${index}" title="Play" aria-label="Play ${entry.title}">
              <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.history-entry__play').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const entry = entries[Number.parseInt(button.dataset.histIdx, 10)];
        const tracks = getTracks();
        if (!entry || !Array.isArray(tracks)) return;
        const trackIndex = tracks.findIndex(
          (track) => track.title === entry.title && (track.artist || '') === entry.artist,
        );
        if (trackIndex >= 0) onPlayTrack(trackIndex);
      });
    });
  }

  function toggle() {
    const panel = browserDocument.getElementById('historyPanel');
    const overlay = browserDocument.getElementById('historyOverlay');
    if (!panel) return;
    const isOpen = panel.classList.toggle('open');
    panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    overlay?.classList.toggle('open', isOpen);
    browserDocument.getElementById('historyBtn')?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) render();
  }

  function clear() {
    entries = [];
    try { browserStorage.removeItem(storageKey); } catch (cause) {}
    render();
  }

  return {
    clear,
    loadFromStorage,
    observeLoop,
    record,
    render,
    resetForTrack,
    resetLoop,
    schedule,
    toggle,
  };
}

const audio = document.getElementById('audio');
const trackListEl = document.getElementById('trackList');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const coverImg = document.getElementById('coverImg');
const heroArt = document.getElementById('heroArt');
const heroCopyLink = document.getElementById('heroCopyLink');

// modal player elements
const modal = document.getElementById('modal');
const modalBg = document.getElementById('modalBg');
const modalBack = document.getElementById('modalBack');
const mCover = document.getElementById('mCover');
const mTitle = document.getElementById('mTitle');
const mArtist = document.getElementById('mArtist');
const mCopyLink = document.getElementById('mCopyLink');
const mSeek = document.getElementById('mSeek');
const mCur = document.getElementById('mCur');
const mRem = document.getElementById('mRem');
const mPlay = document.getElementById('mPlay');
const mPrev = document.getElementById('mPrev');
const mNext = document.getElementById('mNext');
const mShuffle = document.getElementById('mShuffle');
const mLoop = document.getElementById('mLoop');
const mWaveform = document.getElementById('mWaveform');
const waveformContainer = document.getElementById('waveformContainer');
const waveformCanvas = document.getElementById('waveformCanvas');
// mini player elements
const miniPlayer = document.getElementById('miniPlayer');
const miniCover = document.getElementById('miniCover');
const miniTitle = document.getElementById('miniTitle');
const miniArtist = document.getElementById('miniArtist');
const miniCopyLink = document.getElementById('miniCopyLink');
const miniPlay = document.getElementById('miniPlay');
const miniPrev = document.getElementById('miniPrev');
const miniNext = document.getElementById('miniNext');
const miniSeek = document.getElementById('miniSeek');
const miniCur = document.getElementById('miniCur');
const miniRem = document.getElementById('miniRem');
const miniShuffle = document.getElementById('miniShuffle');
const miniLoop = document.getElementById('miniLoop');
const mDownload = document.getElementById('mDownload');
const miniDownload = document.getElementById('miniDownload');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const downloadAllLabel = document.getElementById('downloadAllLabel');
const viewBtn = document.getElementById('viewBtn');
const viewDropdown = document.getElementById('viewDropdown');
const searchInput = document.getElementById('searchInput');
const preloadToast = document.getElementById('preloadToast');
const preloadToastText = document.getElementById('preloadToastText');
const keyboardHint = document.getElementById('keyboardHint');
const infoModal = document.getElementById('infoModal');
const helpBtn = document.getElementById('helpBtn');
const showHotkeysBtn = document.getElementById('showHotkeysBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsTabGeneral = document.getElementById('settingsTabGeneral');
const settingsTabExclusions = document.getElementById('settingsTabExclusions');
const settingsPageGeneral = document.getElementById('settingsPageGeneral');
const settingsPageExclusions = document.getElementById('settingsPageExclusions');
const toggleReduceAnimationsEl = document.getElementById('toggleReduceAnimations');
const toggleLiteModeEl = document.getElementById('toggleLiteMode');
const customExcludeSelectWrap = document.getElementById('customExcludeSelectWrap');
const customExcludeTrigger = document.getElementById('customExcludeTrigger');
const customExcludeTriggerLabel = document.getElementById('customExcludeTriggerLabel');
const customExcludeMenu = document.getElementById('customExcludeMenu');
const customExcludeSearch = document.getElementById('customExcludeSearch');
const customExcludeOptions = document.getElementById('customExcludeOptions');
const customProfilesList = document.getElementById('customProfilesList');
const customProfileNewBtn = document.getElementById('customProfileNewBtn');
const customProfileDeleteBtn = document.getElementById('customProfileDeleteBtn');
const customModeExcludeBtn = document.getElementById('customModeExclude');
const customModeIncludeBtn = document.getElementById('customModeInclude');
const customExclusionsNameInput = document.getElementById('customExclusionsName');
const customExcludeAddBtn = document.getElementById('customExcludeAddBtn');
const customExcludeList = document.getElementById('customExcludeList');
const customExcludeClearBtn = document.getElementById('customExcludeClearBtn');
const customViewFilterItem = document.getElementById('customViewFilterItem');
const trackContextMenu = document.getElementById('trackContextMenu');
const ostDurationEl = document.getElementById('ostDurationEl');
const mTrackCounter = document.getElementById('mTrackCounter');
const miniTrackCounter = document.getElementById('miniTrackCounter');
let contextMenuTrackIndex = -1;

// Media Session (lock screen / OS media controls)
const HAS_MEDIA_SESSION = (typeof navigator !== 'undefined' && 'mediaSession' in navigator);
let _lastMediaPositionUpdateMs = 0;

function isIOS(){
  try{
    const ua = (navigator && navigator.userAgent) ? navigator.userAgent : '';
    const iThing = /iPad|iPhone|iPod/.test(ua);
    const iPadOS13Plus = (navigator && navigator.platform === 'MacIntel' && navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
    return !!(iThing || iPadOS13Plus);
  }catch(e){ return false; }
}

function setupIOSPauseOnBackground(){
  try{
    if(!isIOS()) return;
    const maybePause = ()=>{
      try{
        if(!audio || !audio.src) return;
        const loopActive = loopMode === 'one';
        if(!loopActive) return;
        if(!isPlaying) return;
        pause();
      }catch(e){}
    };

    document.addEventListener('visibilitychange', ()=>{
      try{ if(document.visibilityState === 'hidden') maybePause(); }catch(e){}
    });
    // iOS Safari reliably fires pagehide when switching away / app background
    window.addEventListener('pagehide', ()=>{ maybePause(); });
  }catch(e){}
}

// Deep link support: reflect current track in URL as ?song=Stage-Side (e.g. ?song=Menu-A)
function getSongParamForTrack(t){
  try{
    if(!t) return null;
    const stage = (t.stage ? String(t.stage).trim() : '');
    const side = (t.side ? String(t.side).trim() : '');
    if(!stage || !side) return null;
    return `${stage}-${side}`;
  }catch(e){ return null; }
}

function setSongQueryParam(value){
  try{
    const url = new URL(window.location.href);
    if(value){
      url.searchParams.set('song', value);
    } else {
      url.searchParams.delete('song');
    }
    const next = url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
    history.replaceState(null, '', next);
  }catch(e){}
}

function getSongShareUrlForTrack(t){
  try{
    const songParam = getSongParamForTrack(t);
    if(!songParam) return null;
    // Match the share-page format used for Discord embeds.
    return `${window.location.origin}/song/${encodeURIComponent(songParam)}`;
  }catch(e){ return null; }
}

async function copyTextToClipboard(text){
  try{
    if(!text) return false;
    if(navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && window.isSecureContext){
      await navigator.clipboard.writeText(text);
      return true;
    }
  }catch(e){}

  // Fallback (older Safari / non-secure contexts)
  try{
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  }catch(e){ return false; }
}

const _copiedBtnTimers = new WeakMap();

function flashCopiedState(btn){
  try{
    if(!btn) return;
    const prev = _copiedBtnTimers.get(btn);
    if(prev) clearTimeout(prev);
    btn.classList.add('copied');
    const t = setTimeout(()=>{
      try{ btn.classList.remove('copied'); }catch(e){}
      try{ _copiedBtnTimers.delete(btn); }catch(e){}
    }, 850);
    _copiedBtnTimers.set(btn, t);
  }catch(e){}
}

function _setCopyButtonState(btn, url){
  try{
    if(!btn) return;
    const has = !!url;
    btn.disabled = !has;
    btn.title = has ? 'Copy link' : 'No share link for this track';
    btn.setAttribute('aria-label', has ? 'Copy link' : 'No share link for this track');
  }catch(e){}
}

function _setupStaticCopyButtons(){
  try{
    const onCopyCurrent = async (btn)=>{
      try{
        const t = (tracks && tracks[index]) ? tracks[index] : null;
        const url = getSongShareUrlForTrack(t);
        const ok = await copyTextToClipboard(url);
        if(ok) flashCopiedState(btn);
      }catch(e){}
    };
    if(heroCopyLink) heroCopyLink.addEventListener('click', (ev)=>{ try{ ev.preventDefault(); ev.stopPropagation(); }catch(e){}; onCopyCurrent(heroCopyLink); });
    if(miniCopyLink) miniCopyLink.addEventListener('click', (ev)=>{ try{ ev.preventDefault(); ev.stopPropagation(); }catch(e){}; onCopyCurrent(miniCopyLink); });
    if(mCopyLink) mCopyLink.addEventListener('click', (ev)=>{ try{ ev.preventDefault(); ev.stopPropagation(); }catch(e){}; onCopyCurrent(mCopyLink); });
  }catch(e){}
}

function findTrackIndexBySongParam(songParam){
  try{
    if(!songParam || !tracks || !tracks.length) return -1;
    const raw = String(songParam).trim();
    if(!raw) return -1;
    const dash = raw.lastIndexOf('-');
    if(dash <= 0 || dash >= raw.length - 1) return -1;
    const stage = raw.slice(0, dash).trim();
    const side = raw.slice(dash + 1).trim();
    if(!stage || !side) return -1;
    for(let i=0;i<tracks.length;i++){
      const t = tracks[i];
      const s = (t.stage ? String(t.stage).trim() : '');
      const sd = (t.side ? String(t.side).trim() : '');
      if(s === stage && sd === side) return i;
    }
    return -1;
  }catch(e){ return -1; }
}

let _preloadToastTimer = null;

function showPreloadToast(msg){
  try{
    if(!preloadToast) return;
    if(_preloadToastTimer){ clearTimeout(_preloadToastTimer); _preloadToastTimer = null; }
    // small delay prevents flicker when decode/buffer is very fast
    _preloadToastTimer = setTimeout(()=>{
      try{
        if(msg && preloadToastText) preloadToastText.textContent = msg;
        preloadToast.setAttribute('aria-hidden', 'false');
        preloadToast.classList.add('show');
      }catch(e){}
    }, 120);
  }catch(e){}
}

function _absUrl(u){
  try{ return new URL(u, window.location.href).href; }catch(e){ return u; }
}

function _getMediaDuration(){
  try{
    if(webPlaying && webSource && webSource.buffer){
      const d = webSource.buffer.duration;
      return (d && isFinite(d)) ? d : null;
    }
  }catch(e){}
  try{ return (audio && audio.duration && isFinite(audio.duration)) ? audio.duration : null; }catch(e){ return null; }
}

function _getMediaPosition(){
  try{
    if(webPlaying && webSource && webSource.buffer) return getWebCurrentTime();
    if(webOffsetValid) return webOffset;
  }catch(e){}
  try{ return (audio && typeof audio.currentTime === 'number') ? audio.currentTime : 0; }catch(e){ return 0; }
}

function updateMediaSessionMetadata(t){
  if(!HAS_MEDIA_SESSION) return;
  try{
    if(!t){
      try{ navigator.mediaSession.metadata = null; }catch(e){}
      return;
    }
    const art = t.image ? _absUrl(encodeURI(t.image)) : undefined;
    const data = {
      title: t.title || '',
      artist: t.artist || '',
      album: 'Gang Beasts OST',
      artwork: art ? [
        { src: art, sizes: '96x96' },
        { src: art, sizes: '128x128' },
        { src: art, sizes: '192x192' },
        { src: art, sizes: '256x256' },
        { src: art, sizes: '384x384' },
        { src: art, sizes: '512x512' }
      ] : []
    };
    // Some iPadOS/Safari builds are picky: use MediaMetadata when available, else assign plain object.
    if(typeof MediaMetadata === 'function') navigator.mediaSession.metadata = new MediaMetadata(data);
    else navigator.mediaSession.metadata = data;
  }catch(e){}
}

function updateMediaSessionPlaybackState(){
  if(!HAS_MEDIA_SESSION) return;
  try{ navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'; }catch(e){}
}

function updateMediaSessionPosition(force=false){
  if(!HAS_MEDIA_SESSION) return;
  try{
    if(typeof navigator.mediaSession.setPositionState !== 'function') return;
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if(!force && now - _lastMediaPositionUpdateMs < 900) return;
    const duration = _getMediaDuration();
    if(!duration || !isFinite(duration)) return;
    const rawPos = _getMediaPosition();
    const position = Math.max(0, Math.min(duration, (typeof rawPos === 'number' ? rawPos : 0)));
    navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position });
    _lastMediaPositionUpdateMs = now;
  }catch(e){}
}

function _seekToSeconds(targetSeconds){
  try{
    const file = tracks[index] && tracks[index].file;
    const loopActive = loopMode === 'one';
    const buf = (loopActive && file) ? bufferCache.get(file) : null;
    const webDur = (webSource && webSource.buffer) ? webSource.buffer.duration : null;
    const dur = (webDur && isFinite(webDur)) ? webDur : (buf && buf.duration ? buf.duration : audio.duration);
    if(!dur || !isFinite(dur)) return;
    const clamped = Math.max(0, Math.min(dur, targetSeconds));

    if(loopActive && buf){
      if(isPlaying){
        switchToWebLoop(file, (clamped % dur));
      } else {
        webOffset = clamped;
        webOffsetValid = true;
        try{ audio.currentTime = clamped; }catch(e){}
      }
    } else {
      webOffsetValid = false;
      try{ audio.currentTime = clamped; }catch(e){}
    }

    // keep UI + media position in sync
    try{
      const p = (clamped / dur) * 100;
      if(mSeek) mSeek.value = p;
      if(miniSeek) miniSeek.value = p;
      setSeekPercent(p);
      if(mCur) mCur.textContent = fmt(clamped);
      if(miniCur) miniCur.textContent = fmt(clamped);
    }catch(e){}
    try{ _audioTimeBase = clamped; _audioTimeStamp = _nowMs(); }catch(e){}
    try{ updateMediaSessionPosition(true); }catch(e){}
  }catch(e){}
}

function _seekBySeconds(delta){
  try{
    const duration = _getMediaDuration();
    if(!duration || !isFinite(duration)) return;
    const cur = _getMediaPosition();
    _seekToSeconds((cur || 0) + delta);
  }catch(e){}
}

function setupMediaSession(){
  if(!HAS_MEDIA_SESSION) return;
  try{
    navigator.mediaSession.setActionHandler('play', ()=>{ try{ play(); }catch(e){} });
    navigator.mediaSession.setActionHandler('pause', ()=>{ try{ pause(); }catch(e){} });
    navigator.mediaSession.setActionHandler('previoustrack', ()=>{ try{ skip(-1); }catch(e){} });
    navigator.mediaSession.setActionHandler('nexttrack', ()=>{ try{ skip(1); }catch(e){} });
    navigator.mediaSession.setActionHandler('seekbackward', (details)=>{ try{ _seekBySeconds(-(details && details.seekOffset ? details.seekOffset : 10)); }catch(e){} });
    navigator.mediaSession.setActionHandler('seekforward', (details)=>{ try{ _seekBySeconds((details && details.seekOffset ? details.seekOffset : 10)); }catch(e){} });
    navigator.mediaSession.setActionHandler('seekto', (details)=>{
      try{
        if(details && typeof details.seekTime === 'number') _seekToSeconds(details.seekTime);
      }catch(e){}
    });
  }catch(e){}
}

function hidePreloadToast(){
  try{
    if(_preloadToastTimer){ clearTimeout(_preloadToastTimer); _preloadToastTimer = null; }
    if(!preloadToast) return;
    preloadToast.classList.remove('show');
    preloadToast.setAttribute('aria-hidden', 'true');
  }catch(e){}
}

let tracks = [];
let trackDurations = [];
let durationLoadedCount = 0;
let index = 0;
let isPlaying = false;
let isShuffling = false;
let loopMode = 'off'; // 'off' | 'one' | 'all'
let isAutoplay = true;
let _clearingNoSong = false;
let isReducedAnimations = false;
let isLiteMode = false;
let customExclusionFiles = [];
let customExclusionsName = '';
let customExclusionsMode = 'exclude'; // 'exclude' | 'include'
let customFilters = []; // [{id,name,mode,files[]}]
let activeCustomFilterId = '';
let customExcludePendingFile = '';
let customExcludeSearchQuery = '';
let currentViewFilter = 'all';
window.currentViewFilter = currentViewFilter;
let progressRaf = null;
let searchQuery = '';

let recentlyPlayed = []; // Array of track indices (max 20)
const MAX_RECENT = 20;
let listenHistory = []; // {title,artist,image,duration,stage,side,ts}
const MAX_HISTORY = 200;
const HISTORY_KEY = 'gb:history';
const REDUCE_ANIMATIONS_KEY = 'gb:reduceAnimations';
const LITE_MODE_KEY = 'gb:liteMode';
const CUSTOM_EXCLUSIONS_KEY = 'gb:customExclusions';
const CUSTOM_EXCLUSIONS_NAME_KEY = 'gb:customExclusionsName';
const CUSTOM_FILTERS_KEY = 'gb:customFilters';
const CUSTOM_FILTERS_ACTIVE_KEY = 'gb:customFiltersActive';
let _historyRecordedForIndex = -1; // dedup: only record once per play() call per track
let _loopHistoryLastTime = null;
let _loopHistoryLastIndex = -1;

const OFFICIAL_ARTIST = 'doseone & Bob Larder';

// Also show the preloading toast during normal <audio> buffering.
try{
  if(audio){
    audio.addEventListener('waiting', ()=>{
      try{ if(audio && audio.src) showPreloadToast("Preloading... This shouldn't take long."); }catch(e){}
    });
    audio.addEventListener('stalled', ()=>{
      try{ if(audio && audio.src) showPreloadToast("Preloading... This shouldn't take long."); }catch(e){}
    });
    audio.addEventListener('canplay', ()=>{ try{ hidePreloadToast(); }catch(e){} });
    audio.addEventListener('playing', ()=>{ try{ hidePreloadToast(); }catch(e){} });
    audio.addEventListener('error', ()=>{ try{ hidePreloadToast(); }catch(e){} });
  }
}catch(e){}

function isTrackAllowedByViewFilter(t){
  try{
    if(!t) return false;
    const artist = (t.artist ? String(t.artist).trim() : '');
    const fileKey = (t.file ? String(t.file).trim() : '');
    if(currentViewFilter === 'exclude'){
      return artist === OFFICIAL_ARTIST;
    }
    if(currentViewFilter === 'only'){
      return artist !== OFFICIAL_ARTIST;
    }
    if(currentViewFilter === 'custom'){
      if(!Array.isArray(customExclusionFiles) || customExclusionFiles.length === 0) return true;
      if(customExclusionsMode === 'include') return customExclusionFiles.includes(fileKey);
      return !customExclusionFiles.includes(fileKey);
    }
    return true;
  }catch(e){ return true; }
}

function _newCustomFilter(name = ''){
  const base = String(name || '').trim();
  return {
    id: `cf_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    name: base,
    mode: 'exclude',
    files: []
  };
}

function _getActiveCustomFilter(){
  if(!Array.isArray(customFilters) || customFilters.length === 0) return null;
  let cur = customFilters.find(f => f && f.id === activeCustomFilterId);
  if(!cur){
    cur = customFilters[0];
    activeCustomFilterId = cur?.id || '';
  }
  return cur || null;
}

function _loadActiveCustomFilterState(){
  const cur = _getActiveCustomFilter();
  if(!cur){
    customExclusionFiles = [];
    customExclusionsName = '';
    customExclusionsMode = 'exclude';
    return;
  }
  customExclusionFiles = Array.isArray(cur.files) ? cur.files.map(x=>String(x||'').trim()).filter(Boolean) : [];
  customExclusionsName = String(cur.name || '').trim();
  customExclusionsMode = (cur.mode === 'include') ? 'include' : 'exclude';
}

function _saveActiveCustomFilterState(){
  const cur = _getActiveCustomFilter();
  if(!cur) return;
  cur.name = String(customExclusionsName || '').trim();
  cur.mode = (customExclusionsMode === 'include') ? 'include' : 'exclude';
  cur.files = Array.isArray(customExclusionFiles) ? [...new Set(customExclusionFiles.map(x=>String(x||'').trim()).filter(Boolean))] : [];
}

function saveCustomFilters(){
  try{
    _saveActiveCustomFilterState();
    localStorage.setItem(CUSTOM_FILTERS_KEY, JSON.stringify(customFilters || []));
    localStorage.setItem(CUSTOM_FILTERS_ACTIVE_KEY, String(activeCustomFilterId || ''));
  }catch(e){}
}

function updateCustomModeButtons(){
  try{
    const hasActiveGroup = !!_getActiveCustomFilter();
    const isInclude = customExclusionsMode === 'include';
    if(customModeExcludeBtn) customModeExcludeBtn.classList.toggle('active', !isInclude);
    if(customModeIncludeBtn) customModeIncludeBtn.classList.toggle('active', isInclude);
    if(customModeExcludeBtn) customModeExcludeBtn.disabled = !hasActiveGroup;
    if(customModeIncludeBtn) customModeIncludeBtn.disabled = !hasActiveGroup;
  }catch(e){}
}

function updateCustomGroupControls(){
  try{
    const hasActiveGroup = !!_getActiveCustomFilter();
    if(customExclusionsNameInput) customExclusionsNameInput.disabled = !hasActiveGroup;
    if(customExcludeTrigger) customExcludeTrigger.disabled = !hasActiveGroup;
    if(customExcludeAddBtn) customExcludeAddBtn.disabled = !hasActiveGroup;
    if(customProfileDeleteBtn) customProfileDeleteBtn.disabled = !hasActiveGroup;
  }catch(e){}
}

function renderCustomProfilesList(){
  try{
    if(!customProfilesList) return;
    if(!Array.isArray(customFilters) || customFilters.length === 0){
      customProfilesList.innerHTML = '<span class="settings-empty" style="width:100%">No groups yet</span>';
      updateCustomGroupControls();
      return;
    }
    customProfilesList.innerHTML = customFilters.map(f=>{
      const active = f.id === activeCustomFilterId;
      const modeLabel = f.mode === 'include' ? 'Include' : 'Exclude';
      return `<button type="button" class="settings-profile-pill${active ? ' active' : ''}" data-profile-id="${escapeHtml(f.id)}"><span>${escapeHtml(f.name || 'Custom group')}</span><span class="settings-profile-pill__mode">${modeLabel}</span></button>`;
    }).join('');
    updateCustomGroupControls();
  }catch(e){}
}

function setActiveCustomFilter(id){
  try{
    const next = customFilters.find(f => f && f.id === id);
    if(!next) return;
    _saveActiveCustomFilterState();
    activeCustomFilterId = next.id;
    _loadActiveCustomFilterState();
    updateCustomModeButtons();
    renderCustomProfilesList();
    updateCustomGroupControls();
    updateCustomFilterOption();
    if(customExclusionsNameInput) customExclusionsNameInput.value = customExclusionsName || '';
    setCustomExcludeSelection('');
    populateCustomExcludeSelect();
    renderCustomExclusionsList();
    syncViewDropdownPressed();
    try{ localStorage.setItem(CUSTOM_FILTERS_ACTIVE_KEY, String(activeCustomFilterId || '')); }catch(e){}
  }catch(e){}
}

function applyVisualSettings(){
  try{ document.body.classList.toggle('reduce-animations', !!isReducedAnimations); }catch(e){}
  try{ document.body.classList.toggle('lite-mode', !!isLiteMode); }catch(e){}
  try{
    if(isLiteMode){ spectrumParticles = []; }
    if(isReducedAnimations || isLiteMode){
      stopBeatPulse();
    }else if(isPlaying){
      startBeatPulse();
    }
  }catch(e){}
}

function isCustomFilterAvailable(){
  try{ return Array.isArray(customExclusionFiles) && customExclusionFiles.length > 0; }catch(e){ return false; }
}

function updateCustomFilterOption(){
  try{
    if(!customViewFilterItem) return;
    const show = isCustomFilterAvailable();
    const customLabel = (customExclusionsName && customExclusionsName.trim()) ? customExclusionsName.trim() : 'Custom group';
    customViewFilterItem.textContent = customLabel;
    customViewFilterItem.style.display = show ? 'block' : 'none';
    if(!show && currentViewFilter === 'custom'){
      currentViewFilter = 'all';
      window.currentViewFilter = currentViewFilter;
      try{ localStorage.setItem('gb:viewFilter', currentViewFilter); }catch(e){}
    }
  }catch(e){}
}

function syncViewDropdownPressed(){
  try{
    if(!viewDropdown) return;
    viewDropdown.querySelectorAll('.dropdown-item').forEach(d=>{
      const v = d.dataset.value;
      d.setAttribute('aria-pressed', v === currentViewFilter ? 'true' : 'false');
    });
  }catch(e){}
}

function saveCustomExclusions(){
  try{
    _saveActiveCustomFilterState();
    saveCustomFilters();
    localStorage.setItem(CUSTOM_EXCLUSIONS_KEY, JSON.stringify(customExclusionFiles || []));
    localStorage.setItem(CUSTOM_EXCLUSIONS_NAME_KEY, String(customExclusionsName || ''));
  }catch(e){}
}

function escapeHtml(s){
  try{
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }catch(e){ return ''; }
}

function renderCustomExclusionsList(){
  try{
    if(!customExcludeList) return;
    if(!_getActiveCustomFilter()){
      customExcludeList.innerHTML = '<div class="settings-empty">Create a group to add tracks.</div>';
      return;
    }
    if(!Array.isArray(customExclusionFiles) || customExclusionFiles.length === 0){
      customExcludeList.innerHTML = '<div class="settings-empty">No tracks in this group yet.</div>';
      return;
    }
    const cards = customExclusionFiles.map((file)=>{
      const t = tracks.find(x => (x && x.file ? String(x.file).trim() : '') === file);
      const title = t?.title || file;
      const artist = t?.artist || 'Unknown artist';
      return `
        <div class="settings-exclusion-item" data-file="${escapeHtml(file)}">
          <div class="settings-exclusion-item__text">
            <div class="settings-exclusion-item__title">${escapeHtml(title)}</div>
            <div class="settings-exclusion-item__meta">${escapeHtml(artist)}</div>
          </div>
          <button class="settings-exclusion-item__remove" data-remove-file="${escapeHtml(file)}" title="Remove">✕</button>
        </div>
      `;
    });
    customExcludeList.innerHTML = cards.join('');
  }catch(e){}
}

function closeCustomExcludeMenu(){
  try{
    if(customExcludeSelectWrap) customExcludeSelectWrap.classList.remove('open');
    if(customExcludeTrigger) customExcludeTrigger.setAttribute('aria-expanded', 'false');
    if(customExcludeMenu) customExcludeMenu.setAttribute('aria-hidden', 'true');
    customExcludeSearchQuery = '';
    if(customExcludeSearch) customExcludeSearch.value = '';
  }catch(e){}
}

function setCustomExcludeSelection(file){
  try{
    if(!_getActiveCustomFilter()){
      customExcludePendingFile = '';
      if(customExcludeTriggerLabel) customExcludeTriggerLabel.textContent = 'Create a group first';
      return;
    }
    customExcludePendingFile = String(file || '').trim();
    let label = 'Select a track...';
    if(customExcludePendingFile){
      const t = tracks.find(x => (x && x.file ? String(x.file).trim() : '') === customExcludePendingFile);
      label = t ? `${t.title || customExcludePendingFile}${t.artist ? ' — ' + t.artist : ''}` : customExcludePendingFile;
    }
    if(customExcludeTriggerLabel) customExcludeTriggerLabel.textContent = label;
  }catch(e){}
}

function populateCustomExcludeSelect(){
  try{
    if(!customExcludeOptions) return;
    if(!_getActiveCustomFilter()){
      customExcludeOptions.innerHTML = '<button type="button" class="settings-select-option is-disabled" disabled>Create a group first</button>';
      setCustomExcludeSelection('');
      return;
    }
    const q = String(customExcludeSearchQuery || '').trim().toLowerCase();
    const options = [];
    tracks.forEach((t)=>{
      if(!t || !t.file) return;
      const file = String(t.file).trim();
      const title = String(t.title || file);
      const artist = String(t.artist || '');
      if(q){
        const hay = `${title} ${artist} ${String(t.stage||'')} ${String(t.side||'')} ${file}`.toLowerCase();
        if(!hay.includes(q)) return;
      }
      const isDisabled = customExclusionFiles.includes(file);
      const isSelected = customExcludePendingFile === file;
      const cls = `settings-select-option${isDisabled ? ' is-disabled' : ''}${isSelected ? ' is-selected' : ''}`;
      const imgSrc = t.image ? encodeURI(t.image) : getDefaultCover();
      options.push(`<button type="button" class="${cls}" data-file="${escapeHtml(file)}" ${isDisabled ? 'disabled' : ''}><img class="settings-select-option__cover" src="${imgSrc}" alt="" loading="lazy" onerror="this.src='${getDefaultCover()}'"><span class="settings-select-option__text"><span class="settings-select-option__title">${escapeHtml(title)}</span><span class="settings-select-option__meta">${escapeHtml(artist || 'Unknown artist')}</span></span></button>`);
    });
    if(!options.length){
      customExcludeOptions.innerHTML = '<button type="button" class="settings-select-option is-disabled" disabled>No matching tracks</button>';
    }else{
      customExcludeOptions.innerHTML = options.join('');
    }

    if(customExcludePendingFile){
      const stillExists = tracks.some(t => (t && t.file ? String(t.file).trim() : '') === customExcludePendingFile);
      if(!stillExists || customExclusionFiles.includes(customExcludePendingFile)) setCustomExcludeSelection('');
    }
    if(!customExcludePendingFile) setCustomExcludeSelection('');
  }catch(e){}
}

function showSettingsPage(page){
  try{
    const showGeneral = page !== 'exclusions';
    if(settingsPageGeneral){ settingsPageGeneral.style.display = showGeneral ? 'block' : 'none'; settingsPageGeneral.setAttribute('aria-hidden', showGeneral ? 'false' : 'true'); }
    if(settingsPageExclusions){ settingsPageExclusions.style.display = showGeneral ? 'none' : 'block'; settingsPageExclusions.setAttribute('aria-hidden', showGeneral ? 'true' : 'false'); }
    if(settingsTabGeneral){ settingsTabGeneral.classList.toggle('active', showGeneral); settingsTabGeneral.setAttribute('aria-selected', showGeneral ? 'true' : 'false'); }
    if(settingsTabExclusions){ settingsTabExclusions.classList.toggle('active', !showGeneral); settingsTabExclusions.setAttribute('aria-selected', showGeneral ? 'false' : 'true'); }
    if(!showGeneral){
      closeCustomExcludeMenu();
      setCustomExcludeSelection('');
      if(customExclusionsNameInput) customExclusionsNameInput.value = customExclusionsName || '';
      renderCustomProfilesList();
      updateCustomModeButtons();
      populateCustomExcludeSelect();
      renderCustomExclusionsList();
    }
  }catch(e){}
}

function toggleSettingsModal(force){
  try{
    if(!settingsModal) return;
    const currentlyHidden = settingsModal.getAttribute('aria-hidden') === 'true';
    const shouldOpen = (typeof force === 'boolean') ? force : currentlyHidden;
    settingsModal.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    if(shouldOpen){
      showSettingsPage('general');
      if(toggleReduceAnimationsEl) toggleReduceAnimationsEl.checked = !!isReducedAnimations;
      if(toggleLiteModeEl) toggleLiteModeEl.checked = !!isLiteMode;
    }else{
      closeCustomExcludeMenu();
    }
  }catch(e){}
}

function getPlayableIndices(){
  try{
    const out = [];
    for(let i=0;i<tracks.length;i++){
      if(isTrackAllowedByViewFilter(tracks[i])) out.push(i);
    }
    return out;
  }catch(e){ return []; }
}

function findNextAllowedIndex(fromIndex, dir){
  try{
    const n = tracks.length;
    if(!n) return 0;
    const start = (typeof fromIndex === 'number' ? fromIndex : 0);
    for(let step=1; step<=n; step++){
      const cand = (start + (dir * step) + n) % n;
      if(isTrackAllowedByViewFilter(tracks[cand])) return cand;
    }
    return start;
  }catch(e){ return (fromIndex + dir + tracks.length) % tracks.length; }
}

function getDefaultCover(){
  return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#444" rx="24"/><text x="50%" y="50%" font-size="80" fill="#bbb" font-family="Inter, system-ui, Arial, sans-serif" font-weight="700" dominant-baseline="middle" text-anchor="middle">:(</text></svg>');
}
let shuffleQueue = [];
let shuffleCycleFinished = false;
let shuffleHistory = [];
let shuffleForward = [];
// WebAudio gapless loop support
// Seamless WebAudio loop support disabled. Keeping no-op stubs so we can re-enable later if requested.
let audioCtx = null;
const bufferCache = new Map();
const MAX_CACHED_BUFFERS = 10;
const bufferCacheOrder = []; // LRU tracking for cache eviction
let webSource = null;
let webGain = null;
let webStartTime = 0;
let webOffset = 0;
let webPlaying = false;
let webOffsetValid = false;
let webFile = null;
let loopScheduler = {
  overlap: 0.08, // seconds of overlap for crossfade (increased to avoid tiny gaps)
  timerId: null,
  current: null,
  next: null,
  active: false
};
let nextPreloadedIndex = null;
let nextSwitching = false;

// Smooth playhead interpolation for <audio> element (non-WebAudio mode)
let _audioTimeBase = 0;
let _audioTimeStamp = 0;
let _audioSeeking = false;

function _nowMs(){
  try{ return performance && typeof performance.now === 'function' ? performance.now() : Date.now(); }
  catch(e){ return Date.now(); }
}

function getSmoothCurrentTime(){
  try{
    if(webPlaying && webSource && webSource.buffer) return getWebCurrentTime();
    if(!audio) return 0;
    const base = (typeof audio.currentTime === 'number' && isFinite(audio.currentTime)) ? audio.currentTime : 0;
    // if paused or seeking, trust the element's currentTime
    if(audio.paused || _audioSeeking || !isPlaying) return base;
    if(!_audioTimeStamp) return base;
    const dt = (_nowMs() - _audioTimeStamp) / 1000;
    const est = _audioTimeBase + Math.max(0, dt);
    const dur = audio.duration;
    if(dur && isFinite(dur)) return Math.max(0, Math.min(dur, est));
    return Math.max(0, est);
  }catch(e){
    try{ return audio && audio.currentTime ? audio.currentTime : 0; }catch(e2){ return 0; }
  }
}

// Decode and cache an audio file into an AudioBuffer for seamless looping
function computeNextIndexForAuto(){
  try{
    // If shuffling, use shuffle queue
    if(isShuffling && shuffleQueue && shuffleQueue.length>0) return shuffleQueue[0];
    return findNextAllowedIndex(index, 1);
  }catch(e){ return (index + 1) % tracks.length; }
}

async function decodeFile(file){
  if(!file) return null;
  try{
    if(bufferCache.has(file)){
      // Move to end of LRU (most recently used)
      const idx = bufferCacheOrder.indexOf(file);
      if(idx !== -1) bufferCacheOrder.splice(idx, 1);
      bufferCacheOrder.push(file);
      return bufferCache.get(file);
    }
    // lazy-create AudioContext
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    let retries = 2;
    let lastError = null;
    
    while(retries > 0){
      try{
        const res = await fetch(encodeURI(file));
        if(!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const ab = await res.arrayBuffer();
        const buf = await audioCtx.decodeAudioData(ab);
        
        // Evict oldest if cache is full
        if(bufferCache.size >= MAX_CACHED_BUFFERS){
          const oldest = bufferCacheOrder.shift();
          if(oldest) bufferCache.delete(oldest);
        }
        
        bufferCache.set(file, buf);
        bufferCacheOrder.push(file);
        return buf;
      }catch(e){
        lastError = e;
        retries--;
        if(retries > 0){
          // Wait briefly before retry
          await new Promise(r => setTimeout(r, 300));
        }
      }
    }
    
    console.warn('decodeFile failed after retries', file, lastError);
    return null;
  }catch(e){ 
    console.warn('decodeFile failed', e); 
    return null; 
  }
}

function preloadNextTrack(){
  try{
    const nextIdx = computeNextIndexForAuto();
    if(nextIdx!==null && nextIdx!==undefined){
      nextPreloadedIndex = nextIdx;
      const file = tracks[nextIdx] && tracks[nextIdx].file;
      if(file && !bufferCache.has(file)){
        decodeFile(file).catch(()=>{});
      }
    }
    
    // Also preload previous track for instant back navigation
    try{
      const prevIdx = isShuffling ? 
        (shuffleHistory && shuffleHistory.length ? shuffleHistory[shuffleHistory.length - 1] : null) : 
        findNextAllowedIndex(index, -1);
      if(prevIdx !== null && prevIdx !== undefined && prevIdx !== index){
        const prevFile = tracks[prevIdx] && tracks[prevIdx].file;
        if(prevFile && !bufferCache.has(prevFile)){
          decodeFile(prevFile).catch(()=>{});
        }
      }
    }catch(e){}
  }catch(e){}
}
// No-op stop
function stopWebLoop(){
  // stop scheduler sources and clear timers
  try{
    if(loopScheduler.timerId){ clearTimeout(loopScheduler.timerId); loopScheduler.timerId = null; }
    [loopScheduler.current, loopScheduler.next].forEach(s=>{ if(s){ try{ s.source.stop(0); }catch(e){} try{ s.gain.disconnect(); }catch(e){} try{ s.source.disconnect(); }catch(e){} } });
    loopScheduler.current = null; loopScheduler.next = null; loopScheduler.active = false;
    if(webSource){ try{ webSource.stop(0); }catch(e){} try{ webSource.disconnect(); }catch(e){} webSource = null; }
    if(webGain){ try{ webGain.disconnect(); }catch(e){} webGain = null; }
  }catch(e){}
  webPlaying = false;
  webFile = null;
  webOffsetValid = false;
  // If we were using <audio> as a muted media-session anchor, restore it.
  try{ if(audio){ audio.muted = false; audio.loop = false; } }catch(e){}
}
function getWebCurrentTime(){
  try{
    if(webPlaying && webSource && webSource.buffer && audioCtx){
      const dur = (webSource && webSource.buffer) ? webSource.buffer.duration : (loopScheduler.current && loopScheduler.current.buffer ? loopScheduler.current.buffer.duration : 0.000001);
      const pos = (audioCtx.currentTime - webStartTime) % dur;
      return ((pos % dur) + dur) % dur;
    }
    return (webOffsetValid ? webOffset : (audio && audio.currentTime ? audio.currentTime : 0));
  }catch(e){ return (audio && audio.currentTime) ? audio.currentTime : 0; }
}

// schedule continuous looping using two buffer sources with a small crossfade overlap
function scheduleLoopedBuffers(buf, startOffset=0){
  if(!audioCtx || !buf) return false;
  // cleanup existing scheduler
  try{ if(loopScheduler.timerId){ clearTimeout(loopScheduler.timerId); loopScheduler.timerId = null; } }catch(e){}
  loopScheduler.active = true;
  const overlap = Math.min(loopScheduler.overlap, buf.duration * 0.2);
  const now = audioCtx.currentTime;
  // create helper to make a source+gain
  const makeNode = (gainVal=1)=>{
    const src = audioCtx.createBufferSource(); src.buffer = buf; src.loop = false;
    const g = audioCtx.createGain(); g.gain.value = (audio && typeof audio.volume !== 'undefined') ? audio.volume : gainVal; src.connect(g).connect(audioCtx.destination);
    return { source: src, gain: g, buffer: buf };
  };
  // create first source starting at offset
  const first = makeNode(1);
  const startTime = now + 0.002; // tiny scheduling delay
  first.startTime = startTime;
  first.startOffset = startOffset % buf.duration;
  webStartTime = startTime - startOffset;
  first.source.start(startTime, first.startOffset);
  loopScheduler.current = first;
  webSource = first.source; webGain = first.gain;
  webPlaying = true; webFile = webFile || null; webOffsetValid = true; webOffset = startOffset;

  // schedule the recursive scheduler
  const scheduleNext = ()=>{
    if(!loopScheduler.active) return;
    try{
      const cur = loopScheduler.current;
      if(!cur || !cur.buffer) return;
      const dur = cur.buffer.duration;
      // compute precise next start based on this source's start time and offset
      const curStart = cur.startTime || (audioCtx.currentTime);
      const curOffset = cur.startOffset || 0;
      const curCycleLen = dur - curOffset;
      const nextStart = curStart + curCycleLen - overlap;
      let timeUntil = nextStart - audioCtx.currentTime;
      // wake slightly before the start to ensure we can call .start(nextStart) on time
      const wakeMs = Math.max(0, Math.floor(timeUntil * 1000) - 40);
      loopScheduler.timerId = setTimeout(()=>{
        // recompute nextStart in case of drift
        const nowInner = audioCtx.currentTime;
        const recomputedNext = cur.startTime + (cur.buffer.duration - (cur.startOffset||0)) - overlap;
        const finalNextStart = recomputedNext;
        // if we're already past finalNextStart, schedule very near-future start
        const startAt = (finalNextStart > nowInner + 0.005) ? finalNextStart : (nowInner + 0.004);
        if(!loopScheduler.active) return;
        // create next node, start it at nextStart, crossfade gains
        const nxt = makeNode(0);
        nxt.startTime = startAt;
        nxt.startOffset = 0;
        nxt.source.start(startAt, 0);
        // fade in next, fade out current
        try{ const targetVol = (audio && typeof audio.volume !== 'undefined') ? audio.volume : 1; nxt.gain.gain.setValueAtTime(0, startAt - 0.001); nxt.gain.gain.linearRampToValueAtTime(targetVol, startAt + overlap - 0.001); }catch(e){}
        try{ const targetVol = (audio && typeof audio.volume !== 'undefined') ? audio.volume : 1; cur.gain.gain.setValueAtTime(targetVol, startAt - overlap - 0.001); cur.gain.gain.linearRampToValueAtTime(0, startAt + 0.001); }catch(e){}
        // schedule cleanup of old source after crossfade
        const cleanupMs = Math.floor((overlap + 0.02) * 1000) + 20;
        setTimeout(()=>{ try{ if(cur && cur.source){ cur.source.stop(0); } }catch(e){} try{ cur.gain.disconnect(); }catch(e){} }, cleanupMs);
        // rotate
        loopScheduler.current = nxt;
        loopScheduler.next = null;
        webSource = nxt.source; webGain = nxt.gain;
        // schedule the next iteration
        scheduleNext();
      }, Math.max(4, Math.floor(timeUntil * 1000)));
    }catch(e){ console.warn('scheduleNext failed', e); }
  };
  scheduleNext();
  return true;
}

// Attempt to switch playback to a WebAudio loop for true gapless looping.
// Returns true on success.
function switchToWebLoop(file, offset=0){
  try{
    if(!file) return false;
    
    // Use the waveform's audioContext if it exists, otherwise create one
    if(audioContext && !audioCtx){
      audioCtx = audioContext;
    } else if(!audioCtx && audioContext){
      audioCtx = audioContext;
    } else if(!audioCtx){
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    try{ if(audioCtx && audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') audioCtx.resume(); }catch(e){}
    const buf = bufferCache.get(file);
    if(!buf) return false;
    offset = Math.max(0, Math.min(offset, buf.duration || 0));
    // create source + gain
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = (audio && typeof audio.volume !== 'undefined') ? audio.volume : 1;
    
    // Connect to analyser for waveform visualization if available
    if(analyser){
      src.connect(gain);
      gain.connect(analyser);
    } else {
      src.connect(gain).connect(audioCtx.destination);
    }
    
    // schedule start slightly in the future to coordinate a mute/pause transition and avoid overlap
    const now = audioCtx.currentTime;
    const audioIsPlaying = !!(audio && !audio.paused);
    // if the <audio> element is not playing currently, start the WebAudio source almost immediately
    const startDelay = audioIsPlaying ? 0.05 : 0.002;
    const startTime = now + startDelay;
    webStartTime = startTime - offset;
    // prepare gain: if audio was already playing, crossfade; if starting fresh, set gain instantly
    const targetVol = (audio && typeof audio.volume !== 'undefined') ? audio.volume : 1;
    if(audioIsPlaying){
      gain.gain.setValueAtTime(0, Math.max(0, startTime - 0.002));
      const rampTargetTime = startTime + 0.06;
      gain.gain.linearRampToValueAtTime(targetVol, rampTargetTime);
    } else {
      // no fade-in when starting from idle — set target volume at start time
      gain.gain.setValueAtTime(targetVol, startTime);
    }
    // Keep <audio> as a muted anchor while WebAudio is active (helps iPadOS show lock-screen metadata).
    try{ if(audio){ audio.muted = true; audio.loop = true; } }catch(e){}
    // start at offset at the scheduled time; let it loop indefinitely
    src.start(startTime, offset % buf.duration);
    // Ensure the media element is actually playing (muted) so iPadOS has an active media session.
    try{ if(audio && audio.src){ audio.play().catch(()=>{}); } }catch(e){}
    // stop any previous web source
    try{ if(webSource){ try{ webSource.stop(); }catch(e){} try{ webSource.disconnect(); }catch(e){} } }catch(e){}
    webSource = src;
    webGain = gain;
    webPlaying = true;
    webFile = file;
    webOffset = offset;
    webOffsetValid = true;
    return true;
  }catch(e){ console.warn('switchToWebLoop failed', e); return false; }
}
let _bg2PendingListener = null;

function buildShuffleQueue(current){
  const allowed = getPlayableIndices();
  if(!allowed || allowed.length <= 1) return [];
  const arr = allowed.filter(i=>i!==current);
  for(let i=arr.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]] = [arr[j],arr[i]] }
  return arr;
}

function setPreloading(active){
  try{
    if(active){
      try{ showPreloadToast("Preloading... This shouldn't take long."); }catch(e){}
      // stop progress updates and show preload state
      try{ stopProgress(); }catch(e){}
      // Never render long text here (it overlaps the seek UI). Keep duration at 0:00 while preloading.
      if(mRem) mRem.textContent = fmt(0);
      if(miniRem) miniRem.textContent = fmt(0);
      // Don't change trackTitle during preloading - it should always show the actual track name
      if(mCur) mCur.textContent = fmt(0);
      if(miniCur) miniCur.textContent = fmt(0);
      try{ if(mSeek) { mSeek.value = 0; } if(miniSeek){ miniSeek.value = 0; } }catch(e){}
      try{ setSeekPercent(0); }catch(e){}
      // If no audio source is loaded, disable mini controls during restore so they appear greyed.
      try{
        if(!audio || !audio.src){
          if(miniPrev) miniPrev.disabled = true;
          if(miniPlay) miniPlay.disabled = true;
          if(miniNext) miniNext.disabled = true;
          if(miniShuffle) miniShuffle.disabled = true;
          if(miniLoop) miniLoop.disabled = true;
          if(miniSeek) miniSeek.disabled = true;
        }
      }catch(e){}
      document.body.classList.add('preloading');
    } else {
      try{ hidePreloadToast(); }catch(e){}
      // restore with current times; if WebAudio is active show buffer duration
      try{
        if(webPlaying && webSource && webSource.buffer){
          const d = webSource.buffer.duration;
          if(mRem) mRem.textContent = (isFinite(d)? fmt(d) : '');
          if(miniRem) miniRem.textContent = (isFinite(d)? fmt(d) : '');
          const cur = getWebCurrentTime();
          if(mCur) mCur.textContent = fmt(cur);
          if(miniCur) miniCur.textContent = fmt(cur);
          } else {
            // If no track is loaded, keep the UI in the "No song playing" state.
            const hasSrc = !!(audio && audio.src);
            if(mRem) mRem.textContent = hasSrc ? '' : fmt(0);
            if(miniRem) miniRem.textContent = hasSrc ? '' : fmt(0);
            try{
              if(hasSrc){
                const t = tracks[index];
                if(t && trackTitle) trackTitle.textContent = t.title;
              }
            }catch(e){}
            // Re-enable mini controls only if an audio source is present (a track is loaded)
            try{
              if(audio && audio.src){
                if(miniPrev) miniPrev.disabled = false;
                if(miniPlay) miniPlay.disabled = false;
                if(miniNext) miniNext.disabled = false;
                if(miniShuffle) miniShuffle.disabled = false;
                if(miniLoop) miniLoop.disabled = false;
                if(miniSeek) miniSeek.disabled = false;
              }
            }catch(e){}
        }
      }catch(e){}
      document.body.classList.remove('preloading');
    }
  }catch(e){}

}

async function init(){
  try{ setupMediaSession(); }catch(e){}
  try{ setupIOSPauseOnBackground(); }catch(e){}
  const resp = await fetch('tracks.json');
  tracks = await resp.json();

  // Seed trackDurations from any pre-baked `duration` fields in tracks.json
  try{
    tracks.forEach((t,i)=>{
      if(typeof t.duration==='number'&&t.duration>0){
        trackDurations[i]=t.duration;
        durationLoadedCount++;
      }
    });
    updateOSTDuration();
  }catch(e){}

  // Copy link buttons (hero/mini/modal)
  try{ _setupStaticCopyButtons(); }catch(e){}

  // Search bar
  try{
    if(searchInput){
      searchInput.addEventListener('input', ()=>{
        try{ searchQuery = String(searchInput.value || ''); }catch(e){ searchQuery = ''; }
        try{ renderList(); }catch(e){}
      });
    }
  }catch(e){}

  // restore settings & custom groups
  try{
    isReducedAnimations = localStorage.getItem(REDUCE_ANIMATIONS_KEY) === '1';
    isLiteMode = localStorage.getItem(LITE_MODE_KEY) === '1';
    const rawFilters = localStorage.getItem(CUSTOM_FILTERS_KEY);
    if(rawFilters){
      const parsedFilters = JSON.parse(rawFilters);
      if(Array.isArray(parsedFilters)){
        customFilters = parsedFilters.map(f => ({
          id: String(f?.id || _newCustomFilter().id),
          name: String(Object.prototype.hasOwnProperty.call(f || {}, 'name') ? (f?.name || '') : 'Custom group').trim(),
          mode: (f?.mode === 'include') ? 'include' : 'exclude',
          files: Array.isArray(f?.files) ? f.files.map(x=>String(x||'').trim()).filter(Boolean) : []
        }));
      }
    }

    // migration from legacy single-list keys
    if(!Array.isArray(customFilters) || customFilters.length === 0){
      const legacyName = String(localStorage.getItem(CUSTOM_EXCLUSIONS_NAME_KEY) || '').trim();
      const rawCustom = localStorage.getItem(CUSTOM_EXCLUSIONS_KEY);
      let legacyFiles = [];
      if(rawCustom){
        const parsed = JSON.parse(rawCustom);
        if(Array.isArray(parsed)) legacyFiles = parsed.map(x=>String(x||'').trim()).filter(Boolean);
      }
      if(legacyName || legacyFiles.length > 0){
        const base = _newCustomFilter(legacyName || 'Custom group');
        base.files = legacyFiles;
        customFilters = [base];
        activeCustomFilterId = base.id;
        saveCustomFilters();
      }
    }

    activeCustomFilterId = String(localStorage.getItem(CUSTOM_FILTERS_ACTIVE_KEY) || '').trim();
    _loadActiveCustomFilterState();
  }catch(e){}
  applyVisualSettings();
  renderCustomProfilesList();
  updateCustomModeButtons();
  updateCustomFilterOption();

  // restore saved view filter (persisted across refreshes)
  try{
    const saved = localStorage.getItem('gb:viewFilter');
    if(saved && (saved === 'all' || saved === 'exclude' || saved === 'only' || saved === 'custom')){
      currentViewFilter = saved;
      if(currentViewFilter === 'custom' && !isCustomFilterAvailable()) currentViewFilter = 'all';
      window.currentViewFilter = currentViewFilter;
    }
    syncViewDropdownPressed();
  }catch(e){}
  renderList();

  // restore listen history FIRST — before any loadTrack call can fire recordHistoryEntry
  try{
    const raw = localStorage.getItem(HISTORY_KEY);
    if(raw){ const parsed = JSON.parse(raw); if(Array.isArray(parsed)) listenHistory = parsed.slice(0, MAX_HISTORY); }
  }catch(e){ console.warn('restore history failed', e); }

  // restore scroll position saved from previous session
  try{
    const savedY = parseInt(localStorage.getItem('gb:scrollY')||'0',10);
    if(!Number.isNaN(savedY) && savedY > 0){ window.scrollTo(0, savedY); }
  }catch(e){}
  // don't auto-load a track on startup; show default 'No song playing'
  try{
    const defaultCover = getDefaultCover();
    if(miniCover) miniCover.src = defaultCover;
    if(miniTitle) miniTitle.textContent = 'No song playing';
    if(miniArtist) miniArtist.textContent = '';
    if(mCover) mCover.src = defaultCover;
    if(coverImg) coverImg.src = defaultCover;
    if(mTitle) mTitle.textContent = 'No song playing';
    if(mArtist) mArtist.textContent = '';
    if(trackTitle) trackTitle.textContent = 'No song playing';
    if(trackArtist) trackArtist.textContent = '';
    try{
      _setCopyButtonState(heroCopyLink, null);
      _setCopyButtonState(miniCopyLink, null);
      _setCopyButtonState(mCopyLink, null);
    }catch(e){}
  }catch(e){}

  // If a deep link is present, load that track (but don't autoplay).
  try{
    const url = new URL(window.location.href);
    const songParam = url.searchParams.get('song');
    const idx = findTrackIndexBySongParam(songParam);
    if(idx >= 0){
      loadTrack(idx, {fade:'in'});
    }
  }catch(e){}

  // Modal persistence: if the user refreshed while the full-screen player was open, restore it.
  // Never autoplay on restore.
  try{
    const modalOpen = localStorage.getItem('gb:modalOpen') === '1';
    if(modalOpen){
      let targetIndex = index;
      const savedIdx = parseInt(localStorage.getItem('gb:modalIndex') || '', 10);
      const hasLoaded = !!(audio && audio.src);
      if(!hasLoaded && !Number.isNaN(savedIdx) && savedIdx >= 0 && savedIdx < tracks.length){
        targetIndex = savedIdx;
      }
      openModal(targetIndex, { autoplay: false, restore: true });
    }
  }catch(e){}
  // restore settings
  try{
    const vol = localStorage.getItem('gb:volume');
    if(vol!==null && typeof mVolume !== 'undefined' && mVolume) { mVolume.value = vol; audio.volume = parseFloat(vol); }
    const sh = localStorage.getItem('gb:shuffle');
    if(sh==='1'){ setShuffleState(true); }
    const lp = localStorage.getItem('gb:loop');
    if(lp === 'one' || lp === 'all'){ setLoopState(lp); }
    else if(lp === '1'){ setLoopState('one'); } // legacy
    const ap = localStorage.getItem('gb:autoplay');
    if(ap === '0'){ setAutoplayState(false); }
    const last = localStorage.getItem('gb:lastIndex');
    // remember last index but do NOT auto-load it on startup — show "No song playing" instead
    if(last!==null){ const li = parseInt(last,10); if(!isNaN(li) && li>=0 && li<tracks.length) { /* lastSaved = li; */ } }
  }catch(e){console.warn('restore settings failed',e)}

  // wire history panel buttons
  try{
    const histBtn = document.getElementById('historyBtn');
    if(histBtn) histBtn.addEventListener('click', ()=>{ toggleHistoryPanel(); });
    const histClear = document.getElementById('historyClearBtn');
    if(histClear) histClear.addEventListener('click', ()=>{ clearListenHistory(); });
    const histClose = document.getElementById('historyCloseBtn');
    if(histClose) histClose.addEventListener('click', ()=>{ toggleHistoryPanel(); });
    const histOverlay = document.getElementById('historyOverlay');
    if(histOverlay) histOverlay.addEventListener('click', ()=>{ toggleHistoryPanel(); });
  }catch(e){ console.warn('history wiring failed', e); }

  // Download All button
  try{
    const adjustDownloadTooltipAlignment = ()=>{
      try{
        if(!downloadAllBtn) return;
        const rect = downloadAllBtn.getBoundingClientRect();
        const tooltipMax = 300;
        if(rect.left + tooltipMax > window.innerWidth - 12){ downloadAllBtn.classList.add('tooltip-right'); }
        else { downloadAllBtn.classList.remove('tooltip-right'); }
      }catch(e){}
    };
    if(downloadAllBtn){
      downloadAllBtn.addEventListener('mouseenter', adjustDownloadTooltipAlignment);
      downloadAllBtn.addEventListener('focus', adjustDownloadTooltipAlignment);
      downloadAllBtn.addEventListener('click', async ()=>{
        try{ downloadAllBtn.disabled = true; await downloadAllTracks(); }catch(e){ console.warn(e); }
        try{ downloadAllBtn.disabled = false; }catch(e){}
      });
    }
    window.addEventListener('resize', adjustDownloadTooltipAlignment);
  }catch(e){}

  // View dropdown behavior
  try{
    if(viewBtn && viewDropdown){
      const closeDropdown = ()=>{ viewBtn.setAttribute('aria-expanded','false'); viewDropdown.setAttribute('aria-hidden','true'); };
      const openDropdown = ()=>{ viewBtn.setAttribute('aria-expanded','true'); viewDropdown.setAttribute('aria-hidden','false'); };
      viewBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); const open = viewBtn.getAttribute('aria-expanded') === 'true'; if(open) closeDropdown(); else openDropdown(); });
      // selection: single-select behavior
      viewDropdown.addEventListener('click', (ev)=>{
        const item = ev.target.closest('.dropdown-item');
        if(!item) return;
        const val = item.dataset.value;
        if(val === 'custom' && !isCustomFilterAvailable()) return;
        // mark selected
        viewDropdown.querySelectorAll('.dropdown-item').forEach(d=>d.setAttribute('aria-pressed','false'));
        item.setAttribute('aria-pressed','true');
        // update filter, persist it, and re-render list
        try{ currentViewFilter = val; window.currentViewFilter = val; try{ localStorage.setItem('gb:viewFilter', val); }catch(e){} }catch(e){}
        // close after selection
        closeDropdown();
        try{ renderList(); }catch(e){}
        // if shuffle is active, rebuild the shuffle queue against the new filter
        try{ if(isShuffling) setShuffleState(true); }catch(e){}
      });
      // close when clicking outside or pressing Escape
      document.addEventListener('click', ()=>{ closeDropdown(); });
      document.addEventListener('keydown', (ev)=>{ if(ev.key === 'Escape') closeDropdown(); });
    }
  }catch(e){}

  // Global hotkeys: L = loop toggle, Shift+ArrowRight = next, Shift+ArrowLeft = prev, ? = show shortcuts
  try{
    // Setup keyboard hint toggle
    const toggleKeyboardHint = ()=>{
      try{
        if(!keyboardHint) return;
        const isHidden = keyboardHint.getAttribute('aria-hidden') === 'true';
        keyboardHint.setAttribute('aria-hidden', isHidden ? 'false' : 'true');
      }catch(e){}
    };
    
    // Setup info modal toggle
    const toggleInfoModal = ()=>{
      try{
        if(!infoModal) return;
        const isHidden = infoModal.getAttribute('aria-hidden') === 'true';
        infoModal.setAttribute('aria-hidden', isHidden ? 'false' : 'true');
      }catch(e){}
    };

    const addCustomExclusionFromSelect = ()=>{
      try{
        const file = String(customExcludePendingFile || '').trim();
        if(!file) return;
        if(!customExclusionFiles.includes(file)) customExclusionFiles.push(file);
        setCustomExcludeSelection('');
        saveCustomExclusions();
        renderCustomProfilesList();
        updateCustomFilterOption();
        populateCustomExcludeSelect();
        renderCustomExclusionsList();
        syncViewDropdownPressed();
        try{ renderList(); }catch(e){}
      }catch(e){}
    };
    
    // Help button opens info modal
    if(helpBtn){
      helpBtn.addEventListener('click', ()=>{
        try{ toggleInfoModal(); }catch(e){}
      });
    }

    if(settingsBtn){
      settingsBtn.addEventListener('click', ()=>{
        try{ toggleSettingsModal(true); }catch(e){}
      });
    }

    if(settingsTabGeneral){ settingsTabGeneral.addEventListener('click', ()=>{ showSettingsPage('general'); }); }
    if(settingsTabExclusions){ settingsTabExclusions.addEventListener('click', ()=>{ showSettingsPage('exclusions'); }); }

    if(toggleReduceAnimationsEl){
      toggleReduceAnimationsEl.addEventListener('change', ()=>{
        isReducedAnimations = !!toggleReduceAnimationsEl.checked;
        try{ localStorage.setItem(REDUCE_ANIMATIONS_KEY, isReducedAnimations ? '1' : '0'); }catch(e){}
        applyVisualSettings();
      });
    }
    if(toggleLiteModeEl){
      toggleLiteModeEl.addEventListener('change', ()=>{
        isLiteMode = !!toggleLiteModeEl.checked;
        try{ localStorage.setItem(LITE_MODE_KEY, isLiteMode ? '1' : '0'); }catch(e){}
        applyVisualSettings();
      });
    }

    if(customExcludeAddBtn){ customExcludeAddBtn.addEventListener('click', addCustomExclusionFromSelect); }
    if(customExclusionsNameInput){
      customExclusionsNameInput.addEventListener('input', ()=>{
        if(!_getActiveCustomFilter()) return;
        customExclusionsName = String(customExclusionsNameInput.value || '').trim();
        saveCustomExclusions();
        renderCustomProfilesList();
        updateCustomFilterOption();
      });
    }

    if(customProfilesList){
      customProfilesList.addEventListener('click', (ev)=>{
        const btn = ev.target.closest('[data-profile-id]');
        if(!btn) return;
        const id = String(btn.getAttribute('data-profile-id') || '').trim();
        if(!id) return;
        setActiveCustomFilter(id);
      });
    }
    if(customProfileNewBtn){
      customProfileNewBtn.addEventListener('click', ()=>{
        const created = _newCustomFilter('');
        customFilters.push(created);
        activeCustomFilterId = created.id;
        _loadActiveCustomFilterState();
        saveCustomFilters();
        renderCustomProfilesList();
        updateCustomModeButtons();
        updateCustomFilterOption();
        if(customExclusionsNameInput) customExclusionsNameInput.value = customExclusionsName || '';
        setCustomExcludeSelection('');
        populateCustomExcludeSelect();
        renderCustomExclusionsList();
      });
    }
    if(customProfileDeleteBtn){
      customProfileDeleteBtn.addEventListener('click', ()=>{
        if(!Array.isArray(customFilters) || customFilters.length === 0) return;
        const idx = customFilters.findIndex(f => f && f.id === activeCustomFilterId);
        if(idx < 0) return;
        customFilters.splice(idx, 1);
        if(customFilters.length > 0){
          const fallback = customFilters[Math.max(0, idx - 1)] || customFilters[0];
          activeCustomFilterId = fallback.id;
          _loadActiveCustomFilterState();
        }else{
          activeCustomFilterId = '';
          customExclusionFiles = [];
          customExclusionsMode = 'exclude';
          customExclusionsName = '';
        }
        saveCustomFilters();
        if(customFilters.length === 0){
          try{ localStorage.removeItem(CUSTOM_EXCLUSIONS_KEY); }catch(e){}
          try{ localStorage.removeItem(CUSTOM_EXCLUSIONS_NAME_KEY); }catch(e){}
        }
        renderCustomProfilesList();
        updateCustomModeButtons();
        updateCustomGroupControls();
        updateCustomFilterOption();
        if(customExclusionsNameInput) customExclusionsNameInput.value = customExclusionsName || '';
        setCustomExcludeSelection('');
        populateCustomExcludeSelect();
        renderCustomExclusionsList();
        syncViewDropdownPressed();
        try{ renderList(); }catch(e){}
      });
    }
    if(customModeExcludeBtn){
      customModeExcludeBtn.addEventListener('click', ()=>{
        customExclusionsMode = 'exclude';
        saveCustomExclusions();
        updateCustomModeButtons();
        renderCustomProfilesList();
        updateCustomFilterOption();
        try{ renderList(); }catch(e){}
      });
    }
    if(customModeIncludeBtn){
      customModeIncludeBtn.addEventListener('click', ()=>{
        customExclusionsMode = 'include';
        saveCustomExclusions();
        updateCustomModeButtons();
        renderCustomProfilesList();
        updateCustomFilterOption();
        try{ renderList(); }catch(e){}
      });
    }
    if(customExcludeTrigger){
      customExcludeTrigger.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        const open = !!(customExcludeSelectWrap && customExcludeSelectWrap.classList.contains('open'));
        if(open){
          closeCustomExcludeMenu();
        }else{
          if(customExcludeSelectWrap) customExcludeSelectWrap.classList.add('open');
          if(customExcludeTrigger) customExcludeTrigger.setAttribute('aria-expanded', 'true');
          if(customExcludeMenu) customExcludeMenu.setAttribute('aria-hidden', 'false');
          if(customExcludeSearch){
            customExcludeSearchQuery = '';
            customExcludeSearch.value = '';
          }
          populateCustomExcludeSelect();
          try{ if(customExcludeSearch) customExcludeSearch.focus(); }catch(e){}
        }
      });
    }
    if(customExcludeSearch){
      customExcludeSearch.addEventListener('input', ()=>{
        customExcludeSearchQuery = String(customExcludeSearch.value || '');
        populateCustomExcludeSelect();
      });
      customExcludeSearch.addEventListener('click', (ev)=>{ ev.stopPropagation(); });
    }
    if(customExcludeMenu){
      customExcludeMenu.addEventListener('click', (ev)=>{
        const opt = ev.target.closest('[data-file]');
        if(!opt || opt.disabled) return;
        const file = String(opt.getAttribute('data-file') || '').trim();
        setCustomExcludeSelection(file);
        populateCustomExcludeSelect();
        closeCustomExcludeMenu();
      });
    }
    if(customExcludeList){
      customExcludeList.addEventListener('click', (ev)=>{
        const btn = ev.target.closest('[data-remove-file]');
        if(!btn) return;
        const file = String(btn.getAttribute('data-remove-file') || '').trim();
        if(!file) return;
        customExclusionFiles = customExclusionFiles.filter(x => x !== file);
        if(customExcludePendingFile === file) setCustomExcludeSelection('');
        saveCustomExclusions();
        renderCustomProfilesList();
        updateCustomFilterOption();
        populateCustomExcludeSelect();
        renderCustomExclusionsList();
        syncViewDropdownPressed();
        try{ renderList(); }catch(e){}
      });
    }
    if(customExcludeClearBtn){
      customExcludeClearBtn.addEventListener('click', ()=>{
        customExclusionFiles = [];
        setCustomExcludeSelection('');
        saveCustomExclusions();
        renderCustomProfilesList();
        updateCustomFilterOption();
        populateCustomExcludeSelect();
        renderCustomExclusionsList();
        syncViewDropdownPressed();
        try{ renderList(); }catch(e){}
      });
    }
    
    // "View Keyboard Shortcuts" button in info modal
    if(showHotkeysBtn){
      showHotkeysBtn.addEventListener('click', ()=>{
        try{
          toggleInfoModal(); // close info
          setTimeout(()=>{ toggleKeyboardHint(); }, 100); // open hotkeys
        }catch(e){}
      });
    }
    
    // Close keyboard hint on click
    if(keyboardHint){
      keyboardHint.addEventListener('click', (ev)=>{
        if(ev.target === keyboardHint) toggleKeyboardHint();
      });
    }
    
    // Close info modal on click
    if(infoModal){
      infoModal.addEventListener('click', (ev)=>{
        if(ev.target === infoModal) toggleInfoModal();
      });
    }
    if(settingsModal){
      settingsModal.addEventListener('click', (ev)=>{
        if(ev.target === settingsModal) toggleSettingsModal(false);
      });
    }
    
    // Context menu setup
    if(trackContextMenu){
      // Prevent menu clicks from closing it immediately
      trackContextMenu.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        const item = ev.target.closest('.context-menu__item');
        if(!item) return;
        const action = item.dataset.action;
        const trackIndex = contextMenuTrackIndex;
        
        hideContextMenu();
        
        if(trackIndex < 0 || trackIndex >= tracks.length) return;
        
        try{
          if(action === 'play'){
            loadTrack(trackIndex, {fade:'in'});
            play();
          } else if(action === 'copyLink'){
            const t = tracks[trackIndex];
            const url = getSongShareUrlForTrack(t);
            copyTextToClipboard(url);
          } else if(action === 'download'){
            const t = tracks[trackIndex];
            const a = document.createElement('a');
            a.href = encodeURI(t.file);
            a.download = `${t.title}.mp3`;
            a.click();
          }
        }catch(e){ console.warn('Context menu action failed', e); }
      });
    }
    
    // Click anywhere to close context menu (except on the menu itself)
    document.addEventListener('click', (ev)=>{ 
      if(customExcludeSelectWrap && !ev.target.closest('#customExcludeSelectWrap')) closeCustomExcludeMenu();
      if(!ev.target.closest('#trackContextMenu')){
        hideContextMenu(); 
      }
    });
    document.addEventListener('contextmenu', (ev)=>{
      if(!ev.target.closest('.track')){
        hideContextMenu();
      }
    });
    
    document.addEventListener('keydown', (ev)=>{
      // ignore when focused on inputs or editable areas
      const tgt = ev.target || {};
      const tag = (tgt.tagName || '').toUpperCase();
      if(tag === 'INPUT' || tag === 'TEXTAREA' || tgt.isContentEditable) return;
      
      // ? key shows keyboard shortcuts
      if(ev.key === '?' || (ev.shiftKey && ev.key === '/')){
        try{ toggleKeyboardHint(); ev.preventDefault(); }catch(e){}
        return;
      }
      
      // ESC closes keyboard hint or info modal if visible
      if(ev.key === 'Escape'){
        if(keyboardHint && keyboardHint.getAttribute('aria-hidden') === 'false'){
          try{ toggleKeyboardHint(); ev.preventDefault(); }catch(e){}
          return;
        }
        if(infoModal && infoModal.getAttribute('aria-hidden') === 'false'){
          try{ toggleInfoModal(); ev.preventDefault(); }catch(e){}
          return;
        }
        if(settingsModal && settingsModal.getAttribute('aria-hidden') === 'false'){
          try{ toggleSettingsModal(false); ev.preventDefault(); }catch(e){}
          return;
        }
        if(modal && !modal.classList.contains('hidden')){
          try{ closeModal(); ev.preventDefault(); }catch(e){}
          return;
        }
      }
      
      if(ev.key === 'l' || ev.key === 'L'){
        try{ toggleLoop(); }catch(e){}
      }
      if(ev.key === 'a' || ev.key === 'A'){
        try{ toggleAutoplay(); }catch(e){}
      }
      if(ev.key === 'h' || ev.key === 'H'){
        try{ toggleHistoryPanel(); }catch(e){}
      }
      if(ev.key === 'ArrowRight' && ev.shiftKey){
        try{ if(audio && audio.src) { skip(1); ev.preventDefault(); } }catch(e){}
      }
      if(ev.key === 'ArrowLeft' && ev.shiftKey){
        try{ if(audio && audio.src) { skip(-1); ev.preventDefault(); } }catch(e){}
      }
    });
  }catch(e){}
  // Startup-only: if the user loads a song while restore is still running, don't clobber the active UI.
  try{
    const hasLoadedTrack = !!(audio && audio.src);
    if(!hasLoadedTrack){
      if(miniPlayer){ miniPlayer.classList.remove('hidden'); miniPlayer.classList.add('no-song'); }
      if(miniPrev) miniPrev.disabled = true;
      if(miniPlay) miniPlay.disabled = true;
      if(miniNext) miniNext.disabled = true;
      if(miniShuffle) miniShuffle.disabled = true;
      if(miniLoop) miniLoop.disabled = true;
      if(mPrev) mPrev.disabled = true;
      if(mPlay) mPlay.disabled = true;
      if(mNext) mNext.disabled = true;
      if(mShuffle) mShuffle.disabled = true;
      if(mLoop) mLoop.disabled = true;
      if(mSeek) mSeek.disabled = true;
      if(miniSeek) miniSeek.disabled = true;
    } else {
      // A track is already loaded/playing: keep controls enabled and avoid applying the "no-song" grey state.
      if(miniPlayer){ miniPlayer.classList.remove('hidden'); miniPlayer.classList.remove('no-song'); }
      if(miniPrev) miniPrev.disabled = false;
      if(miniPlay) miniPlay.disabled = false;
      if(miniNext) miniNext.disabled = false;
      if(miniShuffle) miniShuffle.disabled = false;
      if(miniLoop) miniLoop.disabled = false;
      if(mPrev) mPrev.disabled = false;
      if(mPlay) mPlay.disabled = false;
      if(mNext) mNext.disabled = false;
      if(mShuffle) mShuffle.disabled = false;
      if(mLoop) mLoop.disabled = false;
      if(mSeek) mSeek.disabled = false;
      if(miniSeek) miniSeek.disabled = false;
      try{ document.body.classList.add('has-track'); }catch(e){}
    }
  }catch(e){}
  try{ preloadAllDurations(); }catch(e){}

}

function fmtTotal(s){
  s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);
  return h>0?`${h}h ${m}m`:`${m}m`;
}
function updateOSTDuration(){
  try{
    if(!ostDurationEl||!tracks||!tracks.length) return;
    // Apply same view filter + search behavior source as renderList
    const filtered=tracks.filter((t)=>isTrackAllowedByViewFilter(t));
    const known=filtered.filter(t=>typeof t.duration==='number'&&t.duration>0);
    if(!known.length) return;
    const total=known.reduce((a,t)=>a+t.duration,0);
    if(total>0){
      ostDurationEl.textContent=`${fmtTotal(total)} \u00b7 ${filtered.length} tracks`;
      ostDurationEl.style.opacity='0.75';
    }
  }catch(e){}
}
// ── Listen History ─────────────────────────────────────────────────────────

function recordHistoryEntry(t){
  if(!t) return;
  const entry = {
    title:    t.title    || '',
    artist:   t.artist   || '',
    image:    t.image    || '',
    duration: t.duration || null,
    stage:    t.stage    || '',
    side:     t.side     || '',
    ts:       Date.now()
  };
  listenHistory.unshift(entry);
  if(listenHistory.length > MAX_HISTORY) listenHistory.length = MAX_HISTORY;
  try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(listenHistory)); }catch(e){}
  // live-refresh panel if it's open
  try{
    const panel = document.getElementById('historyPanel');
    if(panel && panel.classList.contains('open')) renderHistoryPanel();
  }catch(e){}
}

function _relativeTime(ts){
  const diff = Date.now() - ts;
  const sec  = Math.floor(diff / 1000);
  const min  = Math.floor(sec  / 60);
  const hr   = Math.floor(min  / 60);
  const day  = Math.floor(hr   / 24);
  if(sec < 60)  return 'Just now';
  if(min < 60)  return `${min}m ago`;
  if(hr  < 24)  return `${hr}h ago`;
  if(day === 1) return 'Yesterday';
  if(day <  7)  return `${day}d ago`;
  return new Date(ts).toLocaleDateString(undefined, {month:'short', day:'numeric'});
}

function _fmtDur(sec){
  if(!sec || !isFinite(sec)) return '';
  const m = Math.floor(sec/60), s = Math.floor(sec%60);
  return `${m}:${s.toString().padStart(2,'0')}`;
}

function renderHistoryPanel(){
  const list = document.getElementById('historyList');
  const stats = document.getElementById('historyStats');
  if(!list) return;

  // stats
  if(stats){
    if(listenHistory.length === 0){
      stats.textContent = '';
    } else {
      const unique = new Set(listenHistory.map(e => e.title + e.artist)).size;
      stats.textContent = `${listenHistory.length} play${listenHistory.length===1?'':'s'} \u00b7 ${unique} unique track${unique===1?'':'s'}`;
    }
  }

  if(listenHistory.length === 0){
    list.innerHTML = `
      <div class="history-empty">
        <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path fill="currentColor" opacity=".35" d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
        <p>No history yet</p>
        <span>Tracks you play will appear here</span>
      </div>`;
    return;
  }

  list.innerHTML = listenHistory.map((e, idx) => {
    const dur  = e.duration ? `<span class="history-entry__dur">${_fmtDur(e.duration)}</span>` : '';
    const time = `<span class="history-entry__time">${_relativeTime(e.ts)}</span>`;
    const imgSrc = e.image ? encodeURI(e.image) : '';
    return `
    <div class="history-entry" data-idx="${idx}" role="listitem">
      <img class="history-entry__cover" src="${imgSrc}" alt="" loading="lazy" onerror="this.style.opacity='.3'">
      <div class="history-entry__info">
        <div class="history-entry__title">${e.title}</div>
        <div class="history-entry__meta">${e.artist}${dur ? ' &middot; ' + dur : ''}</div>
      </div>
      <div class="history-entry__right">
        ${time}
        <button class="history-entry__play" data-hist-idx="${idx}" title="Play" aria-label="Play ${e.title}">
          <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  // wire play buttons
  list.querySelectorAll('.history-entry__play').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      const hi = parseInt(btn.dataset.histIdx, 10);
      const entry = listenHistory[hi];
      if(!entry || !tracks) return;
      // find track index by matching title + artist
      const ti = tracks.findIndex(t => t.title === entry.title && (t.artist||'') === entry.artist);
      if(ti < 0) return;
      loadTrack(ti, {fade:'cross'});
      play();
    });
  });
}

function toggleHistoryPanel(){
  const panel = document.getElementById('historyPanel');
  const overlay = document.getElementById('historyOverlay');
  if(!panel) return;
  const open = panel.classList.toggle('open');
  panel.setAttribute('aria-hidden', open ? 'false' : 'true');
  if(overlay) overlay.classList.toggle('open', open);
  document.getElementById('historyBtn')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  if(open) renderHistoryPanel();
}

function clearListenHistory(){
  listenHistory = [];
  try{ localStorage.removeItem(HISTORY_KEY); }catch(e){}
  renderHistoryPanel();
}

// ── End Listen History ───────────────────────────────────────────────────────

function updateTrackCounter(){
  try{
    if(!tracks||!tracks.length) return;
    const text=`Track ${index+1} of ${tracks.length}`;
    if(mTrackCounter) mTrackCounter.textContent=text;
    if(miniTrackCounter) miniTrackCounter.textContent=text;
  }catch(e){}
}
function preloadAllDurations(){
  if(!tracks||!tracks.length) return;
  // Check how many are still missing (not baked in)
  const missing=tracks.reduce((acc,_,i)=>trackDurations[i]?acc:acc+1,0);
  if(missing===0) return; // all baked in, nothing to do
  const CONCURRENCY=4;
  let nextIdx=0;
  const loadOne=(i)=>{
    if(i>=tracks.length) return;
    // Skip tracks that already have a baked-in duration
    if(trackDurations[i]){ durationLoadedCount++; if(nextIdx<tracks.length) loadOne(nextIdx++); return; }
    const a=new Audio();
    a.preload='metadata';
    a.src=encodeURI(tracks[i].file);
    const done=()=>{
      if(isFinite(a.duration)&&a.duration>0) trackDurations[i]=a.duration;
      try{
        const card=trackListEl.querySelector(`[data-track-index="${i}"]`);
        if(card&&trackDurations[i]){
          const durEl=card.querySelector('.track-dur');
          if(durEl){ durEl.textContent=fmt(trackDurations[i]); durEl.classList.add('loaded'); }
        }
      }catch(e){}
      durationLoadedCount++;
      updateOSTDuration();
      a.src='';
      if(nextIdx<tracks.length) loadOne(nextIdx++);
    };
    a.addEventListener('loadedmetadata',done,{once:true});
    a.addEventListener('error',done,{once:true});
  };
  setTimeout(()=>{for(let i=0;i<Math.min(CONCURRENCY,tracks.length);i++) loadOne(nextIdx++);},1000);
}
function renderList(){
  trackListEl.innerHTML = '';
  tracks.forEach((t,i)=>{
    // apply current view filter
    try{ if(!isTrackAllowedByViewFilter(t)) return; }catch(e){}

    // apply search filter (matches across title/artist/stage/side/file)
    try{
      const q = (searchQuery || '').trim().toLowerCase();
      if(q){
        const hay = [t.title, t.artist, t.stage, t.side, t.file]
          .filter(Boolean)
          .map(v=>String(v).toLowerCase())
          .join(' ');
        if(!hay.includes(q)) return;
      }
    }catch(e){}

    const el = document.createElement('button');
    el.className = 'track';
    el.innerHTML = `<img src="${encodeURI(t.image)}" alt="cover"><div class="meta"><div class="title"><span class="title-text">${t.title}</span><span class="track-dur">${trackDurations[i]?fmt(trackDurations[i]):''}</span></div><div class="sub">${t.artist||''}</div></div>`;
    if(trackDurations[i]){
      const durEl=el.querySelector('.track-dur');
      if(durEl) durEl.classList.add('loaded');
    }
    el.dataset.trackIndex = String(i);
    
    // Right-click for context menu
    el.addEventListener('contextmenu', (ev)=>{
      ev.preventDefault();
      ev.stopPropagation();
      try{
        console.log('Context menu requested for track', i);
        showContextMenu(ev.clientX, ev.clientY, i);
      }catch(e){
        console.error('Context menu error:', e);
      }
    });
    
    // clicking the track loads/plays but DOES NOT open the modal
    el.addEventListener('click',()=>{
      try{
        if(index === i && audio && audio.src){
          if(!isPlaying) play();
        } else {
          loadTrack(i,{fade:'in'});
          play();
        }
      }catch(e){}
    });
    // clicking the cover image opens the full modal player
    try{
      const img = el.querySelector('img');
      if(img){
        img.addEventListener('click',(ev)=>{ ev.stopPropagation(); try{ openModal(i); }catch(e){} });
      }
    }catch(e){}
    trackListEl.appendChild(el);
  })
  try{ updateTrackActiveState(); }catch(e){}
  try{ updateOSTDuration(); }catch(e){}
}

function updateTrackActiveState(){
  try{
    if(!trackListEl) return;
    const hasSong = !!(audio && audio.hasAttribute('src'));
    const els = trackListEl.querySelectorAll('.track');
    els.forEach(el=>{
      const ti = parseInt(el.dataset.trackIndex, 10);
      if(hasSong && ti === index){
        el.classList.add('active');
        if(isPlaying) el.classList.add('playing');
        else el.classList.remove('playing');
      } else {
        el.classList.remove('active','playing');
      }
    });
  }catch(e){}
}

function showContextMenu(x, y, trackIndex){
  try{
    console.log('showContextMenu called:', {x, y, trackIndex, menuElement: trackContextMenu});
    if(!trackContextMenu) {
      console.error('trackContextMenu element not found');
      return;
    }
    contextMenuTrackIndex = trackIndex;
    
    // Position menu
    trackContextMenu.style.left = `${x}px`;
    trackContextMenu.style.top = `${y}px`;
    trackContextMenu.classList.remove('hidden');
    console.log('Context menu shown');
    
    // Adjust position if menu goes off-screen
    setTimeout(()=>{
      const rect = trackContextMenu.getBoundingClientRect();
      if(rect.right > window.innerWidth){
        trackContextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
      }
      if(rect.bottom > window.innerHeight){
        trackContextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
      }
    }, 10);
  }catch(e){
    console.error('showContextMenu error:', e);
  }
}

function hideContextMenu(){
  try{
    if(trackContextMenu) trackContextMenu.classList.add('hidden');
    contextMenuTrackIndex = -1;
  }catch(e){}
}

function loadTrack(i, opts={fade:'cross'}){
  index = i;
  _historyRecordedForIndex = -1; // reset so next play() records this track fresh
  _loopHistoryLastTime = null;
  _loopHistoryLastIndex = i;
  try{ updateTrackActiveState(); }catch(e){}
  const t = tracks[i];
  // stop any WebAudio playback when loading a new track to avoid overlap
  try{ if(webPlaying) stopWebLoop(); }catch(e){}
  try{ audio.pause(); }catch(e){}
  audio.src = encodeURI(t.file);
  // always start from the very beginning when loading a track
  try{ audio.currentTime = 0; }catch(e){}
  webOffset = 0; webOffsetValid = false;
  // do not pre-decode here to avoid blocking load; decoding happens when play is requested
  trackTitle.textContent = t.title;
  trackTitle.classList.add('track-title-main');
  coverImg.src = encodeURI(t.image);
  if(trackArtist) trackArtist.textContent = t.artist || '';
  // update modal and mini UI with configurable fade
  if(mTitle) mTitle.textContent = t.title;
  if(mArtist) mArtist.textContent = t.artist||'';
  const setImgFade = (el, src, dur=220)=>{
    if(!el) return;
    if(isReducedAnimations){
      try{ el.style.transition = 'none'; el.style.opacity = 1; }catch(e){}
      try{ el.src = src; }catch(e){}
      return;
    }
    try{ el.style.transition = `opacity ${dur}ms ease`; el.style.opacity = 0 }catch(e){}
    const tmp = new Image(); tmp.onload = ()=>{ el.src = src; requestAnimationFrame(()=>{ try{ el.style.opacity = 1 }catch(e){} }); }; tmp.src = src;
  };
  if(opts.fade === 'in'){
    // modal likely just opened; fade background in (or set immediately for reduced animations)
    if(modalBg){
      if(isReducedAnimations){
        try{ modalBg.style.transition = 'none'; }catch(e){}
        modalBg.style.backgroundImage = `url('${encodeURI(t.image)}')`;
        try{ modalBg.style.opacity = 1; }catch(e){}
      }else{
        try{ modalBg.style.transition = 'opacity 320ms ease'; modalBg.style.opacity = 0 }catch(e){}
        modalBg.style.backgroundImage = `url('${encodeURI(t.image)}')`;
        requestAnimationFrame(()=>{ try{ modalBg.style.opacity = 1 }catch(e){} });
      }
    }
    setImgFade(mCover, encodeURI(t.image), 320);
    setImgFade(miniCover, encodeURI(t.image), 320);
  } else {
    // crossfade between existing background and new one using modalBg2 if present
    const bg2 = document.getElementById('modalBg2');
    if(bg2){
      // cancel any previous pending listener to avoid multiple commits
      try{ if(_bg2PendingListener && bg2){ bg2.removeEventListener('transitionend', _bg2PendingListener); _bg2PendingListener = null; } }catch(e){}
      // preload image first to avoid flashes when switching rapidly
      const img = new Image();
      img.onload = ()=>{
        try{ bg2.style.transition = isReducedAnimations ? 'none' : 'opacity 260ms ease'; }catch(e){}
        bg2.style.backgroundImage = `url('${encodeURI(t.image)}')`;
        // force frame then fade in
        if(isReducedAnimations){
          try{ bg2.style.opacity = 1; }catch(e){}
        }else{
          requestAnimationFrame(()=>{ try{ bg2.style.opacity = 1 }catch(e){} });
        }
        // when transition ends, commit to modalBg and hide bg2
        const onEnd = (ev)=>{ if(ev.target !== bg2) return; try{ bg2.removeEventListener('transitionend', onEnd); _bg2PendingListener = null; modalBg.style.backgroundImage = bg2.style.backgroundImage; bg2.style.opacity = 0 }catch(e){} };
        if(isReducedAnimations){
          try{ modalBg.style.backgroundImage = bg2.style.backgroundImage; bg2.style.opacity = 0; }catch(e){}
        }else{
          _bg2PendingListener = onEnd;
          bg2.addEventListener('transitionend', onEnd);
        }
      };
      img.src = t.image;
    } else {
      if(modalBg){
        if(isReducedAnimations){
          modalBg.style.backgroundImage = `url('${encodeURI(t.image)}')`;
          try{ modalBg.style.opacity = 1; }catch(e){}
        }else{
          try{ modalBg.style.opacity = 0 }catch(e){};
          setTimeout(()=>{ modalBg.style.backgroundImage = `url('${encodeURI(t.image)}')`; try{ modalBg.style.opacity = 1 }catch(e){} }, 220);
        }
      }
    }
    setImgFade(mCover, encodeURI(t.image));
    setImgFade(miniCover, encodeURI(t.image));
  }
  if(miniTitle) miniTitle.textContent = t.title;
  if(miniArtist) miniArtist.textContent = t.artist||'';
  try{ updateMediaSessionMetadata(t); }catch(e){}
  try{ updateMediaSessionPlaybackState(); }catch(e){}
  try{ updateMediaSessionPosition(true); }catch(e){}
  try{ setSongQueryParam(getSongParamForTrack(t)); }catch(e){}

  // update copy-link buttons (hero/mini/modal) for current track
  try{
    const url = getSongShareUrlForTrack(t);
    _setCopyButtonState(heroCopyLink, url);
    _setCopyButtonState(miniCopyLink, url);
    _setCopyButtonState(mCopyLink, url);
  }catch(e){}
  // clear no-song state when a real track is loaded
  try{
    if(miniPlayer) miniPlayer.classList.remove('no-song');
    if(miniPrev) miniPrev.disabled = false;
    if(miniPlay) miniPlay.disabled = false;
    if(miniNext) miniNext.disabled = false;
    if(miniShuffle) miniShuffle.disabled = false;
    if(miniLoop) miniLoop.disabled = false;
    if(mPrev) mPrev.disabled = false;
    if(mPlay) mPlay.disabled = false;
    if(mNext) mNext.disabled = false;
    if(mShuffle) mShuffle.disabled = false;
    if(mLoop) mLoop.disabled = false;
    if(mSeek) mSeek.disabled = false;
    if(miniSeek) miniSeek.disabled = false;
  }catch(e){}
  // mark page as having a loaded track so CSS shows download buttons
  try{ document.body.classList.add('has-track'); }catch(e){}
  
  // Update waveform visualization if active, pass the track image directly
  if(waveformActive){
    updateWaveformInfo(encodeURI(t.image));
  }
  // remove this index from any pending shuffle queue so it won't repeat
  try{ if(shuffleQueue && shuffleQueue.length){ shuffleQueue = shuffleQueue.filter(x=>x!==index); } }catch(e){}
  try{ localStorage.setItem('gb:lastIndex', String(index)); }catch(e){}
  
  // Aggressively preload next and previous tracks immediately
  try{ preloadNextTrack(); }catch(e){}
  try{ updateTrackCounter(); }catch(e){}
}


async function play(){
  // record history once per track, only when actually playing (not on load/restore)
  try{
    if(index !== _historyRecordedForIndex && tracks[index]){
      _historyRecordedForIndex = index;
      recordHistoryEntry(tracks[index]);
    }
  }catch(e){}
  // if loop (gapless) mode enabled try to use WebAudio for seamless loop
  if(loopMode === 'one'){
    const file = tracks[index] && tracks[index].file;
    if(file){
      // iOS/iPadOS can suspend AudioContext when backgrounded; resume on user gesture.
      try{
        if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(audioCtx && audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') await audioCtx.resume();
      }catch(e){}
      try{ updateMediaSessionMetadata(tracks[index]); }catch(e){}
      // if decoded already, start web loop immediately (using scheduler)
      try{
        const cached = bufferCache.get(file);
        if(cached){
          const offset = (webOffsetValid ? webOffset : (audio && audio.currentTime ? audio.currentTime : 0));
          const started = switchToWebLoop(file, offset);
          if(started){ 
            isPlaying = true; 
            mPlay.textContent='❚❚'; 
            heroArt.classList.add('playing'); 
            if(miniPlay) miniPlay.textContent='❚❚'; 
            if(miniPlayer) miniPlayer.classList.remove('hidden'); 
            startProgress(); 
            try{ updateMediaSessionPlaybackState(); updateMediaSessionPosition(true); }catch(e){} 
            return; 
          }
        }
        // not decoded yet — decode first
        if(webPlaying) stopWebLoop();
        setPreloading(true);
        const buf = await decodeFile(file);
        setPreloading(false);
        if(buf){
          const offset = (webOffsetValid ? webOffset : (audio && audio.currentTime ? audio.currentTime : 0));
          const started = switchToWebLoop(file, offset);
          if(started){ 
            isPlaying = true; 
            mPlay.textContent='❚❚'; 
            heroArt.classList.add('playing'); 
            if(miniPlay) miniPlay.textContent='❚❚'; 
            if(miniPlayer) miniPlayer.classList.remove('hidden'); 
            startProgress(); 
            try{ updateMediaSessionPlaybackState(); updateMediaSessionPosition(true); }catch(e){} 
            return; 
          }
        }
      }catch(e){ setPreloading(false); console.warn('decode/play failed, using fallback', e); }
      // fallback to audio element
      try{ await audio.play(); }catch(e){}
      isPlaying=true; 
      mPlay.textContent='❚❚'; 
      heroArt.classList.add('playing'); 
      if(miniPlay) miniPlay.textContent='❚❚'; 
      if(miniPlayer) miniPlayer.classList.remove('hidden'); 
      startProgress();
      try{ updateMediaSessionPlaybackState(); updateMediaSessionPosition(true); }catch(e){}
      return;
    }
  }
  // Non-loop mode: stop any web loop and use <audio>
  try{ if(webPlaying) stopWebLoop(); }catch(e){}
  try{ await audio.play(); }catch(e){ console.warn('audio.play failed', e); }
  isPlaying=true; 
  mPlay.textContent='❚❚'; 
  heroArt.classList.add('playing'); 
  if(miniPlay) miniPlay.textContent='❚❚'; 
  if(miniPlayer) miniPlayer.classList.remove('hidden'); 
  startProgress();
  try{ updateMediaSessionPlaybackState(); updateMediaSessionPosition(true); }catch(e){}
}

function pause(){
  // If WebAudio loop is active, capture its current position and stop it so we can resume later
  try{
    if(webPlaying){
      try{ const pos = getWebCurrentTime(); webOffset = pos; webOffsetValid = true; }catch(e){}
      try{ stopWebLoop(); }catch(e){}
      try{ if(audio) audio.currentTime = webOffset; }catch(e){}
    }
  }catch(e){}
  try{ audio.pause(); }catch(e){}
  isPlaying=false;
  mPlay.textContent='▶';
  heroArt.classList.remove('playing');
  if(miniPlay) miniPlay.textContent='▶';
  stopProgress();
  try{ updateMediaSessionPlaybackState(); updateMediaSessionPosition(true); }catch(e){}
}

function setSeekPercent(p){
  try{
    const pct = Math.max(0, Math.min(100, (typeof p === 'number' ? p : parseFloat(p)) || 0));
    const v = pct.toFixed(3) + '%';
    if(mSeek) mSeek.style.setProperty('--seek-pct', v);
    if(miniSeek) miniSeek.style.setProperty('--seek-pct', v);
  }catch(e){}
}

function startProgress(){
  if(progressRaf) return;
  try{ updateTrackActiveState(); }catch(e){}
  try{ startBeatPulse(); }catch(e){}
  const step = ()=>{
    // prefer WebAudio timing when an active web loop is running
    const dur = (webPlaying && webSource && webSource.buffer) ? webSource.buffer.duration : audio.duration;
    if(dur && isFinite(dur)){
      const cur = getSmoothCurrentTime();
      try{
        if(loopMode === 'one' && isPlaying && !_audioSeeking && tracks[index]){
          if(_loopHistoryLastIndex !== index || _loopHistoryLastTime === null){
            _loopHistoryLastIndex = index;
            _loopHistoryLastTime = cur;
          }else{
            const prev = _loopHistoryLastTime;
            const wrapped = prev > (dur * 0.85) && cur < (dur * 0.2) && (prev - cur) > Math.max(0.5, dur * 0.35);
            if(wrapped) recordHistoryEntry(tracks[index]);
            _loopHistoryLastTime = cur;
          }
        }else{
          _loopHistoryLastTime = cur;
          _loopHistoryLastIndex = index;
        }
      }catch(e){}
      const p = (cur/dur)*100;
      if(mSeek) mSeek.value = p; if(miniSeek) miniSeek.value = p;
      setSeekPercent(p);
      if(mCur) mCur.textContent = fmt(cur);
      if(miniCur) miniCur.textContent = fmt(cur);
      if(mRem) mRem.textContent = (isFinite(dur)? fmt(dur) : '');
      if(miniRem) miniRem.textContent = (isFinite(dur)? fmt(dur) : '');
      try{ updateMediaSessionPosition(false); }catch(e){}
    }
    progressRaf = requestAnimationFrame(step);
  };
  progressRaf = requestAnimationFrame(step);
}

function stopProgress(){
  if(progressRaf){ cancelAnimationFrame(progressRaf); progressRaf = null; }
  _loopHistoryLastTime = null;
  _loopHistoryLastIndex = -1;
  try{ updateTrackActiveState(); }catch(e){}
  try{ stopBeatPulse(); }catch(e){}
}

// modal controls only (main player removed)
mPlay.addEventListener('click',()=>{isPlaying?pause():play();});
mPrev.addEventListener('click',()=>{skip(-1)});
mNext.addEventListener('click',()=>{skip(1)});

// Shared state helpers for shuffle/loop to sync modal + mini
function setShuffleState(active){
  isShuffling = !!active;
  // if enabling shuffle, ensure loop is disabled; also require autoplay
  if(isShuffling){ setLoopState(false); if(!isAutoplay) setAutoplayState(true); }
  if(mShuffle) mShuffle.classList.toggle('active', isShuffling);
  if(miniShuffle) miniShuffle.classList.toggle('active', isShuffling);
  try{ if(mShuffle) mShuffle.setAttribute('aria-pressed', isShuffling? 'true':'false'); if(miniShuffle) miniShuffle.setAttribute('aria-pressed', isShuffling? 'true':'false'); }catch(e){}
  try{ localStorage.setItem('gb:shuffle', isShuffling?'1':'0') }catch(e){}
  // initialize or clear shuffle queue so automatic advances won't repeat until exhausted
  try{
    if(isShuffling) {
      shuffleQueue = buildShuffleQueue(index);
      shuffleCycleFinished = false;
      shuffleHistory = [];
      shuffleForward = [];
    } else {
      shuffleQueue = [];
      shuffleCycleFinished = false;
      shuffleHistory = [];
      shuffleForward = [];
    }
  }catch(e){}
}
function toggleShuffle(){ setShuffleState(!isShuffling); }

function setAutoplayState(active){
  isAutoplay = !!active;
  // disabling autoplay forces off states that require autoplay
  if(!isAutoplay){
    if(isShuffling) setShuffleState(false);
    if(loopMode === 'all') setLoopState('off');
  }
  const mAutoplay    = document.getElementById('mAutoplay');
  const miniAutoplay = document.getElementById('miniAutoplay');
  [mAutoplay, miniAutoplay].forEach(btn => {
    if(!btn) return;
    btn.classList.toggle('active', isAutoplay);
    btn.setAttribute('aria-pressed', isAutoplay ? 'true' : 'false');
    btn.title = isAutoplay ? 'Autoplay (on)' : 'Autoplay (off)';
  });
  try{ localStorage.setItem('gb:autoplay', isAutoplay ? '1' : '0'); }catch(e){}
}
function toggleAutoplay(){ setAutoplayState(!isAutoplay); }

function isAutoplayEnabled(){
  try{
    const mAutoplayBtn = document.getElementById('mAutoplay');
    const miniAutoplayBtn = document.getElementById('miniAutoplay');
    const pressedStates = [mAutoplayBtn, miniAutoplayBtn]
      .filter(Boolean)
      .map(btn => btn.getAttribute('aria-pressed'));
    if(pressedStates.includes('false')) return false;
    if(pressedStates.includes('true')) return true;
  }catch(e){}
  return !!isAutoplay;
}

function _updateLoopUI(){
  const isActive = loopMode !== 'off';
  const isOne    = loopMode === 'one';
  const titles   = { 'off': 'Loop (off)', 'one': 'Loop track (on)', 'all': 'Loop all tracks (on)' };
  [mLoop, miniLoop].forEach(btn => {
    if(!btn) return;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    btn.setAttribute('data-loop', loopMode);
    btn.title = titles[loopMode] || 'Loop';
    const badge = btn.querySelector('.loop-one-badge');
    if(badge) badge.style.display = isOne ? 'flex' : 'none';
  });
}

function setLoopState(mode){
  // Accept legacy boolean calls from restore
  if(mode === true)  mode = 'one';
  if(mode === false) mode = 'off';
  if(mode !== 'off' && mode !== 'one' && mode !== 'all') mode = 'off';

  const wasOne = loopMode === 'one';
  loopMode = mode;

  // if enabling any loop, ensure shuffle is disabled
  if(mode !== 'off'){ setShuffleState(false); }
  // loop-all requires autoplay
  if(mode === 'all' && !isAutoplay){ setAutoplayState(true); }

  // audio.loop only true for loop-one (WebAudio gapless handles it; fallback too)
  try{ audio.loop = (mode === 'one'); }catch(e){}

  _updateLoopUI();
  try{ localStorage.setItem('gb:loop', mode); }catch(e){}

  // leaving loop-one: stop WebAudio and hand back to <audio>
  if(wasOne && mode !== 'one'){
    try{
      if(webPlaying){
        const pos = getWebCurrentTime();
        stopWebLoop();
        try{ audio.currentTime = pos; }catch(e){}
        if(isPlaying){ try{ audio.play(); }catch(e){} }
      }
    }catch(e){}
  }

  // entering loop-one during playback: switch to WebAudio for gapless
  if(mode === 'one'){
    try{
      const t = tracks[index];
      if(!t) return;
      const file = t.file;
      if(webPlaying && webFile === file) return;
      if(isPlaying){
        const cached = bufferCache.get(file);
        if(cached){
          try{
            const ok = switchToWebLoop(file, audio.currentTime || 0);
            if(ok){
              try{ mPlay.textContent='❚❚'; if(miniPlay) miniPlay.textContent='❚❚'; heroArt.classList.add('playing'); startProgress(); }catch(e){}
            }
          }catch(e){}
        } else {
          decodeFile(file).then(buf=>{
            try{
              const stillCurrent = tracks[index] && tracks[index].file === file;
              if(buf && loopMode === 'one' && stillCurrent && isPlaying){
                try{ const ok = switchToWebLoop(file, audio.currentTime || 0); if(ok){ try{ startProgress(); }catch(e){} } }catch(e){}
              }
            }catch(e){}
          }).catch(()=>{});
        }
      }
    }catch(e){ console.warn('setLoopState: background web loop init failed', e); }
  }
}
function toggleLoop(){
  if(loopMode === 'off')       setLoopState('one');
  else if(loopMode === 'one')  setLoopState('all');
  else                         setLoopState('off');
}

function skip(dir){
  if(!tracks || !tracks.length) return;

  // When shuffle is enabled, Next/Prev should follow the shuffle order.
  if(isShuffling){
    try{
      // next
      if(dir > 0){
        let nextIndex = null;
        // if user previously hit Prev, allow Next to go forward through that history
        if(shuffleForward && shuffleForward.length > 0){
          while(shuffleForward.length > 0){
            const cand = shuffleForward.pop();
            if(isTrackAllowedByViewFilter(tracks[cand])){ nextIndex = cand; break; }
          }
        }
        if(nextIndex === null || nextIndex === undefined){
          if(!shuffleQueue || shuffleQueue.length === 0){
            shuffleQueue = buildShuffleQueue(index);
          }
          // consume from queue until we find an allowed track (in case filter changed)
          while(shuffleQueue && shuffleQueue.length){
            const cand = shuffleQueue.shift();
            if(isTrackAllowedByViewFilter(tracks[cand])){ nextIndex = cand; break; }
          }
        }
        if(nextIndex === null || nextIndex === undefined) return;
        if(shuffleHistory) shuffleHistory.push(index);
        if(shuffleForward) shuffleForward = [];
        index = nextIndex;
      }
      // prev
      else if(dir < 0){
        if(shuffleHistory && shuffleHistory.length > 0){
          let prevIndex = null;
          while(shuffleHistory.length > 0){
            const cand = shuffleHistory.pop();
            if(isTrackAllowedByViewFilter(tracks[cand])){ prevIndex = cand; break; }
          }
          if(prevIndex === null || prevIndex === undefined) return;
          if(shuffleForward) shuffleForward.push(index);
          index = prevIndex;
        } else {
          // no history yet; fall back to a random pick (excluding current)
          const q = buildShuffleQueue(index);
          const prevIndex = (q && q.length) ? q[0] : index;
          index = prevIndex;
          shuffleQueue = buildShuffleQueue(index);
          shuffleForward = [];
        }
      }
    }catch(e){
      // if shuffle logic fails for any reason, fall back to sequential
      index = (index + dir + tracks.length) % tracks.length;
    }
  } else {
    index = findNextAllowedIndex(index, dir);
  }

  // reset saved web offset when changing tracks
  webOffsetValid = false;
  const targetFile = tracks[index] && tracks[index].file;
  const isPreloaded = targetFile && bufferCache.has(targetFile);
  
  // Stop current WebAudio playback
  try{ if(webPlaying) stopWebLoop(); }catch(e){}
  
  // If next track is preloaded and we're in a playing state, do instant switch
  if(isPreloaded && isPlaying){
    try{
      // Update all UI first via loadTrack
      if(!modal.classList.contains('hidden')){
        loadTrack(index, {fade:'cross'});
      } else {
        loadTrack(index, {fade:'in'});
      }
      
      // Now immediately start playback
      const loopActive = loopMode === 'one';
      if(loopActive){
        // Use WebAudio for seamless loop
        switchToWebLoop(targetFile, 0);
        isPlaying = true;
        mPlay.textContent='❚❚';
        if(miniPlay) miniPlay.textContent='❚❚';
        heroArt.classList.add('playing');
        startProgress();
      } else {
        // Non-loop: use audio element which loadTrack already set up
        audio.play().then(()=>{
          isPlaying = true;
          mPlay.textContent='❚❚';
          if(miniPlay) miniPlay.textContent='❚❚';
          heroArt.classList.add('playing');
          if(miniPlayer) miniPlayer.classList.remove('hidden');
          startProgress();
          try{ updateMediaSessionPlaybackState(); updateMediaSessionPosition(true); }catch(e){}
        }).catch((e)=>{
          console.warn('instant play failed', e);
          // If autoplay fails, still update UI but paused
          isPlaying = false;
          mPlay.textContent='▶';
          if(miniPlay) miniPlay.textContent='▶';
        });
      }
      
      try{ updateMediaSessionPlaybackState(); updateMediaSessionPosition(true); }catch(e){}
      return;
    }catch(e){ console.warn('instant switch failed, falling back', e); }
  }
  
  // Standard load path when not preloaded
  if(!modal.classList.contains('hidden')){
    loadTrack(index, {fade:'cross'});
  } else {
    loadTrack(index, {fade:'in'});
  }
  play();
}

function clearPlaybackToNoSong(){
  if(_clearingNoSong) return;
  _clearingNoSong = true;
  try{ stopProgress(); }catch(e){}
  try{ if(webPlaying) stopWebLoop(); }catch(e){}
  try{ audio.pause(); }catch(e){}
  try{ audio.removeAttribute('src'); audio.load(); }catch(e){}
  isPlaying = false;
  try{ mPlay.textContent = '▶'; if(miniPlay) miniPlay.textContent='▶'; }catch(e){}
  // set UI to no-song
  try{
    if(miniPlayer){ miniPlayer.classList.add('no-song'); }
    if(miniPrev) miniPrev.disabled = true;
    if(miniPlay) miniPlay.disabled = true;
    if(miniNext) miniNext.disabled = true;
    if(miniShuffle) miniShuffle.disabled = true;
    if(miniLoop) miniLoop.disabled = true;
    if(mPrev) mPrev.disabled = true;
    if(mPlay) mPlay.disabled = true;
    if(mNext) mNext.disabled = true;
    if(mShuffle) mShuffle.disabled = true;
    if(mLoop) mLoop.disabled = true;
    if(mSeek) mSeek.disabled = true;
    if(miniSeek) miniSeek.disabled = true;

    // copy-link buttons should be disabled when nothing is loaded
    try{
      _setCopyButtonState(heroCopyLink, null);
      _setCopyButtonState(miniCopyLink, null);
      _setCopyButtonState(mCopyLink, null);
      if(heroCopyLink) heroCopyLink.classList.remove('copied');
      if(miniCopyLink) miniCopyLink.classList.remove('copied');
      if(mCopyLink) mCopyLink.classList.remove('copied');
    }catch(e){}
  }catch(e){}
  try{ document.body.classList.remove('has-track'); }catch(e){}
  try{ 
    const def = getDefaultCover();
    if(miniTitle) miniTitle.textContent = 'No song playing';
    if(mTitle) mTitle.textContent = 'No song playing';
    if(trackTitle) trackTitle.textContent = 'No song playing';
    if(miniArtist) miniArtist.textContent = '';
    if(mArtist) mArtist.textContent = '';
    if(trackArtist) trackArtist.textContent = '';
    if(miniCover) miniCover.src = def;
    if(mCover) mCover.src = def;
    if(coverImg) coverImg.src = def;

    // reset fullscreen timing labels so they don't keep stale song duration
    if(mCur) mCur.textContent = '0:00';
    if(mRem) mRem.textContent = '-0:00';
    if(miniCur) miniCur.textContent = '0:00';
    if(miniRem) miniRem.textContent = '0:00';

    // clear fullscreen modal background layers from the previous track
    if(modalBg){
      try{ modalBg.style.backgroundImage = `url('${def}')`; }catch(e){}
      try{ modalBg.style.opacity = 1; }catch(e){}
    }
    try{
      const bg2 = document.getElementById('modalBg2');
      if(bg2){
        try{ if(_bg2PendingListener){ bg2.removeEventListener('transitionend', _bg2PendingListener); _bg2PendingListener = null; } }catch(e){}
        try{ bg2.style.opacity = 0; }catch(e){}
        try{ bg2.style.backgroundImage = 'none'; }catch(e){}
      }
    }catch(e){}
  }catch(e){}
  try{ setSeekPercent(0); }catch(e){}
  try{ if(heroArt) heroArt.classList.remove('playing'); }catch(e){}
  try{ if(mTrackCounter) mTrackCounter.textContent=''; if(miniTrackCounter) miniTrackCounter.textContent=''; }catch(e){}
  try{ updateTrackActiveState(); }catch(e){}
  try{ setSongQueryParam(null); }catch(e){}
  _clearingNoSong = false;
}

audio.addEventListener('timeupdate',()=>{
  // prefer WebAudio timing when web loop active
  const dur = (webPlaying && webSource && webSource.buffer) ? webSource.buffer.duration : audio.duration;
  // update interpolation base for smoother rAF updates
  try{ if(!webPlaying){ _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = _nowMs(); } }catch(e){}
  const cur = (webPlaying && webSource && webSource.buffer) ? getWebCurrentTime() : getSmoothCurrentTime();
  if(dur){
    const p = (cur/dur)*100;
    // modal times
    if(mSeek) mSeek.value = p;
    if(miniSeek) miniSeek.value = p;
    setSeekPercent(p);
    if(mCur) mCur.textContent = fmt(cur);
    // main player shows total duration; mini shows total as well
    if(mRem) mRem.textContent = (isFinite(dur) ? fmt(dur) : '');
    if(miniCur) miniCur.textContent = fmt(cur);
    if(miniRem) miniRem.textContent = (isFinite(dur) ? fmt(dur) : '');
  }
});

// keep interpolation state accurate around seeking/pausing
try{
  audio.addEventListener('seeking', ()=>{ _audioSeeking = true; try{ _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = _nowMs(); }catch(e){} });
  audio.addEventListener('seeked', ()=>{ _audioSeeking = false; try{ _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = _nowMs(); }catch(e){} });
  audio.addEventListener('pause', ()=>{
    try{ _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = 0; }catch(e){}
    try{
      // Fallback for browsers where ended sequencing is inconsistent:
      // if media is ended and autoplay is off, force no-song reset.
      const dur = Number(audio && audio.duration);
      const cur = Number(audio && audio.currentTime);
      const nearEnd = Number.isFinite(dur) && dur > 0 && Number.isFinite(cur) && cur >= Math.max(0, dur - 0.05);
      const modalOpen = !!(modal && !modal.classList.contains('hidden'));
      if(audio && (audio.ended || nearEnd) && !isAutoplayEnabled() && loopMode !== 'one' && !modalOpen){
        clearPlaybackToNoSong();
      }
    }catch(e){}
  });
  audio.addEventListener('playing', ()=>{ try{ _audioSeeking = false; _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = _nowMs(); }catch(e){} });
}catch(e){}

// When metadata is loaded, initialize seek and time displays so they stay in sync
audio.addEventListener('loadedmetadata', ()=>{
  // use WebAudio buffer duration when available
  const dur = (webPlaying && webSource && webSource.buffer) ? webSource.buffer.duration : audio.duration;
  try{ if(!webPlaying){ _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = _nowMs(); } }catch(e){}
  const cur = (webPlaying && webSource && webSource.buffer) ? getWebCurrentTime() : getSmoothCurrentTime();
  if(dur && isFinite(dur)){
    const p = (cur/dur)*100 || 0;
    if(mSeek) mSeek.value = p; if(miniSeek) miniSeek.value = p;
    setSeekPercent(p);
    if(mCur) mCur.textContent = fmt(cur);
    mRem.textContent = fmt(dur);
    if(miniCur) miniCur.textContent = fmt(cur);
    if(miniRem) miniRem.textContent = fmt(dur);
  } else {
    if(mSeek) mSeek.value = 0; if(miniSeek) miniSeek.value = 0;
    setSeekPercent(0);
    if(mCur) mCur.textContent = fmt(0);
    if(mRem) mRem.textContent = '';
    if(miniCur) miniCur.textContent = fmt(0);
    if(miniRem) miniRem.textContent = '';
  }
});

mSeek.addEventListener('input',()=>{
  const percent = mSeek.value;
  setSeekPercent(percent);
  try{
      if(webPlaying && webSource && webSource.buffer){
        const newOffset = (percent/100) * webSource.buffer.duration;
        switchToWebLoop(tracks[index].file, newOffset);
      return;
    }
  }catch(e){}
  // If loop mode is enabled and we're currently paused (web loop not running),
  // update the saved WebAudio resume offset so Play resumes from the scrubbed position.
  try{
    const loopActive = loopMode === 'one';
    const file = tracks[index] && tracks[index].file;
    if(loopActive && file){
      const buf = bufferCache.get(file);
      const dur = buf && buf.duration;
      if(dur && isFinite(dur)){
        const newOffset = (percent/100) * dur;
        webOffset = newOffset;
        webOffsetValid = true;
        try{ if(audio) audio.currentTime = newOffset; }catch(e){}
        try{ _audioTimeBase = newOffset; _audioTimeStamp = _nowMs(); }catch(e){}
        return;
      }
    }
  }catch(e){}
  // using the audio element for seeking — clear any saved web offset so resume uses audio.currentTime
  webOffsetValid = false;
  if(audio.duration){ audio.currentTime = (percent/100)*audio.duration }
  try{ if(!webPlaying){ _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = _nowMs(); } }catch(e){}
});
if(miniSeek){
  miniSeek.addEventListener('input',()=>{
    const percent = miniSeek.value;
    setSeekPercent(percent);
      try{
        if(webPlaying && webSource && webSource.buffer){
          const newOffset = (percent/100) * webSource.buffer.duration;
          switchToWebLoop(tracks[index].file, newOffset);
        return;
      }
    }catch(e){}
    // If loop mode is enabled and we're paused (web loop not running), keep the resume offset in sync.
    try{
      const loopActive = loopMode === 'one';
      const file = tracks[index] && tracks[index].file;
      if(loopActive && file){
        const buf = bufferCache.get(file);
        const dur = buf && buf.duration;
        if(dur && isFinite(dur)){
          const newOffset = (percent/100) * dur;
          webOffset = newOffset;
          webOffsetValid = true;
          try{ if(audio) audio.currentTime = newOffset; }catch(e){}
          try{ _audioTimeBase = newOffset; _audioTimeStamp = _nowMs(); }catch(e){}
          return;
        }
      }
    }catch(e){}
    // clear cached web offset when seeking via audio element
    webOffsetValid = false;
    if(audio.duration){ audio.currentTime = (percent/100)*audio.duration }
    try{ if(!webPlaying){ _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = _nowMs(); } }catch(e){}
  });
}

const mVolume = document.getElementById('mVolume');
if(mVolume){
  audio.volume = parseFloat(mVolume.value);
  mVolume.addEventListener('input',()=>{ audio.volume = mVolume.value; try{ if(webGain) webGain.gain.value = mVolume.value; }catch(e){} });
}
if(mVolume){ mVolume.addEventListener('input',()=>{ try{ localStorage.setItem('gb:volume', String(mVolume.value)) }catch(e){} }); }

audio.addEventListener('ended',()=>{
  if(loopMode === 'one'){audio.currentTime=0;play();return}
  try{ stopProgress(); }catch(e){}
  // If autoplay is disabled, stop after the current track
  if(!isAutoplayEnabled()){
    const modalOpen = !!(modal && !modal.classList.contains('hidden'));
    if(modalOpen){
      // In fullscreen, keep current track UI visible; just stop playback state.
      isPlaying = false;
      try{ if(mPlay) mPlay.textContent = '▶'; if(miniPlay) miniPlay.textContent = '▶'; }catch(e){}
      try{ if(heroArt) heroArt.classList.remove('playing'); }catch(e){}
      try{ updateTrackActiveState(); }catch(e){}
      try{ updateMediaSessionPlaybackState(); }catch(e){}
      return;
    }
    try{ clearPlaybackToNoSong(); }catch(e){}
    return;
  }
  // If shuffle is enabled, consume the shuffleQueue for automatic transitions
  if(isShuffling){
    try{
      // if no queued candidates, we've finished the cycle — exit to main screen
      if(!shuffleQueue || shuffleQueue.length === 0){
        // end shuffle mode and return to main screen
        setShuffleState(false);
        shuffleCycleFinished = false;
        closeModal();
        return;
      }
      const nextIndex = shuffleQueue.shift();
      // if shifting this leaves the queue empty, mark that when this track ends we should exit
      if(shuffleQueue.length === 0){ shuffleCycleFinished = true; }
      try{ if(shuffleHistory) shuffleHistory.push(index); if(shuffleForward) shuffleForward = []; }catch(e){}
      index = nextIndex;
      if(!modal.classList.contains('hidden')){
        loadTrack(index, {fade:'cross'});
      } else {
        loadTrack(index, {fade:'in'});
      }
      play();
      return;
    }catch(e){ console.warn('shuffle transition failed, falling back', e); }
    // fallback to sequential if shuffle fails or no viable candidates
    skip(1);
    return;
  }
  try{
    const atLast = (typeof tracks !== 'undefined' && tracks && (index === tracks.length - 1));
    if(atLast && !isShuffling){
      if(loopMode === 'all'){
        // wrap back to first track
        index = 0;
        if(!modal.classList.contains('hidden')){
          loadTrack(index, {fade:'cross'});
        } else {
          loadTrack(index, {fade:'in'});
        }
        play();
        return;
      }
      clearPlaybackToNoSong();
      try{ closeModal(); }catch(e){}
      return;
    }
  }catch(e){}
  skip(1);
});

// wire modal shuffle/loop only (top controls removed)
if(mShuffle) mShuffle.addEventListener('click',()=>{ toggleShuffle(); });
if(miniShuffle) miniShuffle.addEventListener('click',()=>{ toggleShuffle(); });

if(mLoop) mLoop.addEventListener('click',()=>{ toggleLoop(); });
if(miniLoop) miniLoop.addEventListener('click',()=>{ toggleLoop(); });

const mAutoplay    = document.getElementById('mAutoplay');
const miniAutoplay = document.getElementById('miniAutoplay');
if(mAutoplay)    mAutoplay.addEventListener('click',   ()=>{ toggleAutoplay(); });
if(miniAutoplay) miniAutoplay.addEventListener('click',()=>{ toggleAutoplay(); });

// mini player wiring: only the buttons toggle playback; clicking cover/title opens modal
if(miniPlay){miniPlay.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniPlayer && miniPlayer.classList.contains('no-song')){ return; } }catch(e){} isPlaying?pause():play();});}
if(miniPrev){miniPrev.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniPrev.disabled) return; }catch(e){} skip(-1)});}
if(miniNext){miniNext.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniNext.disabled) return; }catch(e){} skip(1)});}
if(miniCover){miniCover.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniPlayer && miniPlayer.classList.contains('no-song')) return; }catch(e){} openModal(index);});}
if(miniTitle){miniTitle.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniPlayer && miniPlayer.classList.contains('no-song')) return; }catch(e){} openModal(index);});}
if(miniArtist){miniArtist.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniPlayer && miniPlayer.classList.contains('no-song')) return; }catch(e){} openModal(index);});}

// Download buttons wiring
if(mDownload){ mDownload.addEventListener('click',(ev)=>{ ev.stopPropagation(); try{ if(!tracks || !tracks[index] || !tracks[index].file) return; downloadTrackAt(index); }catch(e){} }); }
if(miniDownload){ miniDownload.addEventListener('click',(ev)=>{ ev.stopPropagation(); try{ if(!tracks || !tracks[index] || !tracks[index].file) return; downloadTrackAt(index); }catch(e){} }); }

// prevent hero cover being interactive when no track loaded
if(coverImg){
  coverImg.addEventListener('click',(ev)=>{
    ev.stopPropagation();
    try{ if(!audio || !audio.src) return; }catch(e){ return; }
    openModal(index);
  });
}

function fmt(s){
  if(!s||isNaN(s))return '0:00';
  const m = Math.floor(s/60);const sec = Math.floor(s%60).toString().padStart(2,'0');return `${m}:${sec}`
}

function downloadTrackAt(i){
  try{
    const t = tracks[i];
    if(!t || !t.file) return;
    const url = t.file;
    const parts = url.split('/');
    let filename = parts.length? parts[parts.length-1].split('?')[0] : '';
    if(!filename) filename = (t.title||'track') + '.mp3';
    const a = document.createElement('a');
    a.href = encodeURI(url);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }catch(e){ console.warn('download failed', e); }
}

async function downloadAllTracks(){
  if(!tracks || !tracks.length) return;
  if(typeof JSZip === 'undefined'){
    alert('ZIP library not loaded. Please ensure you are online.');
    return;
  }
  try{
    downloadAllBtn.disabled = true;
    const zip = new JSZip();
    for(let i=0;i<tracks.length;i++){
      const t = tracks[i];
      const url = encodeURI(t.file);
      try{
        if(downloadAllLabel) downloadAllLabel.textContent = `Zipping ${i+1}/${tracks.length}`;
        else if(downloadAllBtn) downloadAllBtn.textContent = `Zipping ${i+1}/${tracks.length}`;
        const res = await fetch(url);
        if(!res.ok) { console.warn('fetch failed', url, res.status); continue; }
        const blob = await res.blob();
        const parts = (t.file||url).split('/');
        let filename = parts.length? parts[parts.length-1].split('?')[0] : (`track-${i+1}.mp3`);
        if(!filename) filename = `track-${i+1}.mp3`;
        zip.file(filename, blob);
      }catch(e){ console.warn('downloadAll: failed to fetch', t.file, e); }
      // small delay to keep UI responsive
      await new Promise(r=>setTimeout(r,50));
    }
    if(downloadAllLabel) downloadAllLabel.textContent = 'Compressing...';
    else if(downloadAllBtn) downloadAllBtn.textContent = 'Compressing...';
    const outBlob = await zip.generateAsync({type:'blob'}, (meta)=>{
      const txt = `Compressing ${Math.round(meta.percent)}%`;
      if(downloadAllLabel) downloadAllLabel.textContent = txt;
      else if(downloadAllBtn) downloadAllBtn.textContent = txt;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(outBlob);
    a.download = 'Gang Beasts OST.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }catch(e){ console.warn('downloadAllTracks failed', e); alert('Download failed'); }
  finally{
    if(downloadAllBtn){
      downloadAllBtn.disabled = false;
      if(downloadAllLabel) downloadAllLabel.textContent = 'Download All';
      else downloadAllBtn.textContent = 'Download All';
    }
  }
}

// keyboard
document.addEventListener('keydown',(e)=>{
  const tag = document.activeElement && document.activeElement.tagName;
  if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  // ignore keyboard controls when no track is loaded
  try{ if(!audio || !audio.src) return; }catch(e){}
  if(e.code === 'Space' || e.key === ' '){
    e.preventDefault();
    isPlaying?pause():play();
    return;
  }
  if(e.code === 'ArrowRight'){
    e.preventDefault();
    try{
      const file = tracks[index] && tracks[index].file;
      const loopActive = loopMode === 'one';
      const buf = (loopActive && file) ? bufferCache.get(file) : null;
      const webDur = (webSource && webSource.buffer) ? webSource.buffer.duration : null;
      const dur = (webDur && isFinite(webDur)) ? webDur : (buf && buf.duration ? buf.duration : audio.duration);
      if(!dur || !isFinite(dur)) return;

      let cur = 0;
      if(webPlaying && webSource && webSource.buffer){
        cur = getWebCurrentTime();
      } else if(loopActive && webOffsetValid){
        cur = webOffset;
      } else {
        cur = audio.currentTime || 0;
      }

      const next = Math.min(dur, (cur + 10));

      if(loopActive && buf){
        // If we're actively playing, seek by restarting the WebAudio loop.
        if(isPlaying){
          switchToWebLoop(file, (next % dur));
        } else {
          // paused: keep resume offset in sync
          webOffset = next;
          webOffsetValid = true;
          try{ audio.currentTime = next; }catch(e){}
        }
      } else {
        webOffsetValid = false;
        try{ audio.currentTime = next; }catch(e){}
      }

      // keep UI in sync immediately when paused
      try{
        const p = (next / dur) * 100;
        if(mSeek) mSeek.value = p;
        if(miniSeek) miniSeek.value = p;
        setSeekPercent(p);
        if(mCur) mCur.textContent = fmt(next);
        if(miniCur) miniCur.textContent = fmt(next);
      }catch(e){}
      try{ _audioTimeBase = next; _audioTimeStamp = _nowMs(); }catch(e){}
    }catch(e){ try{ if(audio.duration) audio.currentTime = Math.min(audio.duration, (audio.currentTime||0) + 10); }catch(e){} }
    return;
  }
  if(e.code === 'ArrowLeft'){
    e.preventDefault();
    try{
      const file = tracks[index] && tracks[index].file;
      const loopActive = loopMode === 'one';
      const buf = (loopActive && file) ? bufferCache.get(file) : null;
      const webDur = (webSource && webSource.buffer) ? webSource.buffer.duration : null;
      const dur = (webDur && isFinite(webDur)) ? webDur : (buf && buf.duration ? buf.duration : audio.duration);
      if(!dur || !isFinite(dur)) return;

      let cur = 0;
      if(webPlaying && webSource && webSource.buffer){
        cur = getWebCurrentTime();
      } else if(loopActive && webOffsetValid){
        cur = webOffset;
      } else {
        cur = audio.currentTime || 0;
      }

      const prev = Math.max(0, (cur - 10));

      if(loopActive && buf){
        if(isPlaying){
          switchToWebLoop(file, (prev % dur));
        } else {
          webOffset = prev;
          webOffsetValid = true;
          try{ audio.currentTime = prev; }catch(e){}
        }
      } else {
        webOffsetValid = false;
        try{ audio.currentTime = prev; }catch(e){}
      }

      try{
        const p = (prev / dur) * 100;
        if(mSeek) mSeek.value = p;
        if(miniSeek) miniSeek.value = p;
        setSeekPercent(p);
        if(mCur) mCur.textContent = fmt(prev);
        if(miniCur) miniCur.textContent = fmt(prev);
      }catch(e){}
      try{ _audioTimeBase = prev; _audioTimeStamp = _nowMs(); }catch(e){}
    }catch(e){ try{ if(audio.duration) audio.currentTime = Math.max(0, (audio.currentTime||0) - 10); }catch(e){} }
    return;
  }
  if(e.code === 'KeyV' || e.key === 'v' || e.key === 'V'){
    e.preventDefault();
    // Only allow waveform toggle when modal is open
    if(mWaveform && !mWaveform.disabled && !modal.classList.contains('hidden')){
      toggleWaveform();
    }
    return;
  }
  if(e.code === 'KeyS' || e.key === 's' || e.key === 'S'){
    e.preventDefault();
    if(mShuffle && !mShuffle.disabled){
      toggleShuffle();
    }
    return;
  }
});

// Modal open/close
function openModal(i){
  // Back-compat: openModal(i) defaults to autoplay.
  const opts = (arguments.length > 1 && typeof arguments[1] === 'object' && arguments[1]) ? arguments[1] : {};
  const autoplay = (opts.autoplay !== false);
  if(!tracks || !tracks.length) return;
  if(typeof i !== 'number' || i < 0 || i >= tracks.length) return;
  const t = tracks[i];
  const wasHidden = modal.classList.contains('hidden');
  if(wasHidden){
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    try{ localStorage.setItem('gb:modalOpen','1'); localStorage.setItem('gb:modalIndex', String(i)); }catch(e){}
    // if different track or no source, load with fade-in; otherwise just fade the modalBg in
    if(index !== i || !audio.src){
      loadTrack(i, {fade:'in'});
      if(autoplay){
        play();
        mPlay.textContent = '❚❚';
      } else {
        mPlay.textContent = '▶';
      }
    } else {
      // fade in existing background
      if(modalBg){
        if(isReducedAnimations){
          try{ modalBg.style.transition='none'; modalBg.style.opacity = 1 }catch(e){}
        }else{
          try{ modalBg.style.transition='opacity 320ms ease'; modalBg.style.opacity = 0 }catch(e){};
          setTimeout(()=>{ try{ modalBg.style.opacity = 1 }catch(e){} }, 30);
        }
      }
      mPlay.textContent = isPlaying ? '❚❚' : '▶';
    }
  } else {
    // modal already open: change track with crossfade unless same track
    try{ localStorage.setItem('gb:modalOpen','1'); localStorage.setItem('gb:modalIndex', String(i)); }catch(e){}
    if(index !== i || !audio.src){
      loadTrack(i, {fade:'cross'});
      if(autoplay){
        play();
        mPlay.textContent='❚❚';
      } else {
        mPlay.textContent='▶';
      }
    }
    else { mPlay.textContent = isPlaying ? '❚❚' : '▶'; }
  }
}


function closeModal(){
  // play exit animation then hide
  if(!modal.classList.contains('hidden')){
    modal.classList.add('closing');
    try{ localStorage.removeItem('gb:modalOpen'); localStorage.removeItem('gb:modalIndex'); }catch(e){}
    // fade out backgrounds
    try{ modalBg.style.transition = 'opacity 260ms ease'; modalBg.style.opacity = 0 }catch(e){}
    const bg2 = document.getElementById('modalBg2'); if(bg2) try{ bg2.style.transition='opacity 220ms ease'; bg2.style.opacity = 0 }catch(e){}
    const mp = modal.querySelector('.modal-player');
    const onEnd = (ev)=>{
      if(ev.target !== mp) return;
      mp.removeEventListener('animationend', onEnd);
      modal.classList.add('hidden');
      modal.classList.remove('closing');
      // restore background opacity for next open
      try{ modalBg.style.opacity = 1 }catch(e){}
      if(bg2) try{ bg2.style.opacity = 0 }catch(e){}
      // show mini player when returning to main page
      if(miniPlayer) miniPlayer.classList.remove('hidden');
      document.body.classList.remove('modal-open');
    };
    if(mp) mp.addEventListener('animationend', onEnd);
    else { modal.classList.add('hidden'); if(miniPlayer) miniPlayer.classList.remove('hidden'); document.body.classList.remove('modal-open'); }
  }
}

modalBack.addEventListener('click',closeModal);

// Waveform visualization
let waveformActive = false;
let waveformAnimating = false;
let waveformTogglingLocked = false;
let visualizationMode = 'spectrum'; // 'spectrum' or 'waveform'
let audioContext = null;
let analyser = null;
let audioSource = null;
let waveformAnimationId = null;
let waveformColors = ['rgba(255, 77, 126, 0.9)', 'rgba(255, 184, 107, 0.9)', 'rgba(126, 77, 255, 0.9)'];
let spectrumParticles = [];
const PARTICLE_MAX = 60;

// Beat-reactive hero art pulse
let beatRaf = null;
let beatEnergy = 0;
let _beatDataArray = null;

function startBeatPulse(){
  if(isReducedAnimations || isLiteMode){
    try{ stopBeatPulse(); }catch(e){}
    return;
  }
  if(beatRaf) return;
  try{ initAudioContext(); }catch(e){}
  if(!analyser) return;
  if(!_beatDataArray || _beatDataArray.length !== analyser.frequencyBinCount){
    _beatDataArray = new Uint8Array(analyser.frequencyBinCount);
  }
  if(heroArt) heroArt.style.transition = 'none';
  if(miniCover) miniCover.style.transition = 'none';
  if(mCover) mCover.style.transition = 'none';
  const tick = ()=>{
    beatRaf = requestAnimationFrame(tick);
    if(!analyser){ stopBeatPulse(); return; }
    analyser.getByteFrequencyData(_beatDataArray);
    // Focus on kick-drum range (~50-130 Hz).
    // With fftSize=4096 @ 44100 Hz, each bin ≈ 10.8 Hz → bins 5-12.
    const kickStart = 5, kickEnd = 12;
    let sum = 0;
    for(let i = kickStart; i <= kickEnd; i++) sum += _beatDataArray[i];
    const raw = (sum / (kickEnd - kickStart + 1)) / 255;
    // Noise gate: ignore anything below 40% — only hard transient hits register
    const gated = Math.max(0, raw - 0.40) / 0.60;
    // Punchy attack, moderate release
    beatEnergy = gated > beatEnergy
      ? beatEnergy * 0.30 + gated * 0.70
      : beatEnergy * 0.88 + gated * 0.12;
    const scale = 0.93 + beatEnergy * 0.22;
    const glow  = Math.round(beatEnergy * 38);
    const alpha = (beatEnergy * 0.70).toFixed(3);
    const shadow = `0 8px ${30 + glow}px rgba(0,0,0,0.6), 0 0 ${glow}px rgba(255,77,126,${alpha})`;
    const tf = `scale(${scale.toFixed(4)})`;
    const modalScale = 0.96 + beatEnergy * 0.13;
    const modalGlow  = Math.round(beatEnergy * 24);
    const modalShadow = `0 8px ${26 + modalGlow}px rgba(0,0,0,0.58), 0 0 ${modalGlow}px rgba(255,77,126,${alpha})`;
    const modalTf = `scale(${modalScale.toFixed(4)})`;
    if(heroArt){ heroArt.style.transform = tf; heroArt.style.boxShadow = shadow; }
    if(miniCover){ miniCover.style.transform = tf; miniCover.style.boxShadow = shadow; }
    if(mCover){ mCover.style.transform = modalTf; mCover.style.boxShadow = modalShadow; }
    // Active track card cover
    try{
      const activeCard = trackListEl && trackListEl.querySelector('.track.active');
      const cardImg = activeCard && activeCard.querySelector('img');
      if(cardImg){ cardImg.style.transition='none'; cardImg.style.transform=tf; cardImg.style.boxShadow=shadow; }
    }catch(e){}
  };
  beatRaf = requestAnimationFrame(tick);
}

function stopBeatPulse(){
  if(beatRaf){ cancelAnimationFrame(beatRaf); beatRaf = null; }
  beatEnergy = 0;
  try{
    if(heroArt){ heroArt.style.transition = ''; heroArt.style.transform = ''; heroArt.style.boxShadow = ''; }
    if(miniCover){ miniCover.style.transition = ''; miniCover.style.transform = ''; miniCover.style.boxShadow = ''; }
    if(mCover){ mCover.style.transition = ''; mCover.style.transform = ''; mCover.style.boxShadow = ''; }
    try{
      const activeCard = trackListEl && trackListEl.querySelector('.track.active');
      const cardImg = activeCard && activeCard.querySelector('img');
      if(cardImg){ cardImg.style.transition = ''; cardImg.style.transform = ''; cardImg.style.boxShadow = ''; }
    }catch(e){}
  }catch(e){}
}

function extractColorsFromImage(img){
  try{
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width || 100;
    canvas.height = img.height || 100;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const colorCounts = {};
    
    // Sample every 10th pixel for performance
    for(let i = 0; i < data.length; i += 40){
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Only use lighter colors - skip very dark colors and very light ones
      if(a < 128) continue;
      const brightness = (r + g + b) / 3;
      if(brightness < 80 || brightness > 240) continue; // Increased minimum brightness from 30 to 80
      
      // Round to reduce color variations
      const key = `${Math.floor(r/20)*20},${Math.floor(g/20)*20},${Math.floor(b/20)*20}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }
    
    // Get top 4 colors and brighten them
    const sorted = Object.entries(colorCounts).sort((a,b) => b[1] - a[1]);
    const colors = [];
    for(let i = 0; i < Math.min(4, sorted.length); i++){
      const rgb = sorted[i][0].split(',').map(Number);
      // Brighten colors by 30%
      const r = Math.min(255, Math.floor(rgb[0] * 1.2));
      const g = Math.min(255, Math.floor(rgb[1] * 1.2));
      const b = Math.min(255, Math.floor(rgb[2] * 1.2));
      colors.push(`rgba(${r}, ${g}, ${b}, 0.9)`);
    }
    
    if(colors.length >= 2){
      return colors;
    }
  }catch(e){
    console.warn('Color extraction failed', e);
  }
  return ['rgba(255, 77, 126, 0.9)', 'rgba(255, 184, 107, 0.9)', 'rgba(126, 77, 255, 0.9)'];
}

function initAudioContext(){
  if(!audioContext){
    try{
      // If a loop context already exists, use it for waveform too
      if(audioCtx){
        audioContext = audioCtx;
      } else {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        audioCtx = audioContext;
      }
      
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.85;
      
      // Connect audio element to analyser
      if(!audioSource){
        audioSource = audioContext.createMediaElementSource(audio);
        audioSource.connect(analyser);
      }

      // Ensure analyser output is connected exactly once.
      try{ analyser.disconnect(); }catch(e){}
      try{ analyser.connect(audioContext.destination); }catch(e){}

      // If loop playback already started before analyser existed,
      // re-route it through analyser so beat pulse works on first play.
      try{
        if(webPlaying && webGain && analyser){
          try{ webGain.disconnect(); }catch(e){}
          webGain.connect(analyser);
        }
      }catch(e){}
    }catch(e){
      console.warn('Web Audio API not supported', e);
    }
  }
}

function drawWaveform(){
  if(!waveformAnimating || !analyser || !waveformCanvas) return;
  
  const canvas = waveformCanvas;
  const ctx = canvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  // Set canvas size to match container
  if(canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight){
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  
  const draw = ()=>{
    if(!waveformAnimating) return;
    waveformAnimationId = requestAnimationFrame(draw);
    
    // Clear canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if(visualizationMode === 'spectrum'){
      // Spectrum analyzer mode
      analyser.getByteFrequencyData(dataArray);
      
      // Create gradient from extracted colors (vertical)
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      if(waveformColors.length === 2){
        gradient.addColorStop(0, waveformColors[0]);
        gradient.addColorStop(1, waveformColors[1]);
      } else if(waveformColors.length === 3){
        gradient.addColorStop(0, waveformColors[0]);
        gradient.addColorStop(0.5, waveformColors[1]);
        gradient.addColorStop(1, waveformColors[2]);
      } else if(waveformColors.length >= 4){
        gradient.addColorStop(0, waveformColors[0]);
        gradient.addColorStop(0.33, waveformColors[1]);
        gradient.addColorStop(0.66, waveformColors[2]);
        gradient.addColorStop(1, waveformColors[3]);
      }
      
      // Draw spectrum bars (reduced from 85 to 64 for better performance)
      const barCount = 64;
      const barWidth = (canvas.width / barCount) * 0.85;
      const barSpacing = (canvas.width / barCount) * 0.15;
      
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 20;
      ctx.shadowColor = waveformColors[0];
      
      for(let i = 0; i < barCount; i++){
        // Sample from frequency data (focus on lower-mid frequencies)
        const dataIndex = Math.floor((i / barCount) * (bufferLength * 0.6));
        const value = dataArray[dataIndex] / 255.0;
        
        // Apply exponential scaling for more dynamic visualization
        const scaledValue = Math.pow(value, 0.7);
        const barHeight = scaledValue * canvas.height * 0.85;
        
        const x = i * (barWidth + barSpacing);
        const y = canvas.height - barHeight;
        
        // Draw bar with rounded top
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 8);
        ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        ctx.fill();
      }
      // Spawn particles from tall bars
      if(!isLiteMode && spectrumParticles.length < PARTICLE_MAX){
        for(let i = 0; i < barCount; i += 4){
          const dataIndex = Math.floor((i / barCount) * (bufferLength * 0.6));
          const value = dataArray[dataIndex] / 255.0;
          const scaledValue = Math.pow(value, 0.7);
          const barHeight = scaledValue * canvas.height * 0.85;
          if(barHeight > canvas.height * 0.22 && Math.random() < 0.12){
            const bx = i * (barWidth + barSpacing) + barWidth / 2;
            const by = canvas.height - barHeight;
            const colorIndex = Math.floor(Math.random() * waveformColors.length);
            spectrumParticles.push({
              x: bx + (Math.random() - 0.5) * barWidth,
              y: by,
              vy: -(0.6 + Math.random() * 1.8),
              vx: (Math.random() - 0.5) * 0.6,
              size: 1.5 + Math.random() * 2,
              opacity: 0.55 + Math.random() * 0.4,
              color: waveformColors[colorIndex]
            });
          }
        }
      }
      // Draw and update particles
      if(!isLiteMode){
        for(let p = spectrumParticles.length - 1; p >= 0; p--){
          const part = spectrumParticles[p];
          part.y += part.vy;
          part.x += part.vx;
          part.opacity -= 0.014;
          if(part.opacity <= 0){ spectrumParticles.splice(p, 1); continue; }
          ctx.globalAlpha = part.opacity;
          ctx.fillStyle = part.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = part.color;
          ctx.beginPath();
          ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }else if(spectrumParticles.length){
        spectrumParticles = [];
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    } else {
      // Waveform mode
      analyser.getByteTimeDomainData(dataArray);
      
      // Create gradient from extracted colors (horizontal)
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      if(waveformColors.length === 2){
        gradient.addColorStop(0, waveformColors[0]);
        gradient.addColorStop(1, waveformColors[1]);
      } else if(waveformColors.length === 3){
        gradient.addColorStop(0, waveformColors[0]);
        gradient.addColorStop(0.5, waveformColors[1]);
        gradient.addColorStop(1, waveformColors[2]);
      } else if(waveformColors.length >= 4){
        gradient.addColorStop(0, waveformColors[0]);
        gradient.addColorStop(0.33, waveformColors[1]);
        gradient.addColorStop(0.66, waveformColors[2]);
        gradient.addColorStop(1, waveformColors[3]);
      }
      
      // Draw waveform
      ctx.lineWidth = 8;
      ctx.strokeStyle = gradient;
      ctx.shadowBlur = 30;
      ctx.shadowColor = waveformColors[0];
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      const centerY = canvas.height / 2;
      const amplitudeScale = 0.3;
      const threshold = 0.15;
      
      for(let i = 0; i < bufferLength; i++){
        let v = (dataArray[i] / 128.0) - 1;
        const absV = Math.abs(v);
        
        if(absV < threshold){
          v *= 0.5;
        } else {
          const sign = v < 0 ? -1 : 1;
          v = sign * Math.pow(absV, 1.5) * 1.3;
        }
        
        const y = centerY + (v * centerY * amplitudeScale);
        
        if(i === 0){
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
    }
  };
  
  draw();
}

function toggleWaveform(){
  // Prevent rapid toggling while animations are playing
  if(waveformTogglingLocked) return;
  waveformTogglingLocked = true;
  
  waveformActive = !waveformActive;
  
  if(waveformActive){
    // Activate waveform mode
    initAudioContext();
    if(audioContext && audioContext.state === 'suspended'){
      audioContext.resume();
    }
    
    // If loop is active and playing, restart it to use the unified audioContext at current position
    const loopActive = loopMode === 'one';
    if(loopActive && webPlaying && index >= 0 && index < tracks.length){
      const file = tracks[index].file;
      const currentPos = getWebCurrentTime();
      switchToWebLoop(file, currentPos);
    }
    
    updateWaveformInfo();
    
    modal.classList.add('waveform-mode');
    waveformContainer.classList.remove('hidden');
    waveformContainer.classList.add('active');
    mWaveform.classList.add('active');
    mWaveform.setAttribute('aria-pressed', 'true');
    document.documentElement.classList.add('waveform-active');
    
    waveformAnimating = true;
    drawWaveform();
    
    // Unlock after animation completes (1s for entry)
    setTimeout(() => { waveformTogglingLocked = false; }, 1000);
  } else {
    // Deactivate waveform mode
    modal.classList.remove('waveform-mode');
    waveformContainer.classList.remove('active');
    mWaveform.classList.remove('active');
    mWaveform.setAttribute('aria-pressed', 'false');
    document.documentElement.classList.remove('waveform-active');
    
    // Stop animation after slide-down completes (1000ms for slideUpDramatic)
    setTimeout(()=>{
      waveformAnimating = false;
      if(waveformAnimationId){
        cancelAnimationFrame(waveformAnimationId);
        waveformAnimationId = null;
      }
      spectrumParticles = [];
      
      // Remove top info
      const topInfo = waveformContainer.querySelector('.waveform-top-info');
      if(topInfo) topInfo.remove();
      
      if(!waveformActive) waveformContainer.classList.add('hidden');
      
      // Unlock after exit animation completes
      waveformTogglingLocked = false;
    }, 1000);
  }
}

function updateWaveformInfo(imageSrc = null){
  if(!waveformActive) return;
  
  // Use provided image source or fall back to mCover
  const imgSrc = imageSrc || (mCover && mCover.src);
  
  if(imgSrc){
    // Preload the new image first
    const img = new Image();
    img.onload = ()=>{
      waveformContainer.style.backgroundImage = `url(${imgSrc})`;
      
      // Extract colors immediately after image loads
      const newColors = extractColorsFromImage(img);
      if(newColors && newColors.length >= 2){
        waveformColors = newColors;
      }
    };
    img.src = imgSrc;
  }
  
  // Check if top info already exists
  let topInfo = waveformContainer.querySelector('.waveform-top-info');
  
  if(topInfo){
    // Crossfade existing content
    const coverEl = topInfo.querySelector('.waveform-top-info__cover');
    const titleEl = topInfo.querySelector('.waveform-top-info__title');
    const artistEl = topInfo.querySelector('.waveform-top-info__artist');
    
    // Fade out
    if(coverEl) coverEl.style.opacity = '0';
    if(titleEl) titleEl.style.opacity = '0';
    if(artistEl) artistEl.style.opacity = '0';
    
    // Update content and fade back in after transition
    setTimeout(()=>{
      if(coverEl) coverEl.src = imgSrc || mCover.src;
      if(titleEl) titleEl.textContent = mTitle.textContent;
      if(artistEl) artistEl.textContent = mArtist.textContent;
      
      // Fade in
      requestAnimationFrame(()=>{
        if(coverEl) coverEl.style.opacity = '1';
        if(titleEl) titleEl.style.opacity = '1';
        if(artistEl) artistEl.style.opacity = '1';
      });
    }, 400);
  } else {
    // Create new top info display (first time)
    topInfo = document.createElement('div');
    topInfo.className = 'waveform-top-info';
    topInfo.innerHTML = `
      <img src="${imgSrc || mCover.src}" alt="cover" class="waveform-top-info__cover">
      <div class="waveform-top-info__title">${mTitle.textContent}</div>
      <div class="waveform-top-info__artist">${mArtist.textContent}</div>
    `;
    waveformContainer.appendChild(topInfo);
  }
}

if(mWaveform){
  mWaveform.addEventListener('click', toggleWaveform);
  
  // Load saved visualization mode
  try{
    const savedMode = localStorage.getItem('gb:vizMode');
    if(savedMode === 'waveform' || savedMode === 'spectrum'){
      visualizationMode = savedMode;
    }
  }catch(e){}
}

// Visualization mode toggle button
const vizModeToggle = document.getElementById('vizModeToggle');
const vizToggleLabel = document.querySelector('.viz-toggle-label');
if(vizModeToggle && vizToggleLabel){
  // Initialize checkbox state and label based on saved mode
  vizModeToggle.checked = (visualizationMode === 'waveform');
  vizToggleLabel.textContent = visualizationMode === 'waveform' ? 'Waveform' : 'Spectrum';
  
  vizModeToggle.addEventListener('change', (e)=>{
    visualizationMode = e.target.checked ? 'waveform' : 'spectrum';
    vizToggleLabel.textContent = visualizationMode === 'waveform' ? 'Waveform' : 'Spectrum';
    try{ localStorage.setItem('gb:vizMode', visualizationMode); }catch(e){}
    console.log('Visualization mode changed to:', visualizationMode);
  });
}

// ESC key handler for waveform mode
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && waveformActive){
    e.preventDefault();
    toggleWaveform();
  }
});

// Persist scroll position: save periodically during scroll and on page hide/unload
try{
  let _scrollSaveTimer = null;
  window.addEventListener('scroll', ()=>{
    try{
      if(_scrollSaveTimer) clearTimeout(_scrollSaveTimer);
      _scrollSaveTimer = setTimeout(()=>{ try{ localStorage.setItem('gb:scrollY', String(window.scrollY || window.pageYOffset || 0)); }catch(e){} }, 150);
    }catch(e){}
  }, {passive:true});
  window.addEventListener('pagehide', ()=>{ try{ localStorage.setItem('gb:scrollY', String(window.scrollY || window.pageYOffset || 0)); }catch(e){} });
  window.addEventListener('beforeunload', ()=>{ try{ localStorage.setItem('gb:scrollY', String(window.scrollY || window.pageYOffset || 0)); }catch(e){} });
}catch(e){}

init();

// Changelog toast — show once per version
(function(){
  const VERSION = '2.0.0';
  const KEY = 'gb:changelog-seen';
  let seen;
  try { seen = localStorage.getItem(KEY); } catch(e) {}
  if (seen === VERSION) return;

  const toast   = document.getElementById('changelogToast');
  const toggle  = document.getElementById('changelogToggle');
  const closeBtn= document.getElementById('changelogClose');
  const body    = document.getElementById('changelogBody');
  if (!toast) return;

  // Show after a short delay so the page settles
  setTimeout(() => toast.classList.add('visible'), 1200);

  toggle.addEventListener('click', () => {
    const open = body.classList.toggle('open');
    toggle.textContent = open ? 'Collapse' : "What's new";
  });

  function dismiss() {
    toast.classList.add('dismissed');
    toast.classList.remove('visible');
    try { localStorage.setItem(KEY, VERSION); } catch(e) {}
    setTimeout(() => toast.remove(), 320);
  }

  closeBtn.addEventListener('click', dismiss);
})();

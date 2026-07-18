import { isIOSDevice as isIOS, isSafariBrowser as isSafari, resolveAudioFile } from './js/platform.js';
import { isTrackAllowedByViewFilter as trackAllowedByViewFilter } from './js/catalog.js';
import { escapeHtml, formatDuration as fmt, formatTotalDuration as fmtTotal, getDefaultCover } from './js/format.js';
import { createShuffleQueue } from './js/shuffle.js';
import {
  copyTextToClipboard,
  getSongShareUrl,
  getTrackSongParam,
  setCopyButtonState as _setCopyButtonState,
  setSongQueryParam,
  wireCopyButtons,
} from './js/sharing.js';
import { createHistoryController } from './js/history.js';
import { downloadCatalogAsZip, downloadTrack } from './js/downloads.js';
import {
  createGroupShareUrl,
  getAvailableGroupName,
  getGroupFingerprint,
  getSharedTrackId,
  parseGroupShareUrl,
  resolveSharedGroup,
} from './js/group-sharing.js';

const audio = document.getElementById('audio');
const _audioFile = (filePath) => resolveAudioFile(filePath, audio);
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
const floatingSearchWrap = document.getElementById('floatingSearchWrap');
const floatingSearchInput = document.getElementById('floatingSearchInput');
const layoutSwitcher = document.getElementById('layoutSwitcher');
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
const customGroupShareBtn = document.getElementById('customGroupShareBtn');
const customGroupImportToggleBtn = document.getElementById('customGroupImportToggleBtn');
const customGroupShareFallback = document.getElementById('customGroupShareFallback');
const customGroupShareUrlInput = document.getElementById('customGroupShareUrl');
const customGroupImportPanel = document.getElementById('customGroupImportPanel');
const customGroupImportUrlInput = document.getElementById('customGroupImportUrl');
const customGroupPreviewBtn = document.getElementById('customGroupPreviewBtn');
const customGroupImportMessage = document.getElementById('customGroupImportMessage');
const customGroupImportPreview = document.getElementById('customGroupImportPreview');
const customGroupImportName = document.getElementById('customGroupImportName');
const customGroupImportMode = document.getElementById('customGroupImportMode');
const customGroupImportMatchesLabel = document.getElementById('customGroupImportMatchesLabel');
const customGroupImportMatches = document.getElementById('customGroupImportMatches');
const customGroupImportUnknownRow = document.getElementById('customGroupImportUnknownRow');
const customGroupImportUnknown = document.getElementById('customGroupImportUnknown');
const customGroupImportConfirmBtn = document.getElementById('customGroupImportConfirmBtn');
const customGroupImportCancelBtn = document.getElementById('customGroupImportCancelBtn');
const customViewFilterItem = document.getElementById('customViewFilterItem');
const trackContextMenu = document.getElementById('trackContextMenu');
const ostDurationEl = document.getElementById('ostDurationEl');
const mTrackCounter = document.getElementById('mTrackCounter');
const miniTrackCounter = document.getElementById('miniTrackCounter');
const mVersionSwitcher = document.getElementById('mVersionSwitcher');
const mVersionPrev = document.getElementById('mVersionPrev');
const mVersionNext = document.getElementById('mVersionNext');
const airportInfoWrap = document.getElementById('airportInfoWrap');
const mAirportInfo = document.getElementById('mAirportInfo');
const airportInfoPopover = document.getElementById('airportInfoPopover');
const AIRPORT_INFO_BUTTON_HTML = mAirportInfo ? mAirportInfo.innerHTML : '';
const AIRPORT_INFO_POPOVER_HTML = airportInfoPopover ? airportInfoPopover.innerHTML : '';
const GB_DRUMS_INFO_POPOVER_HTML = '<strong class="airport-info-popover__title">Drums Track Notice</strong><p>This drums track was separated from the full song using MVSEP (AI stem separation). It is fan-made and <em>not</em> an official isolated drum stem from the original soundtrack. Artifacts, bleed, and missing details may be present.</p>';
let contextMenuTrackIndex = -1;

// Media Session (lock screen / OS media controls)
const HAS_MEDIA_SESSION = (typeof navigator !== 'undefined' && 'mediaSession' in navigator);
let _lastMediaPositionUpdateMs = 0;

// Lazily wire onstatechange on an AudioContext so iOS 'interrupted'/'suspended'
// states are handled without requiring a user gesture to restart.
function _wireAudioCtxStateChange(ctx){
  try{
    if(!ctx || ctx._gbStateWired) return;
    ctx._gbStateWired = true;
    ctx.onstatechange = ()=>{
      try{
        // iOS fires 'interrupted' when another app takes audio focus or the session ends.
        if(ctx.state === 'interrupted' || ctx.state === 'suspended'){
          if(isPlaying && loopMode === 'one' && webPlaying){
            // WebAudio is suspended/interrupted — can't hear a thing.
            // Fall back to native <audio> loop so background audio continues.
            _iosFallbackToNativeLoop();
          }
          // Always try to resume (will succeed once a user gesture is available).
          try{ ctx.resume().catch(()=>{}); }catch(e){}
        }
        if(ctx.state === 'running' && isPlaying && loopMode === 'one' && !webPlaying){
          // Context recovered — try to restore gapless WebAudio loop.
          _iosRestoreWebLoop();
        }
      }catch(e){}
    };
  }catch(e){}
}

function _iosFallbackToNativeLoop(){
  try{
    if(!audio || !tracks[index]) return;
    const pos = webPlaying ? getWebCurrentTime() : (audio.currentTime || 0);
    stopWebLoop();
    audio.muted = false;
    // Don't use native audio.loop when there's a custom loop-start; the 'ended' handler will seek correctly.
    audio.loop = (loopMode === 'one') && (_getTrackLoopStart(tracks && tracks[index]) === 0);
    try{ audio.currentTime = pos; }catch(e){}
    audio.play().catch(()=>{});
  }catch(e){}
}

function _iosRestoreWebLoop(){
  try{
    if(!isPlaying || loopMode !== 'one' || webPlaying) return;
    if(!audio || audio.paused) return;
    const file = tracks[index] && tracks[index].file;
    if(!file || !bufferCache.has(file)) return;
    const pos = audio.currentTime || 0;
    const started = switchToWebLoop(file, pos);
    if(started){ audio.loop = true; } // audio.muted stays false — switchToWebLoop handles AudioSource gain
  }catch(e){}
}

function setupIOSPauseOnBackground(){
  try{
    // Handle page hide: if WebAudio loop is running, switch to native audio
    // so iOS can continue playing audio in background (WebAudio gets suspended).
    const handleHide = ()=>{
      try{
        if(!isPlaying) return;
        if(loopMode === 'one' && webPlaying){
          _iosFallbackToNativeLoop();
        }
        // For non-loop mode, the <audio> element owns playback; no action needed.
        // (createMediaElementSource routes audio through AudioContext — if that
        // context suspends, try to resume it when we come back.)
      }catch(e){}
    };

    const handleShow = ()=>{
      try{
        // Try to resume any suspended AudioContext immediately.
        [audioCtx, audioContext].forEach(ctx=>{
          try{ if(ctx && ctx.state !== 'running') ctx.resume().catch(()=>{}); }catch(e){}
        });
        // If we fell back to native audio loop while hidden, restore WebAudio.
        if(isPlaying && loopMode === 'one' && !webPlaying){
          // Small delay — wait for context resume to take effect.
          setTimeout(()=>{ try{ _iosRestoreWebLoop(); }catch(e){} }, 200);
        }
      }catch(e){}
    };

    document.addEventListener('visibilitychange', ()=>{
      try{
        if(document.visibilityState === 'hidden') handleHide();
        else handleShow();
      }catch(e){}
    });
    // pagehide/pageshow fire more reliably on iOS Safari than visibilitychange.
    window.addEventListener('pagehide', ()=>{ try{ handleHide(); }catch(e){} });
    window.addEventListener('pageshow', ()=>{ try{ handleShow(); }catch(e){} });
  }catch(e){}
}

// Deep link support: reflect current track in URL as ?song=Stage-Side (e.g. ?song=Menu-A)
function getSongParamForTrack(t){
  try{
    if(!t) return null;
    if(_isAirportTrack(t)){
      const timeHint = (tracks && tracks[index] === t) ? _getTimelinePosition() : 0;
      const sec = _getAirportSectionByTime(timeHint);
      if(sec) return `Airport-${sec.id}`;
    }
    return getTrackSongParam(t);
  }catch(e){ return null; }
}

function getSongShareUrlForTrack(t){
  try{
    return getSongShareUrl(getSongParamForTrack(t));
  }catch(e){ return null; }
}

function _setupStaticCopyButtons(){
  wireCopyButtons(
    [heroCopyLink, miniCopyLink, mCopyLink],
    () => getSongShareUrlForTrack(tracks?.[index]),
  );
}

function findTrackIndexBySongParam(songParam){
  try{
    if(!songParam || !tracks || !tracks.length) return -1;
    const raw = String(songParam).trim();
    if(!raw) return -1;
    pendingAirportSeekSeconds = null;

    const airportSection = _getAirportSectionFromSongParam(raw);
    if(airportSection){
      pendingAirportSeekSeconds = airportSection.start;
      for(let i=0;i<tracks.length;i++){
        if(_isAirportTrack(tracks[i])) return i;
      }
      return -1;
    }

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

const FLOATING_SHIP_STAGE = 'Airship';
const FLOATING_SHIP_SIDE_ORIGINAL = 'Original';
const FLOATING_SHIP_SIDE_GAME = 'Game';
const FLOATING_SHIP_SIDE_KEY = 'gb:floatingShipSide';
const AIRPORT_STAGE = 'Airport';
const AIRPORT_LOOP_START = 3.243; // intro ends here; looping skips back to this point
const SAFARI_SEEK_PREROLL_SECONDS = 0.25;
const AIRPORT_SECTIONS = [
  { id:'Section-A-1', start:0,       title:'Airport (Lounge)',     artist:'Mario Kart Band', cover:null },
  { id:'Section-A-2', start:58.824,  title:'Airport (Prepare for Takeoff)',     artist:'Mario Kart Band', cover:null },
  { id:'Section-B-1', start:114.486, title:'Airport (Airborne 1)',     artist:'Mario Kart Band', cover:'images/Airport-Flying.png' },
  { id:'Section-B-2', start:170.099, title:'Airport (Airborne 2)', artist:'Mario Kart Band', cover:'images/Airport-Flying.png' },
  { id:'Section-B-3', start:225.682, title:'Airport (Airborne 3)',   artist:'Mario Kart Band', cover:'images/Airport-Flying.png' },
  { id:'Section-A-3', start:281.295, title:'Airport (Arrival)',      artist:'Mario Kart Band', cover:'images/Airport-Return.png' },
  { id:'Section-A-4', start:336.879, title:'Airport (Ending)',              artist:'Mario Kart Band', cover:'images/Airport-Return.png' }
];

let activeAirportSectionId = '';
let activeAirportSectionImage = '';
let pendingAirportSeekSeconds = null;
let _seekLockedHintTimer = null;

function _isAirportTrack(t){
  try{
    if(!t) return false;
    return String(t.stage || '').trim() === AIRPORT_STAGE;
  }catch(e){ return false; }
}

function _isGbDaysNightsDrumsTrack(t){
  try{
    if(!t) return false;
    const side = String(t.side || '').trim().toLowerCase();
    if(side !== 'drums') return false;
    const title = String(t.title || '').trim().toLowerCase();
    return title === 'gang beasts days drums' || title === 'gang beasts nights drums';
  }catch(e){ return false; }
}

// Returns the loop-back point in seconds for a track (0 = loop from start).
function _getTrackLoopStart(t){
  try{ return _isAirportTrack(t) ? AIRPORT_LOOP_START : 0; }catch(e){ return 0; }
}

function _isSeekLockedForCurrentTrack(){
  // Seek lock removed — Airport timeline is interactive.
  return false;
}

function _syncSeekUiToCurrentPosition(){
  try{
    const dur = _getMediaDuration();
    if(!dur || !isFinite(dur)) return;
    const cur = _getMediaPosition();
    _updateTimingUi(cur, dur);
  }catch(e){}
}

function _showSeekLockedHint(){
  try{
    if(document.body && document.body.classList.contains('preloading')) return;
    showPreloadToast('Seeking is disabled for Airport sections.', { spinner: false });
    if(_seekLockedHintTimer) clearTimeout(_seekLockedHintTimer);
    _seekLockedHintTimer = setTimeout(()=>{ try{ hidePreloadToast(); }catch(e){} }, 1100);
  }catch(e){}
}

function _getAirportSectionIndexById(id){
  try{
    const key = String(id || '').trim().toLowerCase();
    for(let i=0;i<AIRPORT_SECTIONS.length;i++){
      if(String(AIRPORT_SECTIONS[i].id || '').trim().toLowerCase() === key) return i;
    }
    return 0;
  }catch(e){ return 0; }
}

function _seekAirportSectionByDelta(delta){
  try{
    const t = (tracks && tracks[index]) ? tracks[index] : null;
    if(!_isAirportTrack(t)) return false;
    let currentIdx = _getAirportSectionIndexById(activeAirportSectionId);
    if(currentIdx < 0 || currentIdx >= AIRPORT_SECTIONS.length){
      const currentSection = _getAirportSectionForTrack(t, _getTimelinePosition()) || AIRPORT_SECTIONS[0];
      currentIdx = _getAirportSectionIndexById(currentSection && currentSection.id);
    }
    const targetIdx = Math.max(0, Math.min(AIRPORT_SECTIONS.length - 1, currentIdx + (delta > 0 ? 1 : -1)));
    if(targetIdx === currentIdx) return true;
    const target = AIRPORT_SECTIONS[targetIdx];
    if(!target) return true;
    _applyAirportSectionState(target.start, { force: true, sectionId: target.id, crossfade: true, waveformFade: false });
    _seekToSeconds(target.start, { skipAirportApply: true, safariSeekWarmup: true });
    return true;
  }catch(e){ return false; }
}

function _getAirportSectionById(id){
  try{
    const raw = String(id || '').trim().toLowerCase();
    if(!raw) return null;
    for(const section of AIRPORT_SECTIONS){
      if(String(section.id || '').trim().toLowerCase() === raw) return section;
    }
    return null;
  }catch(e){ return null; }
}

function _updateSeekChapters(t){
  try{
    const mChapters    = document.getElementById('mSeekChapters');
    const miniChapters = document.getElementById('miniSeekChapters');
    const targets = [mChapters, miniChapters].filter(Boolean);
    if(!_isAirportTrack(t) || !t.duration){
      targets.forEach(el => { el.innerHTML = ''; });
      return;
    }
    const dur = t.duration;
    // Skip section index 0 (start of track — no marker needed at position 0%)
    const html = AIRPORT_SECTIONS
      .filter(s => s.start > 0)
      .map(s => {
        const pct = ((s.start / dur) * 100).toFixed(4);
        return `<div class="seek-chapter-pip" style="left:${pct}%" title="${s.title}"></div>`;
      }).join('');
    targets.forEach(el => { el.innerHTML = html; });
  }catch(e){}
}

function _getAirportSectionFromSongParam(songParam){
  try{
    const raw = String(songParam || '').trim();
    if(!raw) return null;
    const lower = raw.toLowerCase();
    const prefix = 'airport-section-';
    if(!lower.startsWith(prefix)) return null;
    const id = `Section-${raw.slice(prefix.length)}`;
    return _getAirportSectionById(id);
  }catch(e){ return null; }
}

function _getAirportSectionByTime(seconds){
  try{
    const sec = (typeof seconds === 'number' && isFinite(seconds) && seconds >= 0) ? seconds : 0;
    let cur = AIRPORT_SECTIONS[0] || null;
    for(const section of AIRPORT_SECTIONS){
      if(sec >= section.start) cur = section;
      else break;
    }
    return cur;
  }catch(e){ return AIRPORT_SECTIONS[0] || null; }
}

function _getAirportSectionForTrack(t, timeHint){
  try{
    if(!_isAirportTrack(t)) return null;
    let sec = null;
    if(typeof timeHint === 'number' && isFinite(timeHint)) sec = _getAirportSectionByTime(timeHint);
    else if(tracks && tracks[index] === t){
      sec = _getAirportSectionById(activeAirportSectionId) || _getAirportSectionByTime(_getTimelinePosition());
    }
    else sec = _getAirportSectionByTime(0);
    return sec;
  }catch(e){ return null; }
}

function _applyTrackImageVisuals(imageSrc, crossfade=true){
  try{
    if(!imageSrc) return;
    const src = encodeURI(imageSrc);
    const useCrossfade = !!crossfade && !isReducedAnimations;
    const setImgFade = (el, nextSrc, dur=220)=>{
      if(!el) return;
      if(!useCrossfade){
        try{ el.style.transition = 'none'; el.style.opacity = 1; el.src = nextSrc; }catch(e){}
        return;
      }
      try{ el.style.transition = `opacity ${dur}ms ease`; el.style.opacity = 0; }catch(e){}
      const tmp = new Image();
      tmp.onload = ()=>{ try{ el.src = nextSrc; requestAnimationFrame(()=>{ try{ el.style.opacity = 1; }catch(e){} }); }catch(e){} };
      tmp.src = nextSrc;
    };

    setImgFade(coverImg, src, 240);
    setImgFade(mCover, src, 260);
    setImgFade(miniCover, src, 260);

    if(modalBg){
      if(!useCrossfade){
        try{ modalBg.style.backgroundImage = `url('${src}')`; modalBg.style.opacity = 1; }catch(e){}
      }else{
        const bg2 = document.getElementById('modalBg2');
        if(bg2){
          try{ if(_bg2PendingListener){ bg2.removeEventListener('transitionend', _bg2PendingListener); _bg2PendingListener = null; } }catch(e){}
          const img = new Image();
          img.onload = ()=>{
            try{ bg2.style.transition = 'opacity 260ms ease'; }catch(e){}
            bg2.style.backgroundImage = `url('${src}')`;
            requestAnimationFrame(()=>{ try{ bg2.style.opacity = 1; }catch(e){} });
            const onEnd = (ev)=>{ if(ev.target !== bg2) return; try{ bg2.removeEventListener('transitionend', onEnd); _bg2PendingListener = null; modalBg.style.backgroundImage = bg2.style.backgroundImage; bg2.style.opacity = 0; }catch(e){} };
            _bg2PendingListener = onEnd;
            bg2.addEventListener('transitionend', onEnd);
          };
          img.src = src;
        }else{
          try{ modalBg.style.opacity = 0; }catch(e){}
          setTimeout(()=>{ try{ modalBg.style.backgroundImage = `url('${src}')`; modalBg.style.opacity = 1; }catch(e){} }, 220);
        }
      }
    }

    if(waveformActive){
      try{ updateWaveformInfo(src); }catch(e){}
    }
  }catch(e){}
}

function _applyAirportSectionState(timeHint, opts={}){
  try{
    const t = (tracks && tracks[index]) ? tracks[index] : null;
    if(!_isAirportTrack(t)){
      activeAirportSectionId = '';
      activeAirportSectionImage = '';
      return;
    }
    // If a specific section ID was provided (e.g. from an arrow click), use it
    // directly without any time-based lookup that could resolve incorrectly.
    const section = opts.sectionId
      ? (AIRPORT_SECTIONS.find(s => s.id === opts.sectionId) || _getAirportSectionForTrack(t, timeHint))
      : _getAirportSectionForTrack(t, timeHint);
    if(!section) return;
    const prevSectionId = activeAirportSectionId;
    const changed = prevSectionId !== section.id;
    const force = !!(opts && opts.force);
    const waveformFade = !(opts && opts.waveformFade === false);
    // During natural time-based progression, sections only ever advance forward.
    // This prevents a brief position glitch (e.g. WebAudio's ~50ms start delay)
    // from reverting the display back to a previous section.
    if(!force && !opts.sectionId){
      const newIdx = _getAirportSectionIndexById(section.id);
      const curIdx = _getAirportSectionIndexById(prevSectionId);
      if(curIdx >= 0 && newIdx < curIdx){
        // Allow backward movement on a loop wrap (loop-one jumps back to the beginning).
        // A wrap is unmistakable: position is near the loop-start and mode is loop-one.
        const isLoopWrap = loopMode === 'one' && newIdx === 0 &&
          typeof timeHint === 'number' && timeHint < AIRPORT_LOOP_START + 10;
        if(!isLoopWrap) return;
      }
    }
    if(!changed && !force) return;
    activeAirportSectionId = section.id;

    const title = section.title || _getDisplayTitle(t);
    const artist = section.artist || (t.artist || '');
    const image = section.cover || t.image;
    const imageKey = String(image || '');
    const imageChanged = imageKey !== activeAirportSectionImage;
    activeAirportSectionImage = imageKey;

    if(trackTitle) trackTitle.textContent = title;
    if(mTitle) mTitle.textContent = title;
    if(miniTitle) miniTitle.textContent = title;
    if(trackArtist) trackArtist.textContent = artist;
    if(mArtist) mArtist.textContent = artist;
    if(miniArtist) miniArtist.textContent = artist;

    if(imageChanged){
      const allowCrossfade = !!(opts && opts.crossfade !== false);
      try{ _applyTrackImageVisuals(image, allowCrossfade); }catch(e){}
    }
    if(waveformActive){
      try{ updateWaveformInfo(encodeURI(image), { forceImageUpdate: imageChanged, forceContentUpdate: true, colorTransitionMs: 700, animateContent: waveformFade }); }catch(e){}
    }

    try{ setSongQueryParam(`Airport-${section.id}`); }catch(e){}
    try{ updateMediaSessionMetadata(t); }catch(e){}
    try{ updateMediaSessionPlaybackState(); }catch(e){}
    try{ updateMediaSessionPosition(false); }catch(e){}
    try{
      const shareUrl = getSongShareUrlForTrack(t);
      _setCopyButtonState(heroCopyLink, shareUrl);
      _setCopyButtonState(miniCopyLink, shareUrl);
      _setCopyButtonState(mCopyLink, shareUrl);
    }catch(e){}
    if(changed){
      try{ renderList(); }catch(e){}
      try{ updateTrackActiveState(); }catch(e){}
      // Record a history entry for the section that just became active,
      // but only while actually playing (not on initial load or paused seeks).
      try{
        if(isPlaying){
          // Only commit after 4 seconds in the section (cancel any prior pending entry)
          const _secEntry = {
            title:    section.title  || t.title  || '',
            artist:   section.artist || t.artist || '',
            image:    section.cover  || t.image  || '',
            duration: null,
            stage:    t.stage || '',
            side:     t.side  || ''
          };
          historyController.schedule(index, () => _secEntry, { force: true });
        }
      }catch(e){}
    }
    // Always refresh arrow enabled/disabled state after any section change.
    try{ _updateFloatingShipVersionUI(index); }catch(e){}
  }catch(e){}
}

function _normalizeFloatingSide(side){
  try{
    const raw = String(side || '').trim().toLowerCase();
    if(raw === 'game') return FLOATING_SHIP_SIDE_GAME;
    return FLOATING_SHIP_SIDE_ORIGINAL;
  }catch(e){ return FLOATING_SHIP_SIDE_ORIGINAL; }
}

function _isFloatingShipVariantTrack(t){
  try{
    if(!t) return false;
    const stage = String(t.stage || '').trim();
    if(stage !== FLOATING_SHIP_STAGE) return false;
    const side = _normalizeFloatingSide(t.side);
    return side === FLOATING_SHIP_SIDE_ORIGINAL || side === FLOATING_SHIP_SIDE_GAME;
  }catch(e){ return false; }
}

function _isFloatingShipOriginalTrack(t){
  try{ return _isFloatingShipVariantTrack(t) && _normalizeFloatingSide(t.side) === FLOATING_SHIP_SIDE_ORIGINAL; }catch(e){ return false; }
}

function _isFloatingShipGameTrack(t){
  try{ return _isFloatingShipVariantTrack(t) && _normalizeFloatingSide(t.side) === FLOATING_SHIP_SIDE_GAME; }catch(e){ return false; }
}

function _getDisplayTitle(t){
  try{
    if(!t) return '';
    const airportSection = _getAirportSectionForTrack(t);
    if(airportSection && airportSection.title) return airportSection.title;
    return String(t.title || '');
  }catch(e){ return String((t && t.title) || ''); }
}

function _getDisplayArtist(t){
  try{
    if(!t) return '';
    const airportSection = _getAirportSectionForTrack(t);
    if(airportSection && airportSection.artist) return airportSection.artist;
    return String(t.artist || '');
  }catch(e){ return String((t && t.artist) || ''); }
}

function _findFloatingShipTrackIndexBySide(side){
  try{
    const target = _normalizeFloatingSide(side);
    for(let i=0;i<tracks.length;i++){
      const t = tracks[i];
      if(!_isFloatingShipVariantTrack(t)) continue;
      if(_normalizeFloatingSide(t.side) === target) return i;
    }
    return -1;
  }catch(e){ return -1; }
}

function _setFloatingShipPreferredSide(side, persist=true){
  try{
    floatingShipPreferredSide = _normalizeFloatingSide(side);
    if(persist){
      try{ localStorage.setItem(FLOATING_SHIP_SIDE_KEY, floatingShipPreferredSide); }catch(e){}
    }
  }catch(e){}
}

function _getRepresentativeTrackIndex(trackIndex){
  try{
    const i = parseInt(trackIndex, 10);
    if(!Number.isFinite(i) || i < 0 || i >= tracks.length) return 0;
    const t = tracks[i];
    if(_isFloatingShipGameTrack(t)){
      const originalIdx = _findFloatingShipTrackIndexBySide(FLOATING_SHIP_SIDE_ORIGINAL);
      if(originalIdx >= 0) return originalIdx;
    }
    return i;
  }catch(e){ return 0; }
}

function _resolveTrackIndexForPlayback(trackIndex, opts={}){
  try{
    const i = parseInt(trackIndex, 10);
    if(!Number.isFinite(i) || i < 0 || i >= tracks.length) return 0;
    const respectPreference = !(opts && opts.respectFloatingPreference === false);
    if(!respectPreference) return i;
    const t = tracks[i];
    if(_isFloatingShipOriginalTrack(t)){
      const preferredIdx = _findFloatingShipTrackIndexBySide(floatingShipPreferredSide);
      if(preferredIdx >= 0) return preferredIdx;
    }
    return i;
  }catch(e){ return 0; }
}

function _isTrackListedInCards(t){
  try{
    if(!t) return false;
    if(_isFloatingShipGameTrack(t)) return false;
    return true;
  }catch(e){ return true; }
}

function getListedTrackIndices(){
  try{
    const out = [];
    for(let i=0;i<tracks.length;i++){
      const t = tracks[i];
      if(!isTrackAllowedByViewFilter(t)) continue;
      if(!_isTrackListedInCards(t)) continue;
      out.push(i);
    }
    return out;
  }catch(e){ return []; }
}

function _updateFloatingShipVersionUI(trackIndex){
  try{
    if(!mVersionSwitcher) return;
    const t = tracks[trackIndex];
    const isFloating = !!_isFloatingShipVariantTrack(t);
    const isAirport = !!_isAirportTrack(t);
    const isGbDrumsInfo = !!_isGbDaysNightsDrumsTrack(t);
    const show = isFloating || isAirport;
    mVersionSwitcher.style.display = show ? '' : 'none';
    if(airportInfoWrap) airportInfoWrap.style.display = (isAirport || isGbDrumsInfo) ? '' : 'none';
    if(mAirportInfo && airportInfoPopover){
      if(isAirport){
        mAirportInfo.classList.remove('airport-info-btn--text');
        mAirportInfo.innerHTML = AIRPORT_INFO_BUTTON_HTML;
        mAirportInfo.title = 'Audio attribution';
        mAirportInfo.setAttribute('aria-label', 'Audio attribution info');
        airportInfoPopover.innerHTML = AIRPORT_INFO_POPOVER_HTML;
      }else if(isGbDrumsInfo){
        mAirportInfo.classList.add('airport-info-btn--text');
        mAirportInfo.textContent = 'Info';
        mAirportInfo.title = 'Drums track info';
        mAirportInfo.setAttribute('aria-label', 'Drums track information');
        airportInfoPopover.innerHTML = GB_DRUMS_INFO_POPOVER_HTML;
      }
    }
    if(!(isAirport || isGbDrumsInfo) && airportInfoPopover){
      airportInfoPopover.setAttribute('aria-hidden', 'true');
      if(mAirportInfo) mAirportInfo.setAttribute('aria-expanded', 'false');
    }
    if(isFloating){
      const side = _normalizeFloatingSide(t.side);
      if(mVersionPrev) mVersionPrev.disabled = (side === FLOATING_SHIP_SIDE_ORIGINAL);
      if(mVersionNext) mVersionNext.disabled = (side === FLOATING_SHIP_SIDE_GAME);
      if(mVersionPrev){ mVersionPrev.title = 'Original version'; mVersionPrev.setAttribute('aria-label', 'Switch to Original version'); }
      if(mVersionNext){ mVersionNext.title = 'Game version'; mVersionNext.setAttribute('aria-label', 'Switch to Game version'); }
    } else if(isAirport){
      const curId = activeAirportSectionId || (AIRPORT_SECTIONS[0] && AIRPORT_SECTIONS[0].id);
      const secIdx = _getAirportSectionIndexById(curId);
      if(mVersionPrev) mVersionPrev.disabled = secIdx <= 0;
      if(mVersionNext) mVersionNext.disabled = secIdx >= (AIRPORT_SECTIONS.length - 1);
      const prevLabel = secIdx > 0 ? AIRPORT_SECTIONS[secIdx - 1].id : 'Previous section';
      const nextLabel = secIdx < AIRPORT_SECTIONS.length - 1 ? AIRPORT_SECTIONS[secIdx + 1].id : 'Next section';
      if(mVersionPrev){ mVersionPrev.title = `Previous section (${prevLabel})`; mVersionPrev.setAttribute('aria-label', `Go to previous section (${prevLabel})`); }
      if(mVersionNext){ mVersionNext.title = `Next section (${nextLabel})`; mVersionNext.setAttribute('aria-label', `Go to next section (${nextLabel})`); }
    }
  }catch(e){}
}

function _applyFloatingShipVersion(nextSide){
  try{
    const normalized = _normalizeFloatingSide(nextSide);
    _setFloatingShipPreferredSide(normalized, true);
    const target = _findFloatingShipTrackIndexBySide(normalized);
    if(target < 0){
      try{ renderList(); }catch(e){}
      try{ updateTrackCounter(); }catch(e){}
      try{ _updateFloatingShipVersionUI(index); }catch(e){}
      return;
    }
    const isCurrentFloating = _isFloatingShipVariantTrack(tracks[index]);
    const wasPlaying = !!isPlaying;
    if(isCurrentFloating && index !== target){
      const fadeMode = (modal && !modal.classList.contains('hidden')) ? 'cross' : 'in';
      loadTrack(target, {fade:fadeMode, respectFloatingPreference:false});
      if(wasPlaying) play();
    }
    try{ renderList(); }catch(e){}
    try{ updateTrackCounter(); }catch(e){}
    try{ updateTrackActiveState(); }catch(e){}
    try{ _updateFloatingShipVersionUI(index); }catch(e){}
  }catch(e){}
}

let _preloadToastTimer = null;
let _preloadToastHideTimer = null;
let _preloadToastShownAt = 0;

function showPreloadToast(msg, opts={}){
  try{
    if(!preloadToast) return;
    if(_preloadToastTimer){ clearTimeout(_preloadToastTimer); _preloadToastTimer = null; }
    if(_preloadToastHideTimer){ clearTimeout(_preloadToastHideTimer); _preloadToastHideTimer = null; }
    const showSpinner = !(opts && opts.spinner === false);
    if(msg && preloadToastText) preloadToastText.textContent = msg;
    preloadToast.classList.toggle('preload-toast--no-spinner', !showSpinner);
    preloadToast.setAttribute('aria-hidden', 'false');
    preloadToast.classList.add('show');
    _preloadToastShownAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
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
    // A saved WebAudio offset is only authoritative while native media is paused.
    // Once native playback starts, audio.currentTime must be allowed to advance.
    if(webOffsetValid && (!audio || audio.paused)) return webOffset;
  }catch(e){}
  try{ return (audio && typeof audio.currentTime === 'number') ? audio.currentTime : 0; }catch(e){ return 0; }
}

function _getCatalogDuration(trackIndex=index){
  try{
    const loadedDuration = Number(trackDurations && trackDurations[trackIndex]);
    if(Number.isFinite(loadedDuration) && loadedDuration > 0) return loadedDuration;
    const bakedDuration = Number(tracks && tracks[trackIndex] && tracks[trackIndex].duration);
    return Number.isFinite(bakedDuration) && bakedDuration > 0 ? bakedDuration : null;
  }catch(e){ return null; }
}

// A browser may report the wrong total duration while currentTime remains an
// ordinary media timestamp (Safari does this for some OGG files). Do not scale
// positions by that bad duration: doing so moves real seek targets too far ahead.
function _mediaTimeToCatalogTime(mediaTime, mediaDuration=_getMediaDuration(), trackIndex=index){
  return Math.max(0, Number(mediaTime) || 0);
}

function _catalogTimeToMediaTime(catalogTime, mediaDuration=_getMediaDuration(), trackIndex=index){
  return Math.max(0, Number(catalogTime) || 0);
}

function _getTimelinePosition(){
  return _mediaTimeToCatalogTime(_getMediaPosition(), _getMediaDuration());
}

function _getDisplayTiming(mediaPosition, mediaDuration){
  const safeMediaDuration = Number(mediaDuration);
  const safeMediaPosition = Math.max(0, Number(mediaPosition) || 0);
  const catalogDuration = _getCatalogDuration();
  const displayDuration = catalogDuration || (Number.isFinite(safeMediaDuration) && safeMediaDuration > 0 ? safeMediaDuration : null);
  let displayPosition = _mediaTimeToCatalogTime(safeMediaPosition, safeMediaDuration);
  if(displayDuration) displayPosition = Math.max(0, Math.min(displayDuration, displayPosition));
  return { displayDuration, displayPosition };
}

function _updateTimingUi(mediaPosition, mediaDuration, opts={}){
  try{
    const safeMediaDuration = Number(mediaDuration);
    const safeMediaPosition = Math.max(0, Number(mediaPosition) || 0);
    const timing = _getDisplayTiming(safeMediaPosition, safeMediaDuration);
    if(opts.updateSeek !== false && Number.isFinite(safeMediaDuration) && safeMediaDuration > 0){
      const percent = Math.max(0, Math.min(100, (safeMediaPosition / safeMediaDuration) * 100));
      if(mSeek) mSeek.value = percent;
      if(miniSeek) miniSeek.value = percent;
      setSeekPercent(percent);
    }
    if(mCur) mCur.textContent = fmt(timing.displayPosition);
    if(miniCur) miniCur.textContent = fmt(timing.displayPosition);
    if(mRem) mRem.textContent = timing.displayDuration ? fmt(timing.displayDuration) : '';
    if(miniRem) miniRem.textContent = timing.displayDuration ? fmt(timing.displayDuration) : '';
  }catch(e){}
}

function updateMediaSessionMetadata(t){
  if(!HAS_MEDIA_SESSION) return;
  try{
    if(!t){
      try{ navigator.mediaSession.metadata = null; }catch(e){}
      return;
    }
    const airportSection = _getAirportSectionForTrack(t);
    const image = (airportSection && airportSection.cover) ? airportSection.cover : t.image;
    const artist = _getDisplayArtist(t);
    const art = image ? _absUrl(encodeURI(image)) : undefined;
    const data = {
      title: _getDisplayTitle(t),
      artist,
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
    const mediaDuration = _getMediaDuration();
    if(!mediaDuration || !isFinite(mediaDuration)) return;
    const duration = _getCatalogDuration() || mediaDuration;
    const rawPos = _getMediaPosition();
    const position = Math.max(0, Math.min(duration, _mediaTimeToCatalogTime(rawPos, mediaDuration)));
    navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position });
    _lastMediaPositionUpdateMs = now;
  }catch(e){}
}

function _seekToSeconds(targetSeconds, opts={}){
  try{
    const allowLocked = !!(opts && opts.allowLocked);
    if(_isSeekLockedForCurrentTrack() && !allowLocked){
      try{ _showSeekLockedHint(); }catch(e){}
      try{ _syncSeekUiToCurrentPosition(); }catch(e){}
      return;
    }
    const file = tracks[index] && tracks[index].file;
    const loopActive = loopMode === 'one';
    const buf = (loopActive && file) ? bufferCache.get(file) : null;
    const webDur = (webSource && webSource.buffer) ? webSource.buffer.duration : null;
    const dur = (webDur && isFinite(webDur)) ? webDur : (buf && buf.duration ? buf.duration : audio.duration);
    if(!dur || !isFinite(dur)) return;
    const timelineDuration = _getCatalogDuration() || dur;
    const timelineTarget = Math.max(0, Math.min(timelineDuration, Number(targetSeconds) || 0));
    const mediaTarget = _catalogTimeToMediaTime(timelineTarget, dur);

    if(loopActive && buf){
      if(isPlaying){
        switchToWebLoop(file, mediaTarget);
        // Sync audio.currentTime to the seek target so iOS scrubbing doesn't snap back.
        try{ if(audio) audio.currentTime = _catalogTimeToMediaTime(timelineTarget, audio.duration); }catch(e){}
      } else {
        webOffset = mediaTarget;
        webOffsetValid = true;
        try{ audio.currentTime = _catalogTimeToMediaTime(timelineTarget, audio.duration); }catch(e){}
      }
    } else {
      webOffsetValid = false;
      _seekNativeAudio(mediaTarget, opts);
    }

    // keep UI + media position in sync
    try{
      _updateTimingUi(mediaTarget, dur);
    }catch(e){}
    try{ _audioTimeBase = mediaTarget; _audioTimeStamp = _nowMs(); }catch(e){}
    try{ updateMediaSessionPosition(true); }catch(e){}
    // skipAirportApply is set when the caller has already applied section metadata
    // (e.g. _seekAirportSectionByDelta), so we don't run a potentially stale time-lookup.
    if(!(opts && opts.skipAirportApply)){
      const waveInfoFade = !(opts && opts.suppressWaveformInfoFade);
      try{ _applyAirportSectionState(timelineTarget, {force:true, crossfade:true, waveformFade: waveInfoFade}); }catch(e){}
    }
  }catch(e){}
}

function _seekBySeconds(delta, opts={}){
  try{
    const duration = _getMediaDuration();
    if(!duration || !isFinite(duration)) return;
    _seekToSeconds(_getTimelinePosition() + delta, opts);
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
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const remaining = Math.max(0, 420 - (now - _preloadToastShownAt));
    const finish = ()=>{
      _preloadToastHideTimer = null;
      preloadToast.classList.remove('show');
      preloadToast.classList.remove('preload-toast--no-spinner');
      preloadToast.setAttribute('aria-hidden', 'true');
    };
    if(_preloadToastHideTimer) clearTimeout(_preloadToastHideTimer);
    if(remaining > 0) _preloadToastHideTimer = setTimeout(finish, remaining);
    else finish();
  }catch(e){}
}

let tracks = [];
let trackDurations = [];
let durationLoadedCount = 0;
let index = 0;
let isPlaying = false;
let _mediaLoadToken = 0;
let _mediaLoadPending = false;
let _mediaLoadSource = '';
let _mediaLoadReady = Promise.resolve({ token: 0, seek: 0 });
let _cancelMediaPreparation = null;
let _cancelSafariSeekResume = null;
let _safariSeekResumePending = false;
let _safariSeekResumeToken = 0;
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
let pendingSharedGroup = null;
let currentViewFilter = 'all';
window.currentViewFilter = currentViewFilter;
let currentLayoutMode = 'grid';
let progressRaf = null;
let searchQuery = '';
let floatingShipPreferredSide = FLOATING_SHIP_SIDE_ORIGINAL;

function _setPlaybackState(playing){
  const nextState = !!playing;
  isPlaying = nextState;
  try{ if(mPlay) mPlay.textContent = nextState ? '❚❚' : '▶'; }catch(e){}
  try{ if(miniPlay) miniPlay.textContent = nextState ? '❚❚' : '▶'; }catch(e){}
  try{ if(heroArt) heroArt.classList.toggle('playing', nextState); }catch(e){}
  try{ if(nextState && miniPlayer) miniPlayer.classList.remove('hidden'); }catch(e){}
  try{ nextState ? startProgress() : stopProgress(); }catch(e){}
  try{ updateMediaSessionPlaybackState(); updateMediaSessionPosition(true); }catch(e){}
}

function _beginNativeMediaLoad(source, initialSeek=0){
  _safariSeekResumeToken++;
  try{ if(_cancelSafariSeekResume) _cancelSafariSeekResume(); }catch(e){}
  try{ if(_cancelMediaPreparation) _cancelMediaPreparation(); }catch(e){}
  try{ showPreloadToast('Loading track…'); }catch(e){}

  const token = ++_mediaLoadToken;
  const seekTarget = Math.max(0, Number(initialSeek) || 0);
  const holdMuted = seekTarget > 0;
  const previousMuted = !!audio.muted;
  _mediaLoadPending = true;
  _mediaLoadSource = source;
  _setPlaybackState(false);
  try{ audio.pause(); }catch(e){}
  if(holdMuted){
    try{ audio.muted = true; }catch(e){}
  }

  _mediaLoadReady = new Promise((resolve, reject)=>{
    let settled = false;
    let timeoutId = null;

    const isCurrent = ()=> token === _mediaLoadToken;
    const cleanup = ()=>{
      ['loadedmetadata', 'durationchange', 'progress', 'canplay', 'seeked', 'error']
        .forEach(eventName=>{ try{ audio.removeEventListener(eventName, onMediaEvent); }catch(e){} });
      if(timeoutId) clearTimeout(timeoutId);
      if(isCurrent()){
        _mediaLoadPending = false;
        _cancelMediaPreparation = null;
        if(holdMuted){ try{ audio.muted = previousMuted; }catch(e){} }
        try{ hidePreloadToast(); }catch(e){}
      }
    };
    const finish = ()=>{
      if(settled) return;
      settled = true;
      cleanup();
      resolve({ token, seek: seekTarget });
    };
    const getMediaSeekTarget = ()=> _catalogTimeToMediaTime(seekTarget, audio.duration);
    const fail = (cause)=>{
      if(settled) return;
      settled = true;
      cleanup();
      reject(cause instanceof Error ? cause : new Error(String(cause || 'Media load failed')));
    };
    const targetIsSeekable = ()=>{
      if(seekTarget <= 0) return true;
      const mediaSeekTarget = getMediaSeekTarget();
      try{
        for(let rangeIndex = 0; rangeIndex < audio.seekable.length; rangeIndex++){
          if(audio.seekable.start(rangeIndex) <= mediaSeekTarget && audio.seekable.end(rangeIndex) >= mediaSeekTarget) return true;
        }
      }catch(e){}
      return false;
    };
    const attemptPreparation = ()=>{
      if(!isCurrent()){
        fail(Object.assign(new Error('Superseded media load'), { name: 'AbortError' }));
        return;
      }
      if(audio.readyState < 1) return;
      if(seekTarget <= 0){ finish(); return; }
      if(!targetIsSeekable()) return;
      try{
        const mediaSeekTarget = getMediaSeekTarget();
        if(Math.abs((audio.currentTime || 0) - mediaSeekTarget) <= 0.12 && !audio.seeking){
          finish();
          return;
        }
        audio.currentTime = mediaSeekTarget;
        if(!audio.seeking && Math.abs((audio.currentTime || 0) - mediaSeekTarget) <= 0.12) finish();
      }catch(e){ fail(e); }
    };
    function onMediaEvent(event){
      if(event.type === 'error'){
        fail(audio.error || new Error(`Unable to load ${source}`));
        return;
      }
      attemptPreparation();
    }

    ['loadedmetadata', 'durationchange', 'progress', 'canplay', 'seeked', 'error']
      .forEach(eventName=>audio.addEventListener(eventName, onMediaEvent));
    timeoutId = setTimeout(()=>{
      fail(new Error(seekTarget > 0
        ? `Timed out preparing seek to ${seekTarget}s`
        : 'Timed out loading audio metadata'));
    }, 12000);
    _cancelMediaPreparation = ()=>{
      fail(Object.assign(new Error('Superseded media load'), { name: 'AbortError' }));
    };
  });
  // A paused deep link may never call play(), so keep cancelled/failed preparation
  // from surfacing as an unhandled rejection while preserving it for play() to await.
  _mediaLoadReady.catch(()=>{});

  try{
    audio.src = encodeURI(source);
    audio.load();
  }catch(e){
    try{ if(_cancelMediaPreparation) _cancelMediaPreparation(); }catch(e2){}
  }
  return token;
}

function _seekNativeAudio(mediaTarget, opts={}){
  const useSafariWarmup = !!(opts && opts.safariSeekWarmup) && isSafari();
  const shouldResume = _safariSeekResumePending || !!(audio && !audio.paused && !audio.ended);
  const resumeToken = ++_safariSeekResumeToken;

  try{ if(_cancelSafariSeekResume) _cancelSafariSeekResume(); }catch(e){}
  if(!useSafariWarmup || !shouldResume){
    try{ audio.currentTime = mediaTarget; }catch(e){}
    return;
  }

  const loadToken = _mediaLoadToken;
  const prerollSeconds = Math.min(SAFARI_SEEK_PREROLL_SECONDS, mediaTarget);
  const seekTarget = Math.max(0, mediaTarget - prerollSeconds);
  const previousMuted = !!audio.muted;
  let finished = false;
  let resumeStarted = false;
  let readinessTimeoutId = null;
  let gateTimeoutId = null;
  let gateRafId = null;
  _safariSeekResumePending = true;

  const gainGate = (audioSourceGain && audioContext) ? audioSourceGain : null;

  const silenceOutput = ()=>{
    if(gainGate){
      try{
        const now = audioContext.currentTime;
        gainGate.gain.cancelScheduledValues(now);
        gainGate.gain.setValueAtTime(0, now);
      }catch(e){}
    }else{
      try{ audio.muted = true; }catch(e){}
    }
  };
  const restoreOutput = ()=>{
    if(gainGate){
      try{
        const now = audioContext.currentTime;
        gainGate.gain.cancelScheduledValues(now);
        gainGate.gain.setValueAtTime(_getPlayerVolume(), now);
      }catch(e){}
    }else{
      try{ audio.muted = previousMuted; }catch(e){}
    }
  };
  const clearReadiness = ()=>{
    try{ audio.removeEventListener('seeked', onReady); }catch(e){}
    try{ audio.removeEventListener('canplay', onReady); }catch(e){}
    if(readinessTimeoutId){ clearTimeout(readinessTimeoutId); readinessTimeoutId = null; }
  };
  const cleanup = ()=>{
    clearReadiness();
    if(gateTimeoutId){ clearTimeout(gateTimeoutId); gateTimeoutId = null; }
    if(gateRafId){ cancelAnimationFrame(gateRafId); gateRafId = null; }
    if(_cancelSafariSeekResume === cancel) _cancelSafariSeekResume = null;
  };
  const cancel = ()=>{
    if(finished) return;
    finished = true;
    cleanup();
    restoreOutput();
    _safariSeekResumePending = false;
  };
  const finish = ()=>{
    if(finished) return;
    finished = true;
    cleanup();
    restoreOutput();
    if(loadToken !== _mediaLoadToken || resumeToken !== _safariSeekResumeToken) return;
    _safariSeekResumePending = false;
    _setPlaybackState(true);
  };
  const openGateAfterPreroll = ()=>{
    if(finished) return;
    if(loadToken !== _mediaLoadToken || resumeToken !== _safariSeekResumeToken){ cancel(); return; }
    if(gainGate && audioContext && audioContext.state === 'running'){
      try{
        const now = audioContext.currentTime;
        const openAt = now + prerollSeconds;
        gainGate.gain.cancelScheduledValues(now);
        gainGate.gain.setValueAtTime(0, now);
        gainGate.gain.setValueAtTime(0, openAt);
        gainGate.gain.linearRampToValueAtTime(_getPlayerVolume(), openAt + 0.012);
      }catch(e){}
      gateTimeoutId = setTimeout(finish, Math.max(20, Math.ceil((prerollSeconds + 0.035) * 1000)));
      return;
    }
    // Keep native Safari playback muted until its own media clock reaches the
    // requested boundary. Unlike WebKit's MediaElementAudioSource path, this
    // clock stays tied to the decoder even when seek startup latency varies.
    const waitForNativeTarget = ()=>{
      if(finished) return;
      if(loadToken !== _mediaLoadToken || resumeToken !== _safariSeekResumeToken){ cancel(); return; }
      if((audio.currentTime || 0) >= mediaTarget - 0.015){ finish(); return; }
      gateRafId = requestAnimationFrame(waitForNativeTarget);
    };
    gateRafId = requestAnimationFrame(waitForNativeTarget);
  };
  const resume = ()=>{
    if(finished || resumeStarted) return;
    resumeStarted = true;
    clearReadiness();
    if(loadToken !== _mediaLoadToken){
      cancel();
      return;
    }
    let playPromise = null;
    try{ playPromise = audio.play(); }catch(e){
      cancel();
      _setPlaybackState(false);
      return;
    }
    let contextPromise = Promise.resolve();
    try{
      if(audioContext && audioContext.state !== 'running') contextPromise = audioContext.resume();
    }catch(e){}
    Promise.all([Promise.resolve(playPromise), Promise.resolve(contextPromise)]).then(()=>{
      if(loadToken !== _mediaLoadToken || resumeToken !== _safariSeekResumeToken){ cancel(); return; }
      openGateAfterPreroll();
    }).catch(()=>{
      cancel();
      _setPlaybackState(false);
    });
  };
  function onReady(){
    if(loadToken !== _mediaLoadToken){ cancel(); return; }
    if(audio.seeking || audio.readyState < 3) return;
    if(Math.abs((audio.currentTime || 0) - seekTarget) > 0.12) return;
    resume();
  }

  _cancelSafariSeekResume = cancel;
  silenceOutput();
  try{ audio.pause(); }catch(e){}
  audio.addEventListener('seeked', onReady);
  audio.addEventListener('canplay', onReady);
  try{ audio.currentTime = seekTarget; }catch(e){ cancel(); return; }
  if(!audio.seeking) queueMicrotask(onReady);
  readinessTimeoutId = setTimeout(resume, 1500);
}

let recentlyPlayed = []; // Array of track indices (max 20)
const MAX_RECENT = 20;
const REDUCE_ANIMATIONS_KEY = 'gb:reduceAnimations';
const LITE_MODE_KEY = 'gb:liteMode';
const LAYOUT_MODE_KEY = 'gb:layoutMode';
const CUSTOM_EXCLUSIONS_KEY = 'gb:customExclusions';
const CUSTOM_EXCLUSIONS_NAME_KEY = 'gb:customExclusionsName';
const CUSTOM_FILTERS_KEY = 'gb:customFilters';
const CUSTOM_FILTERS_ACTIVE_KEY = 'gb:customFiltersActive';
const CLICK_PULSE_SELECTOR = 'button, input[type="button"], input[type="submit"], input[type="reset"], a.preload-all, a.modal-action-btn, a.info-modal-btn, [role="button"]';
const CLICK_PULSE_EXCLUDE_SELECTOR = '.copy-link-btn, #downloadAllBtn, .mini-download, .m-download, [data-action="download"]';
const clickPulseAnimations = new WeakMap();

const historyController = createHistoryController({
  getTracks: () => tracks,
  onPlayTrack: (trackIndex) => {
    loadTrack(trackIndex, { fade: 'cross' });
    play();
  },
});

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
    audio.addEventListener('playing', ()=>{
      try{ hidePreloadToast(); }catch(e){}
      try{ if(!_mediaLoadPending && !webPlaying) _setPlaybackState(true); }catch(e){}
    });
    audio.addEventListener('error', ()=>{
      try{ hidePreloadToast(); }catch(e){}
      try{ if(!webPlaying) _setPlaybackState(false); }catch(e){}
    });
  }
}catch(e){}

function isTrackAllowedByViewFilter(t){
  try{
    return trackAllowedByViewFilter(t, {
      viewFilter: currentViewFilter,
      customFiles: customExclusionFiles,
      customMode: customExclusionsMode,
    });
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

function setGroupImportMessage(message = '', type = ''){
  if(!customGroupImportMessage) return;
  customGroupImportMessage.textContent = String(message || '');
  customGroupImportMessage.classList.toggle('is-error', type === 'error');
  customGroupImportMessage.classList.toggle('is-success', type === 'success');
}

function clearGroupImportPreview(){
  pendingSharedGroup = null;
  if(customGroupImportPreview) customGroupImportPreview.hidden = true;
  if(customGroupImportUnknownRow) customGroupImportUnknownRow.hidden = true;
}

function setGroupImportPanelOpen(open, options = {}){
  const shouldOpen = !!open;
  if(customGroupImportPanel){
    customGroupImportPanel.hidden = !shouldOpen;
    customGroupImportPanel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  }
  if(customGroupImportToggleBtn) customGroupImportToggleBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  if(!shouldOpen){
    clearGroupImportPreview();
    setGroupImportMessage();
    if(customGroupImportUrlInput) customGroupImportUrlInput.value = '';
  }else if(options.focus !== false){
    try{ customGroupImportUrlInput?.focus(); }catch(e){}
  }
}

function renderGroupImportPreview(group){
  pendingSharedGroup = group;
  if(customGroupImportName) customGroupImportName.textContent = group.name;
  if(customGroupImportMode) customGroupImportMode.textContent = group.mode === 'include' ? 'Include' : 'Exclude';
  if(customGroupImportMatchesLabel) customGroupImportMatchesLabel.textContent = group.mode === 'include' ? 'Included tracks' : 'Excluded tracks';
  if(customGroupImportMatches) customGroupImportMatches.textContent = String(group.matchedTracks.length);
  if(customGroupImportUnknown) customGroupImportUnknown.textContent = String(group.unknownTrackIds.length);
  if(customGroupImportUnknownRow) customGroupImportUnknownRow.hidden = group.unknownTrackIds.length === 0;
  if(customGroupImportPreview) customGroupImportPreview.hidden = false;
  setGroupImportMessage(group.unknownTrackIds.length
    ? `${group.unknownTrackIds.length} ${group.unknownTrackIds.length === 1 ? 'track was' : 'tracks were'} not found in this catalog and will be skipped.`
    : 'Review this group before importing.');
}

function consumeSharedGroupQuery(){
  try{
    const url = new URL(window.location.href);
    if(!url.searchParams.has('group')) return;
    url.searchParams.delete('group');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }catch(e){}
}

function previewGroupShareUrl(value, options = {}){
  clearGroupImportPreview();
  try{
    const decoded = parseGroupShareUrl(value, window.location.href);
    const resolved = resolveSharedGroup(decoded, tracks);
    renderGroupImportPreview(resolved);
    if(options.consumeQuery) consumeSharedGroupQuery();
    return true;
  }catch(error){
    setGroupImportMessage(error?.message || 'This group sharing URL could not be imported.', 'error');
    return false;
  }
}

function getCustomFilterTrackIds(filter){
  const files = new Set(Array.isArray(filter?.files) ? filter.files.map(file=>String(file||'').trim()) : []);
  return tracks
    .filter(track => files.has(String(track?.file || '').trim()))
    .map(getSharedTrackId)
    .filter(Boolean);
}

function syncCustomGroupEditor(){
  _loadActiveCustomFilterState();
  renderCustomProfilesList();
  updateCustomModeButtons();
  updateCustomGroupControls();
  updateCustomFilterOption();
  if(customExclusionsNameInput) customExclusionsNameInput.value = customExclusionsName || '';
  setCustomExcludeSelection('');
  populateCustomExcludeSelect();
  renderCustomExclusionsList();
  syncViewDropdownPressed();
}

function importPendingSharedGroup(){
  if(!pendingSharedGroup) return;
  const incoming = pendingSharedGroup;
  const incomingFingerprint = getGroupFingerprint({
    name: '__shared_group_content__',
    mode: incoming.mode,
    trackIds: incoming.matchedTrackIds,
  });
  const isImportedNameVariant = (candidate)=>{
    const localName = String(candidate || '').trim() || 'Custom group';
    if(localName === incoming.name) return true;
    const suffixMatch = localName.match(/ \((\d+)\)$/);
    if(!suffixMatch || Number(suffixMatch[1]) < 2) return false;
    const suffix = suffixMatch[0];
    return localName === `${incoming.name.slice(0, 40 - suffix.length).trimEnd()}${suffix}`;
  };
  const identical = customFilters.find(filter => isImportedNameVariant(filter?.name) && getGroupFingerprint({
      name: '__shared_group_content__',
      mode: filter?.mode,
      trackIds: getCustomFilterTrackIds(filter),
    }) === incomingFingerprint);

  let status;
  if(identical){
    _saveActiveCustomFilterState();
    activeCustomFilterId = identical.id;
    try{ localStorage.setItem(CUSTOM_FILTERS_ACTIVE_KEY, String(activeCustomFilterId || '')); }catch(e){}
    status = `“${incoming.name}” already exists and is now selected.`;
  }else{
    const importedName = getAvailableGroupName(incoming.name, customFilters.map(filter => filter?.name));
    const created = _newCustomFilter(importedName);
    created.mode = incoming.mode;
    created.files = [...incoming.files];
    customFilters.push(created);
    activeCustomFilterId = created.id;
    _loadActiveCustomFilterState();
    saveCustomFilters();
    status = `Imported “${importedName}”. Choose it from Filter when you want to apply it.`;
  }

  syncCustomGroupEditor();
  clearGroupImportPreview();
  if(customGroupImportUrlInput) customGroupImportUrlInput.value = '';
  setGroupImportMessage(status, 'success');
}

async function shareActiveCustomGroup(){
  const activeGroup = _getActiveCustomFilter();
  if(!activeGroup) return;
  try{
    const url = createGroupShareUrl(activeGroup, tracks, window.location.origin);
    if(customGroupShareFallback) customGroupShareFallback.hidden = true;
    const copied = await copyTextToClipboard(url);
    if(copied){
      if(customGroupShareBtn){
        customGroupShareBtn.textContent = 'Copied!';
        window.setTimeout(()=>{ if(customGroupShareBtn) customGroupShareBtn.textContent = 'Share'; }, 1100);
      }
    }else{
      if(customGroupShareFallback) customGroupShareFallback.hidden = false;
      if(customGroupShareUrlInput){
        customGroupShareUrlInput.value = url;
        customGroupShareUrlInput.focus();
        customGroupShareUrlInput.select();
      }
    }
  }catch(error){
    setGroupImportPanelOpen(true, { focus:false });
    setGroupImportMessage(error?.message || 'This group could not be shared.', 'error');
  }
}

function handleIncomingGroupShare(){
  try{
    const url = new URL(window.location.href);
    if(!url.searchParams.has('group')) return;
    toggleSettingsModal(true);
    showSettingsPage('exclusions');
    setGroupImportPanelOpen(true, { focus:false });
    if(customGroupImportUrlInput) customGroupImportUrlInput.value = url.href;
    previewGroupShareUrl(url.href, { consumeQuery:true });
    try{ customGroupImportPreview?.focus(); }catch(e){}
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
    const activeGroup = _getActiveCustomFilter();
    const hasActiveGroup = !!activeGroup;
    const hasShareableTracks = !!(activeGroup && getCustomFilterTrackIds(activeGroup).length);
    if(customExclusionsNameInput) customExclusionsNameInput.disabled = !hasActiveGroup;
    if(customExcludeTrigger) customExcludeTrigger.disabled = !hasActiveGroup;
    if(customExcludeAddBtn) customExcludeAddBtn.disabled = !hasActiveGroup;
    if(customProfileDeleteBtn) customProfileDeleteBtn.disabled = !hasActiveGroup;
    if(customGroupShareBtn){
      customGroupShareBtn.disabled = !hasShareableTracks;
      customGroupShareBtn.title = hasShareableTracks ? 'Copy a sharing URL for this group' : 'Add at least one track before sharing';
    }
  }catch(e){}
}

function renderCustomProfilesList(){
  try{
    if(customGroupShareFallback){
      customGroupShareFallback.hidden = true;
      if(customGroupShareUrlInput) customGroupShareUrlInput.value = '';
    }
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

function prefersReducedMotion(){
  try{
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }catch(e){
    return false;
  }
}

function triggerClickPulse(el){
  try{
    if(!el || isReducedAnimations || prefersReducedMotion()) return;
    if(el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    if(typeof el.animate !== 'function') return;

    const previous = clickPulseAnimations.get(el);
    if(previous){
      try{ previous.cancel(); }catch(e){}
    }

    const isTrackCard = el.classList && el.classList.contains('track');
    const keyframes = isTrackCard
      ? [
          { scale: 1, offset: 0 },
          { scale: 0.968, offset: 0.42 },
          { scale: 1.01, offset: 0.78 },
          { scale: 1, offset: 1 }
        ]
      : [
          { scale: 1, offset: 0 },
          { scale: 0.918, offset: 0.38 },
          { scale: 1.014, offset: 0.76 },
          { scale: 1, offset: 1 }
        ];
    const options = isTrackCard
      ? {
          duration: 290,
          easing: 'cubic-bezier(.25,.9,.3,1)',
          fill: 'none'
        }
      : {
          duration: 255,
          easing: 'cubic-bezier(.28,.88,.34,1)',
          fill: 'none'
        };

    const animation = el.animate(keyframes, options);

    const cleanup = ()=>{
      if(clickPulseAnimations.get(el) === animation){
        clickPulseAnimations.delete(el);
      }
    };
    animation.onfinish = cleanup;
    animation.oncancel = cleanup;
    clickPulseAnimations.set(el, animation);
  }catch(e){}
}

function setupClickPulse(){
  try{
    document.addEventListener('click', (ev)=>{
      const target = ev.target;
      if(!(target instanceof Element)) return;
      const clickable = target.closest(CLICK_PULSE_SELECTOR);
      if(!clickable) return;
      if(clickable.matches(CLICK_PULSE_EXCLUDE_SELECTOR)) return;
      triggerClickPulse(clickable);
    }, true);
  }catch(e){}
}

setupClickPulse();

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

function setLayoutMode(mode, persist = false){
  const nextMode = mode === 'list' ? 'list' : 'grid';
  currentLayoutMode = nextMode;
  try{
    if(trackListEl){
      trackListEl.classList.toggle('layout-list', nextMode === 'list');
      trackListEl.dataset.layout = nextMode;
    }
    if(layoutSwitcher){
      layoutSwitcher.querySelectorAll('[data-layout]').forEach(option=>{
        const active = option.dataset.layout === nextMode;
        option.classList.toggle('active', active);
        option.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }
    if(persist) localStorage.setItem(LAYOUT_MODE_KEY, nextMode);
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
    if(customExcludeMenu){
      customExcludeMenu.setAttribute('aria-hidden', 'true');
      customExcludeMenu.classList.remove('is-portaled');
      customExcludeMenu.style.removeProperty('left');
      customExcludeMenu.style.removeProperty('top');
      customExcludeMenu.style.removeProperty('bottom');
      customExcludeMenu.style.removeProperty('width');
      customExcludeMenu.style.removeProperty('max-height');
      customExcludeMenu.style.removeProperty('--settings-select-options-height');
      if(customExcludeSelectWrap && customExcludeMenu.parentElement !== customExcludeSelectWrap){
        customExcludeSelectWrap.appendChild(customExcludeMenu);
      }
    }
    customExcludeSearchQuery = '';
    if(customExcludeSearch) customExcludeSearch.value = '';
  }catch(e){}
}

function positionCustomExcludeMenu(){
  try{
    if(!customExcludeMenu || !customExcludeTrigger || !customExcludeSelectWrap?.classList.contains('open')) return;
    const viewportPadding = 12;
    const gap = 8;
    const triggerRect = customExcludeTrigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const width = Math.min(triggerRect.width, viewportWidth - viewportPadding * 2);
    const left = Math.max(viewportPadding, Math.min(triggerRect.left, viewportWidth - width - viewportPadding));
    const roomBelow = viewportHeight - triggerRect.bottom - viewportPadding - gap;
    const roomAbove = triggerRect.top - viewportPadding - gap;
    const openAbove = roomBelow < 240 && roomAbove > roomBelow;
    const availableHeight = Math.max(120, Math.min(320, openAbove ? roomAbove : roomBelow));

    customExcludeMenu.style.width = `${Math.round(width)}px`;
    customExcludeMenu.style.left = `${Math.round(left)}px`;
    customExcludeMenu.style.maxHeight = `${Math.round(availableHeight)}px`;
    customExcludeMenu.style.setProperty('--settings-select-options-height', `${Math.max(70, Math.round(availableHeight - 58))}px`);
    if(openAbove){
      customExcludeMenu.style.top = 'auto';
      customExcludeMenu.style.bottom = `${Math.round(viewportHeight - triggerRect.top + gap)}px`;
    }else{
      customExcludeMenu.style.top = `${Math.round(triggerRect.bottom + gap)}px`;
      customExcludeMenu.style.bottom = 'auto';
    }
  }catch(e){}
}

function openCustomExcludeMenu(){
  try{
    if(!customExcludeMenu || !customExcludeSelectWrap || !customExcludeTrigger) return;
    customExcludeSelectWrap.classList.add('open');
    customExcludeTrigger.setAttribute('aria-expanded', 'true');
    customExcludeMenu.setAttribute('aria-hidden', 'false');
    customExcludeMenu.classList.add('is-portaled');
    document.body.appendChild(customExcludeMenu);
    positionCustomExcludeMenu();
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
    return getListedTrackIndices();
  }catch(e){ return []; }
}

function findNextAllowedIndex(fromIndex, dir){
  try{
    const playable = getPlayableIndices();
    if(!playable.length) return 0;
    const stepDir = dir >= 0 ? 1 : -1;
    const rep = _getRepresentativeTrackIndex((typeof fromIndex === 'number') ? fromIndex : playable[0]);
    let pos = playable.indexOf(rep);
    if(pos < 0) pos = 0;
    const nextPos = (pos + stepDir + playable.length) % playable.length;
    return playable[nextPos];
  }catch(e){ return (fromIndex + dir + tracks.length) % tracks.length; }
}

let shuffleQueue = [];
let shuffleCycleFinished = false;
let shuffleHistory = [];
let shuffleForward = [];
// WebAudio gapless loop support
// Seamless WebAudio loop support disabled. Keeping no-op stubs so we can re-enable later if requested.
let audioCtx = null;
const bufferCache = new Map();
const MAX_CACHED_BUFFERS = 3;
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
  // Restore the audio element's WebAudio gain so non-loop playback is audible again.
  try{ if(audioSourceGain) audioSourceGain.gain.setValueAtTime(_getPlayerVolume(), audioCtx ? audioCtx.currentTime : 0); }catch(e){}
  try{ if(audio){ audio.muted = false; audio.loop = false; } }catch(e){}
}
function getWebCurrentTime(){
  try{
    if(webPlaying && webSource && webSource.buffer && audioCtx){
      const buf = webSource.buffer;
      const dur = buf.duration;
      const virtualTime = audioCtx.currentTime - webStartTime;
      // If a custom loop region was set (e.g. Airport intro skip), map virtual time to
      // the real buffer position — accounting for the fact that the loop region is
      // [loopStart, loopEnd] rather than [0, dur].
      if(webSource.loop && webSource.loopStart > 0){
        const ls = webSource.loopStart;
        const le = (webSource.loopEnd > 0 && webSource.loopEnd <= dur) ? webSource.loopEnd : dur;
        const loopLen = le - ls;
        if(loopLen > 0){
          if(virtualTime <= le){
            // Still in the initial pass (includes the intro)
            return Math.max(0, Math.min(virtualTime, le));
          }
          // We are somewhere in a repeated loop cycle
          const loopElapsed = virtualTime - le;
          return ls + (loopElapsed % loopLen);
        }
      }
      // Default: position wraps uniformly across the full buffer
      const pos = virtualTime % dur;
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
    
    // Ensure AudioContext, analyser, createMediaElementSource and audioSourceGain
    // are all initialised before we start the loop. This is required so we can
    // silence the audio element's WebAudio output via audioSourceGain instead of
    // audio.muted (iOS needs muted=false to show the lock-screen/control-center).
    try{ initAudioContext(); }catch(e){}
    try{ _wireAudioCtxStateChange(audioCtx); }catch(e){}
    try{ if(audioCtx && audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') audioCtx.resume(); }catch(e){}
    const buf = bufferCache.get(file);
    if(!buf) return false;
    offset = Math.max(0, Math.min(offset, buf.duration || 0));
    // create source + gain
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    // Custom loop start: skip the intro on tracks that define one.
    const _loopStartSec = _getTrackLoopStart(tracks && tracks[index]);
    if(_loopStartSec > 0){
      src.loopStart = _catalogTimeToMediaTime(_loopStartSec, buf.duration);
      src.loopEnd = buf.duration; // explicit end so loopStart is respected
    }
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
    // Silence the audio element's WebAudio contribution to avoid double-audio,
    // but keep audio.muted = false so iOS shows the lock-screen / control-center widget.
    try{ if(audioSourceGain) audioSourceGain.gain.setValueAtTime(0, audioCtx.currentTime); }catch(e){}
    try{ if(audio){ audio.muted = false; audio.loop = true; } }catch(e){}
    // start at offset at the scheduled time; let it loop indefinitely
    src.start(startTime, offset % buf.duration);
    // Keep <audio> playing and sync its currentTime to the WebAudio offset.
    // iOS uses audio.currentTime to validate scrub positions; if they diverge
    // the lock-screen timeline snaps back when the user releases the scrubber.
    try{ if(audio && audio.src){ audio.currentTime = offset % buf.duration; audio.play().catch(()=>{}); } }catch(e){}
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
  return createShuffleQueue(getPlayableIndices(), current);
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
          const cur = getWebCurrentTime();
          _updateTimingUi(cur, d);
          } else {
            // If no track is loaded, keep the UI in the "No song playing" state.
            const hasSrc = !!(audio && audio.src);
            if(hasSrc) _updateTimingUi(audio.currentTime || 0, audio.duration);
            else {
              if(mRem) mRem.textContent = fmt(0);
              if(miniRem) miniRem.textContent = fmt(0);
            }
            try{
              if(hasSrc){
                const t = tracks[index];
                if(t && trackTitle) trackTitle.textContent = _getDisplayTitle(t);
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

  // restore preferred Floating Ship Symphony version
  try{
    const savedSide = localStorage.getItem(FLOATING_SHIP_SIDE_KEY);
    _setFloatingShipPreferredSide(savedSide || FLOATING_SHIP_SIDE_ORIGINAL, false);
  }catch(e){}

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
      const updateSearchQuery = (source, mirror)=>{
        try{ searchQuery = String(source.value || ''); }catch(e){ searchQuery = ''; }
        try{ if(mirror && mirror.value !== searchQuery) mirror.value = searchQuery; }catch(e){}
        try{ renderList(); }catch(e){}
      };
      searchInput.addEventListener('input', ()=>{ updateSearchQuery(searchInput, floatingSearchInput); });
      if(floatingSearchInput){
        floatingSearchInput.addEventListener('input', ()=>{ updateSearchQuery(floatingSearchInput, searchInput); });
      }

      if(floatingSearchWrap && floatingSearchInput){
        let floatingSearchFrame = 0;
        const closeFloatingSearchAtCatalog = ()=>{
          floatingSearchFrame = 0;
          if(!floatingSearchWrap.classList.contains('open')) return;
          const rect = searchInput.getBoundingClientRect();
          const originalIsVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
          if(!originalIsVisible) return;
          const shouldTransferFocus = document.activeElement === floatingSearchInput;
          floatingSearchWrap.classList.remove('open');
          floatingSearchWrap.setAttribute('aria-hidden','true');
          if(shouldTransferFocus){
            const valueLength = String(floatingSearchInput.value || '').length;
            const selectionStart = Number.isInteger(floatingSearchInput.selectionStart) ? floatingSearchInput.selectionStart : valueLength;
            const selectionEnd = Number.isInteger(floatingSearchInput.selectionEnd) ? floatingSearchInput.selectionEnd : selectionStart;
            const selectionDirection = floatingSearchInput.selectionDirection || 'none';
            searchInput.focus({preventScroll:true});
            try{ searchInput.setSelectionRange(selectionStart, selectionEnd, selectionDirection); }catch(e){}
          }
        };
        const queueFloatingSearchCheck = ()=>{
          if(floatingSearchFrame) return;
          floatingSearchFrame = requestAnimationFrame(closeFloatingSearchAtCatalog);
        };
        window.addEventListener('scroll', queueFloatingSearchCheck, {passive:true});
        window.addEventListener('resize', queueFloatingSearchCheck);
      }
    }
  }catch(e){}

  // Restore and wire the catalog layout before the first track render.
  try{
    const savedLayout = localStorage.getItem(LAYOUT_MODE_KEY);
    setLayoutMode(savedLayout === 'list' ? 'list' : 'grid');
    if(layoutSwitcher){
      layoutSwitcher.addEventListener('click', (ev)=>{
        const option = ev.target.closest('[data-layout]');
        if(!option || !layoutSwitcher.contains(option)) return;
        setLayoutMode(option.dataset.layout, true);
      });
    }
  }catch(e){
    setLayoutMode('grid');
  }

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
    if(saved && (saved === 'all' || saved === 'exclude' || saved === 'only' || saved === 'drums-include' || saved === 'drums-only' || saved === 'custom')){
      currentViewFilter = saved;
      if(currentViewFilter === 'custom' && !isCustomFilterAvailable()) currentViewFilter = 'all';
      window.currentViewFilter = currentViewFilter;
    }
    syncViewDropdownPressed();
  }catch(e){}
  renderList();

  // Restore history before any loadTrack call can schedule a new entry.
  historyController.loadFromStorage();

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
    try{ _updateFloatingShipVersionUI(-1); }catch(e){}
  }catch(e){}

  // If a deep link is present, load that track (but don't autoplay).
  try{
    const url = new URL(window.location.href);
    const songParam = url.searchParams.get('song');
    const idx = findTrackIndexBySongParam(songParam);
    if(idx >= 0){
      loadTrack(idx, {fade:'in', respectFloatingPreference:false});
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

  // Global hotkeys: L = loop toggle, Shift+ArrowRight = next, Shift+ArrowLeft = prev, Ctrl+Arrow = airport section, ? = show shortcuts
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
          if(customExcludeSearch){
            customExcludeSearchQuery = '';
            customExcludeSearch.value = '';
          }
          populateCustomExcludeSelect();
          openCustomExcludeMenu();
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
        ev.stopPropagation();
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
    if(customGroupShareBtn){
      customGroupShareBtn.addEventListener('click', ()=>{ shareActiveCustomGroup(); });
    }
    if(customGroupImportToggleBtn){
      customGroupImportToggleBtn.addEventListener('click', ()=>{
        const isOpen = customGroupImportPanel && !customGroupImportPanel.hidden;
        setGroupImportPanelOpen(!isOpen);
      });
    }
    if(customGroupPreviewBtn){
      customGroupPreviewBtn.addEventListener('click', ()=>{
        previewGroupShareUrl(customGroupImportUrlInput?.value || '');
      });
    }
    if(customGroupImportUrlInput){
      customGroupImportUrlInput.addEventListener('keydown', (ev)=>{
        if(ev.key !== 'Enter') return;
        ev.preventDefault();
        previewGroupShareUrl(customGroupImportUrlInput.value);
      });
    }
    if(customGroupImportConfirmBtn){
      customGroupImportConfirmBtn.addEventListener('click', ()=>{ importPendingSharedGroup(); });
    }
    if(customGroupImportCancelBtn){
      customGroupImportCancelBtn.addEventListener('click', ()=>{ setGroupImportPanelOpen(false); });
    }
    if(customGroupShareUrlInput){
      customGroupShareUrlInput.addEventListener('focus', ()=>{ customGroupShareUrlInput.select(); });
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

    if(mVersionPrev){
      mVersionPrev.addEventListener('click', (ev)=>{
        try{ ev.preventDefault(); ev.stopPropagation(); }catch(e){}
        try{
          const t = (tracks && tracks[index]) ? tracks[index] : null;
          if(_isAirportTrack(t)){ _seekAirportSectionByDelta(-1); return; }
        }catch(e){}
        _applyFloatingShipVersion(FLOATING_SHIP_SIDE_ORIGINAL);
      });
    }
    if(mVersionNext){
      mVersionNext.addEventListener('click', (ev)=>{
        try{ ev.preventDefault(); ev.stopPropagation(); }catch(e){}
        try{
          const t = (tracks && tracks[index]) ? tracks[index] : null;
          if(_isAirportTrack(t)){ _seekAirportSectionByDelta(1); return; }
        }catch(e){}
        _applyFloatingShipVersion(FLOATING_SHIP_SIDE_GAME);
      });
    }
    // Airport info button toggle
    if(mAirportInfo && airportInfoPopover){
      mAirportInfo.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        const open = airportInfoPopover.getAttribute('aria-hidden') === 'false';
        airportInfoPopover.setAttribute('aria-hidden', open ? 'true' : 'false');
        mAirportInfo.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
      // Dismiss when clicking outside the popover
      document.addEventListener('click', (ev)=>{
        if(!airportInfoWrap || airportInfoWrap.contains(ev.target)) return;
        if(airportInfoPopover.getAttribute('aria-hidden') === 'false'){
          airportInfoPopover.setAttribute('aria-hidden', 'true');
          mAirportInfo.setAttribute('aria-expanded', 'false');
        }
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
          const resolvedIndex = _resolveTrackIndexForPlayback(trackIndex);
          if(action === 'play'){
            loadTrack(resolvedIndex, {fade:'in'});
            play();
          } else if(action === 'copyLink'){
            const t = tracks[resolvedIndex];
            const url = getSongShareUrlForTrack(t);
            copyTextToClipboard(url);
          } else if(action === 'download'){
            downloadTrackAt(resolvedIndex);
          }
        }catch(e){ console.warn('Context menu action failed', e); }
      });
    }
    
    // Click anywhere to close context menu (except on the menu itself)
    document.addEventListener('click', (ev)=>{ 
      if(customExcludeSelectWrap && !ev.target.closest('#customExcludeSelectWrap') && !ev.target.closest('#customExcludeMenu')) closeCustomExcludeMenu();
      if(!ev.target.closest('#trackContextMenu')){
        hideContextMenu(); 
      }
    });
    window.addEventListener('resize', positionCustomExcludeMenu);
    window.addEventListener('scroll', positionCustomExcludeMenu, true);
    document.addEventListener('contextmenu', (ev)=>{
      if(!ev.target.closest('.track')){
        hideContextMenu();
      }
    });
    
    document.addEventListener('keydown', (ev)=>{
      const isSearchShortcut = (ev.ctrlKey || ev.metaKey) && !ev.altKey &&
        (ev.code === 'KeyF' || String(ev.key || '').toLowerCase() === 'f');
      if(isSearchShortcut && searchInput){
        try{
          ev.preventDefault();
          ev.stopImmediatePropagation();
          if(waveformActive) toggleWaveform();
          if(modal && !modal.classList.contains('hidden')) closeModal();
          if(settingsModal && settingsModal.getAttribute('aria-hidden') === 'false') toggleSettingsModal(false);
          if(infoModal && infoModal.getAttribute('aria-hidden') === 'false') toggleInfoModal();
          if(keyboardHint && keyboardHint.getAttribute('aria-hidden') === 'false') toggleKeyboardHint();
          const rect = searchInput.getBoundingClientRect();
          const originalIsVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
          if(originalIsVisible || !floatingSearchWrap || !floatingSearchInput){
            if(floatingSearchWrap){
              floatingSearchWrap.classList.remove('open');
              floatingSearchWrap.setAttribute('aria-hidden','true');
            }
            searchInput.focus({preventScroll:true});
            searchInput.select();
          }else{
            floatingSearchInput.value = searchInput.value;
            floatingSearchWrap.classList.add('open');
            floatingSearchWrap.setAttribute('aria-hidden','false');
            floatingSearchInput.focus({preventScroll:true});
            floatingSearchInput.select();
          }
        }catch(e){}
        return;
      }

      if(ev.key === 'Escape' && floatingSearchWrap && floatingSearchWrap.classList.contains('open')){
        try{
          floatingSearchWrap.classList.remove('open');
          floatingSearchWrap.setAttribute('aria-hidden','true');
          if(floatingSearchInput) floatingSearchInput.blur();
          ev.preventDefault();
          ev.stopImmediatePropagation();
        }catch(e){}
        return;
      }

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
        if(waveformActive){
          // Consume Escape at the visualizer layer before modal close can run.
          try{ toggleWaveform(); ev.preventDefault(); ev.stopImmediatePropagation(); }catch(e){}
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
      if(ev.key === 'ArrowRight' && ev.ctrlKey && !ev.shiftKey){
        try{
          const t = (tracks && tracks[index]) ? tracks[index] : null;
          if(_isAirportTrack(t)){ _seekAirportSectionByDelta(1); ev.preventDefault(); }
        }catch(e){}
      }
      if(ev.key === 'ArrowLeft' && ev.ctrlKey && !ev.shiftKey){
        try{
          const t = (tracks && tracks[index]) ? tracks[index] : null;
          if(_isAirportTrack(t)){ _seekAirportSectionByDelta(-1); ev.preventDefault(); }
        }catch(e){}
      }
    });
  }catch(e){}
  handleIncomingGroupShare();
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
      if(mSeek) mSeek.disabled = _isSeekLockedForCurrentTrack();
      if(miniSeek) miniSeek.disabled = _isSeekLockedForCurrentTrack();
      try{ document.body.classList.add('has-track'); }catch(e){}
    }
  }catch(e){}
  try{ preloadAllDurations(); }catch(e){}

}

function updateOSTDuration(){
  try{
    if(!ostDurationEl||!tracks||!tracks.length) return;
    const listedIndices = getListedTrackIndices();
    const effectiveIndices = listedIndices.map((i)=>{
      const base = tracks[i];
      if(!base) return -1;
      if(_isFloatingShipOriginalTrack(base)){
        const prefIndex = _findFloatingShipTrackIndexBySide(floatingShipPreferredSide);
        if(prefIndex >= 0 && tracks[prefIndex]) return prefIndex;
      }
      return i;
    }).filter(i => i >= 0);

    let total = 0;
    let knownCount = 0;
    effectiveIndices.forEach((i)=>{
      const td = trackDurations && typeof trackDurations[i] === 'number' ? trackDurations[i] : 0;
      const baked = tracks[i] && typeof tracks[i].duration === 'number' ? tracks[i].duration : 0;
      const d = td > 0 ? td : (baked > 0 ? baked : 0);
      if(d > 0){
        total += d;
        knownCount++;
      }
    });

    if(!knownCount){
      ostDurationEl.textContent = `-- \u00b7 ${effectiveIndices.length} tracks`;
      ostDurationEl.style.opacity = '0.55';
      return;
    }

    if(total>0){
      ostDurationEl.textContent=`${fmtTotal(total)} \u00b7 ${effectiveIndices.length} tracks`;
      ostDurationEl.style.opacity='0.75';
    }
  }catch(e){}
}
// ── Listen History ─────────────────────────────────────────────────────────

function toggleHistoryPanel(){
  return historyController.toggle();
}

function clearListenHistory(){
  return historyController.clear();
}

// ── End Listen History ───────────────────────────────────────────────────────

function updateTrackCounter(){
  try{
    if(!tracks||!tracks.length) return;
    const listed = getListedTrackIndices();
    if(!listed.length){
      if(mTrackCounter) mTrackCounter.textContent='';
      if(miniTrackCounter) miniTrackCounter.textContent='';
      return;
    }
    const rep = _getRepresentativeTrackIndex(index);
    let pos = listed.indexOf(rep);
    if(pos < 0) pos = 0;
    const text=`Track ${pos+1} of ${listed.length}`;
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
    a.src=encodeURI(_audioFile(tracks[i].file));
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

let gummyStageColorMap = null;

function normalizeTrackAccent(accent){
  const value = typeof accent === 'string' ? accent.trim() : '';
  if(!value) return '';

  const rgbTriplet = value.match(/^(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})$/)
    || value.match(/^rgb\(\s*(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})\s*\)$/i);
  if(rgbTriplet){
    const channels = rgbTriplet.slice(1).map(Number);
    if(channels.every(channel => channel >= 0 && channel <= 255)){
      return `rgb(${channels.join(', ')})`;
    }
    return '';
  }

  try{
    if(window.CSS && typeof window.CSS.supports === 'function' && window.CSS.supports('color', value)){
      return value;
    }
  }catch(e){}
  return '';
}

function getTrackStageAccent(track){
  const customAccent = normalizeTrackAccent(track && track.accent);
  if(customAccent) return customAccent;
  if(!gummyStageColorMap){
    const stageNames = [...new Set((tracks || [])
      .map(item => String((item && (item.stage || item.title)) || 'track'))
      .sort((a, b) => a.localeCompare(b)))];
    gummyStageColorMap = new Map(stageNames.map((stageName, stageIndex)=>{
      const hue = (342 + (stageIndex * 137.508)) % 360;
      const lightness = 64 + ((stageIndex % 3) * 4);
      return [stageName, `hsl(${hue.toFixed(1)}deg 78% ${lightness}%)`];
    }));
  }
  const stageName = String((track && (track.stage || track.title)) || 'track');
  return gummyStageColorMap.get(stageName) || 'hsl(342deg 78% 64%)';
}

function renderList(){
  trackListEl.innerHTML = '';
  const listedIndices = getListedTrackIndices();
  listedIndices.forEach((i, listPosition)=>{
    const baseTrack = tracks[i];
    let displayIndex = i;
    let displayTrack = baseTrack;
    try{
      if(_isFloatingShipOriginalTrack(baseTrack)){
        const prefIndex = _findFloatingShipTrackIndexBySide(floatingShipPreferredSide);
        if(prefIndex >= 0 && tracks[prefIndex]){
          displayIndex = prefIndex;
          displayTrack = tracks[prefIndex];
        }
      }
    }catch(e){}

    // apply search filter (matches across title/artist/stage/side/file)
    try{
      const q = (searchQuery || '').trim().toLowerCase();
      if(q){
        const hay = [displayTrack.title, displayTrack.artist, displayTrack.stage, displayTrack.side, displayTrack.file]
          .filter(Boolean)
          .map(v=>String(v).toLowerCase())
          .join(' ');
        if(!hay.includes(q)) return;
      }
    }catch(e){}

    const el = document.createElement('button');
    el.className = 'track';
    const trackNumber = String(listPosition + 1).padStart(2, '0');
    const stageLabel = [displayTrack.stage, displayTrack.side ? `Side ${displayTrack.side}` : ''].filter(Boolean).join(' / ');
    el.style.setProperty('--track-accent', getTrackStageAccent(displayTrack));
    el.dataset.stage = String(displayTrack.stage || displayTrack.title || 'Track');
    el.innerHTML = `<span class="track-number" aria-hidden="true">${trackNumber}</span><img src="${encodeURI(displayTrack.image)}" alt=""><div class="meta"><div class="title"><span class="title-text">${escapeHtml(displayTrack.title)}</span><span class="track-dur">${trackDurations[displayIndex]?fmt(trackDurations[displayIndex]):''}</span></div><div class="track-meta-line"><span class="track-stage">${escapeHtml(stageLabel)}</span><span class="sub">${escapeHtml(_getDisplayArtist(displayTrack))}</span></div></div><span class="track-meter" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
    if(trackDurations[displayIndex]){
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
        const playIndex = _resolveTrackIndexForPlayback(i);
        if(index === playIndex && audio && audio.src){
          if(!isPlaying) play();
        } else {
          loadTrack(playIndex,{fade:'in'});
          play();
        }
      }catch(e){}
    });
    // clicking the cover image opens the full modal player
    try{
      const img = el.querySelector('img');
      if(img){
        img.addEventListener('click',(ev)=>{ ev.stopPropagation(); try{ openModal(_resolveTrackIndexForPlayback(i)); }catch(e){} });
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
    const activeRep = hasSong ? _getRepresentativeTrackIndex(index) : -1;
    const els = trackListEl.querySelectorAll('.track');
    els.forEach(el=>{
      const ti = parseInt(el.dataset.trackIndex, 10);
      if(hasSong && ti === activeRep){
        el.classList.add('active');
        if(isPlaying) el.classList.add('playing');
        else el.classList.remove('playing');
      } else {
        el.classList.remove('active','playing');
        // Ensure any stale beat-pulse inline styles from a previously active card are cleared.
        try{
          const img = el.querySelector('img');
          if(img){
            img.style.transition = 'transform .24s ease, box-shadow .24s ease';
            img.style.transform = '';
            img.style.boxShadow = '';
          }
        }catch(e){}
      }
    });
  }catch(e){}
}

function ensureActiveTrackVisible(opts={}){
  try{
    if(!trackListEl) return;
    // Only auto-scroll in card view.
    if(modal && !modal.classList.contains('hidden')) return;

    const activeCard = trackListEl.querySelector('.track.active');
    if(!activeCard) return;

    const rect = activeCard.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if(vh <= 0) return;

    // Reserve space occupied by the mini player so cards hidden behind it count as out-of-view.
    let miniOverlap = 0;
    try{
      if(miniPlayer && !miniPlayer.classList.contains('hidden')){
        const m = miniPlayer.getBoundingClientRect();
        if(m.height > 0 && m.top < vh) miniOverlap = Math.max(0, vh - m.top);
      }
    }catch(e){}

    const visibleTop = 80;
    const visibleBottom = Math.max(visibleTop + 40, vh - (20 + miniOverlap));
    if(rect.top >= visibleTop && rect.bottom <= visibleBottom) return;

    const smooth = !(opts && opts.smooth === false);
    const targetTop = (rect.top < visibleTop)
      ? (window.scrollY + rect.top - visibleTop)
      : (window.scrollY + rect.bottom - visibleBottom);
    window.scrollTo({ top: Math.max(0, targetTop), behavior: smooth ? 'smooth' : 'auto' });
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
    trackContextMenu.setAttribute('aria-hidden', 'false');
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
    if(trackContextMenu){
      trackContextMenu.classList.add('hidden');
      trackContextMenu.setAttribute('aria-hidden', 'true');
    }
    contextMenuTrackIndex = -1;
  }catch(e){}
}

function loadTrack(i, opts={fade:'cross'}){
  const resolvedIndex = _resolveTrackIndexForPlayback(i, opts);
  index = resolvedIndex;
  historyController.resetForTrack(index);
  try{ updateTrackActiveState(); }catch(e){}
  try{ requestAnimationFrame(()=>{ try{ ensureActiveTrackVisible({ smooth:true }); }catch(e){} }); }catch(e){}
  const t = tracks[index];
  try{ if(_isFloatingShipVariantTrack(t)) _setFloatingShipPreferredSide(t.side, true); }catch(e){}
  // stop any WebAudio playback when loading a new track to avoid overlap
  try{ if(webPlaying) stopWebLoop(); }catch(e){}
  // always start from the very beginning when loading a track
  let initialSeek = 0;
  if(_isAirportTrack(t) && typeof pendingAirportSeekSeconds === 'number' && isFinite(pendingAirportSeekSeconds) && pendingAirportSeekSeconds >= 0){
    initialSeek = pendingAirportSeekSeconds;
  }
  pendingAirportSeekSeconds = null;
  // initialSeek is expressed in catalog seconds. Do not store it as a native or
  // WebAudio offset; the media duration needed for that conversion arrives later.
  webOffset = 0;
  webOffsetValid = false;
  if(_isAirportTrack(t)){
    const initialSection = _getAirportSectionByTime(initialSeek);
    activeAirportSectionId = initialSection ? initialSection.id : '';
  }else{
    activeAirportSectionId = '';
  }
  _beginNativeMediaLoad(_audioFile(t.file), initialSeek);
  // do not pre-decode here to avoid blocking load; decoding happens when play is requested
  trackTitle.classList.add('track-title-main');
  // For Airport tracks, resolve the correct cover for the initial seek position
  // so all async image fades use the right image from the start.
  const initialCoverImage = (_isAirportTrack(t) && initialSeek >= 0)
    ? (() => { const sec = _getAirportSectionByTime(initialSeek); return (sec && sec.cover) ? sec.cover : t.image; })()
    : t.image;
  coverImg.src = encodeURI(initialCoverImage);
  if(trackArtist) trackArtist.textContent = _getDisplayArtist(t);
  // update modal and mini UI with configurable fade
  const displayTitle = _getDisplayTitle(t);
  trackTitle.textContent = displayTitle;
  if(mTitle) mTitle.textContent = displayTitle;
  if(mArtist) mArtist.textContent = _getDisplayArtist(t);
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
        modalBg.style.backgroundImage = `url('${encodeURI(initialCoverImage)}')`;
        try{ modalBg.style.opacity = 1; }catch(e){}
      }else{
        try{ modalBg.style.transition = 'opacity 320ms ease'; modalBg.style.opacity = 0 }catch(e){}
        modalBg.style.backgroundImage = `url('${encodeURI(initialCoverImage)}')`;
        requestAnimationFrame(()=>{ try{ modalBg.style.opacity = 1 }catch(e){} });
      }
    }
    setImgFade(mCover, encodeURI(initialCoverImage), 320);
    setImgFade(miniCover, encodeURI(initialCoverImage), 320);
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
        bg2.style.backgroundImage = `url('${encodeURI(initialCoverImage)}')`;
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
      img.src = initialCoverImage;
    } else {
      if(modalBg){
        if(isReducedAnimations){
          modalBg.style.backgroundImage = `url('${encodeURI(initialCoverImage)}')`;
          try{ modalBg.style.opacity = 1; }catch(e){}
        }else{
          try{ modalBg.style.opacity = 0 }catch(e){};
          setTimeout(()=>{ modalBg.style.backgroundImage = `url('${encodeURI(initialCoverImage)}')`; try{ modalBg.style.opacity = 1 }catch(e){} }, 220);
        }
      }
    }
    setImgFade(mCover, encodeURI(initialCoverImage));
    setImgFade(miniCover, encodeURI(initialCoverImage));
  }
  if(miniTitle) miniTitle.textContent = displayTitle;
  if(miniArtist) miniArtist.textContent = _getDisplayArtist(t);
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
    const seekLocked = false; // seek is always enabled
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
    if(mSeek) mSeek.disabled = seekLocked;
    if(miniSeek) miniSeek.disabled = seekLocked;
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
  
  try{ updateTrackCounter(); }catch(e){}
  try{ _updateFloatingShipVersionUI(index); }catch(e){}
  try{ _updateSeekChapters(t); }catch(e){}
  try{ _applyAirportSectionState(initialSeek, {force:true, crossfade:false}); }catch(e){}
}


async function _playNativeAudioForCurrentLoad(){
  const token = _mediaLoadToken;
  let playPromise;
  try{
    // Call play immediately so the request remains associated with the user's gesture.
    // Airport audio stays muted until its deferred initial seek is confirmed.
    playPromise = audio.play();
  }catch(e){
    if(token === _mediaLoadToken) _setPlaybackState(false);
    console.warn('audio.play failed', e);
    return false;
  }

  try{
    await Promise.all([_mediaLoadReady, playPromise]);
    if(token !== _mediaLoadToken) return false;
    if(audio.paused) throw new Error('Playback did not enter the playing state');
    _setPlaybackState(true);
    return true;
  }catch(e){
    if(token === _mediaLoadToken){
      try{ audio.pause(); }catch(e2){}
      _setPlaybackState(false);
    }
    if(!e || e.name !== 'AbortError') console.warn('audio.play failed', e);
    return false;
  }
}

async function play(){
  // record history once per track, only when actually playing (not on load/restore)
  try{
    if(tracks[index]){
      const t = tracks[index];
      // Build the entry now but only commit it after 4 seconds of actual listening
      const buildEntry = () => {
        if(_isAirportTrack(t) && activeAirportSectionId){
          const sec = _getAirportSectionById(activeAirportSectionId);
          if(sec) return { title: sec.title||t.title||'', artist: sec.artist||t.artist||'', image: sec.cover||t.image||'', duration: null, stage: t.stage||'', side: t.side||'' };
        }
        return t;
      };
      historyController.schedule(index, buildEntry);
    }
  }catch(e){}
  // if loop (gapless) mode enabled try to use WebAudio for seamless loop
  if(loopMode === 'one'){
    const file = tracks[index] ? _audioFile(tracks[index].file) : null;
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
            _setPlaybackState(true);
            return true;
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
            _setPlaybackState(true);
            return true;
          }
        }
      }catch(e){ setPreloading(false); console.warn('decode/play failed, using fallback', e); }
      // fallback to audio element
      return _playNativeAudioForCurrentLoad();
    }
  }
  // Non-loop mode: stop any web loop and use <audio>
  try{ if(webPlaying) stopWebLoop(); }catch(e){}
  return _playNativeAudioForCurrentLoad();
}

function pause(){
  try{ if(_cancelSafariSeekResume) _cancelSafariSeekResume(); }catch(e){}
  // If WebAudio loop is active, capture its current position and stop it so we can resume later
  try{
    if(webPlaying){
      try{ const pos = getWebCurrentTime(); webOffset = pos; webOffsetValid = true; }catch(e){}
      try{ stopWebLoop(); }catch(e){}
      try{ if(audio) audio.currentTime = webOffset; }catch(e){}
    }
  }catch(e){}
  try{ audio.pause(); }catch(e){}
  _setPlaybackState(false);
}

function setSeekPercent(p){
  try{
    const pct = Math.max(0, Math.min(100, (typeof p === 'number' ? p : parseFloat(p)) || 0));
    const v = pct.toFixed(3) + '%';
    // Range thumbs travel between their left/right edges, while a percentage
    // background spans the input's full width. Offset the fill so it ends at
    // the center of the 16px thumb instead of creeping beneath it near 100%.
    const thumbCenterOffset = 8 - (pct * 0.16);
    const operator = thumbCenterOffset < 0 ? '-' : '+';
    const fill = `calc(${v} ${operator} ${Math.abs(thumbCenterOffset).toFixed(3)}px)`;
    [mSeek, miniSeek].forEach(seek => {
      if(!seek) return;
      seek.style.setProperty('--seek-pct', v);
      seek.style.setProperty('--seek-fill', fill);
    });
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
        historyController.observeLoop({
          trackIndex: index,
          currentTime: cur,
          duration: dur,
          isLooping: loopMode === 'one' && isPlaying && !_audioSeeking,
          track: tracks[index],
        });
      }catch(e){}
      _updateTimingUi(cur, dur);
      try{ updateMediaSessionPosition(false); }catch(e){}
      try{ _applyAirportSectionState(_mediaTimeToCatalogTime(cur, dur), {force:false, crossfade:true}); }catch(e){}
    }
    progressRaf = requestAnimationFrame(step);
  };
  progressRaf = requestAnimationFrame(step);
}

function stopProgress(){
  if(progressRaf){ cancelAnimationFrame(progressRaf); progressRaf = null; }
  historyController.resetLoop();
  try{ updateTrackActiveState(); }catch(e){}
  try{ stopBeatPulse(); }catch(e){}
}

function _togglePlayback(){
  // Native play() can succeed a moment before the async readiness path updates
  // isPlaying. Treat the media element itself as authoritative in that window.
  const actuallyPlaying = isPlaying || webPlaying || !!(audio && !audio.paused);
  actuallyPlaying ? pause() : play();
}

// modal controls only (main player removed)
mPlay.addEventListener('click', _togglePlayback);
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

  // audio.loop only true for loop-one; skip native loop when a custom loop-start is defined
  // (the 'ended' handler handles seeking to the right point in that case).
  try{ audio.loop = (mode === 'one') && (_getTrackLoopStart(tracks && tracks[index]) === 0); }catch(e){}

  _updateLoopUI();
  try{ localStorage.setItem('gb:loop', mode); }catch(e){}

  // leaving loop-one: stop WebAudio and hand back to <audio>
  if(wasOne && mode !== 'one'){
    try{
      if(webPlaying){
        const pos = getWebCurrentTime();
        stopWebLoop();
        try{ audio.currentTime = pos; }catch(e){}
        if(isPlaying){ try{ _playNativeAudioForCurrentLoad(); }catch(e){} }
      }
    }catch(e){}
  }

  // entering loop-one during playback: switch to WebAudio for gapless
  if(mode === 'one'){
    try{
      const t = tracks[index];
      if(!t) return;
      const file = _audioFile(t.file);
      if(webPlaying && webFile === file) return;
      if(isPlaying){
        const cached = bufferCache.get(file);
        if(cached){
          try{
            const ok = switchToWebLoop(file, audio.currentTime || 0);
            if(ok){
              _setPlaybackState(true);
            }
          }catch(e){}
        } else {
          decodeFile(file).then(buf=>{
            try{
              const stillCurrent = tracks[index] && _audioFile(tracks[index].file) === file;
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
      index = findNextAllowedIndex(index, dir);
    }
  } else {
    index = findNextAllowedIndex(index, dir);
  }

  // reset saved web offset when changing tracks
  webOffsetValid = false;
  const targetPlaybackIndex = _resolveTrackIndexForPlayback(index);

  // Stop current WebAudio playback
  try{ if(webPlaying) stopWebLoop(); }catch(e){}

  if(!modal.classList.contains('hidden')){
    loadTrack(targetPlaybackIndex, {fade:'cross'});
  } else {
    loadTrack(targetPlaybackIndex, {fade:'in'});
  }
  play();
}

function clearPlaybackToNoSong(){
  if(_clearingNoSong) return;
  _clearingNoSong = true;
  try{ if(_cancelMediaPreparation) _cancelMediaPreparation(); }catch(e){}
  _mediaLoadToken++;
  _mediaLoadPending = false;
  _mediaLoadSource = '';
  try{ stopProgress(); }catch(e){}
  try{ if(webPlaying) stopWebLoop(); }catch(e){}
  try{ audio.pause(); }catch(e){}
  try{ audio.removeAttribute('src'); audio.load(); }catch(e){}
  _setPlaybackState(false);
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
  try{ _updateFloatingShipVersionUI(-1); }catch(e){}
  try{ activeAirportSectionId = ''; }catch(e){}
  try{ activeAirportSectionImage = ''; }catch(e){}
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
    _updateTimingUi(cur, dur);
    try{ _applyAirportSectionState(_mediaTimeToCatalogTime(cur, dur), {force:false, crossfade:true}); }catch(e){}
  }
});

// keep interpolation state accurate around seeking/pausing
try{
  audio.addEventListener('seeking', ()=>{ _audioSeeking = true; try{ _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = _nowMs(); }catch(e){} });
  audio.addEventListener('seeked', ()=>{ _audioSeeking = false; try{ _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = _nowMs(); }catch(e){} });
  audio.addEventListener('pause', ()=>{
    try{ _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = 0; }catch(e){}
    try{ if(!webPlaying && !_safariSeekResumePending) _setPlaybackState(false); }catch(e){}
    try{
      // Fallback for browsers where ended sequencing is inconsistent:
      // if media is ended and autoplay is off, force no-song reset.
      const dur = Number(audio && audio.duration);
      const cur = Number(audio && audio.currentTime);
      const nearEnd = Number.isFinite(dur) && dur > 0 && Number.isFinite(cur) && cur >= Math.max(0, dur - 0.05);
      const modalOpen = !!(modal && !modal.classList.contains('hidden'));
      if(!_mediaLoadPending && audio && (audio.ended || nearEnd) && !isAutoplayEnabled() && loopMode !== 'one' && !modalOpen){
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
    _updateTimingUi(cur, dur);
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
        try{ _applyAirportSectionState(_mediaTimeToCatalogTime(newOffset, webSource.buffer.duration), {force:true, crossfade:true}); }catch(e){}
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
        try{ _applyAirportSectionState(_mediaTimeToCatalogTime(newOffset, dur), {force:true, crossfade:true}); }catch(e){}
        return;
      }
    }
  }catch(e){}
  // using the audio element for seeking — clear any saved web offset so resume uses audio.currentTime
  webOffsetValid = false;
  if(audio.duration){
    const newOffset = (percent/100)*audio.duration;
    audio.currentTime = newOffset;
    try{ _applyAirportSectionState(_mediaTimeToCatalogTime(newOffset, audio.duration), {force:true, crossfade:true}); }catch(e){}
  }
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
          try{ _applyAirportSectionState(_mediaTimeToCatalogTime(newOffset, webSource.buffer.duration), {force:true, crossfade:true}); }catch(e){}
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
          try{ _applyAirportSectionState(_mediaTimeToCatalogTime(newOffset, dur), {force:true, crossfade:true}); }catch(e){}
          return;
        }
      }
    }catch(e){}
    // clear cached web offset when seeking via audio element
    webOffsetValid = false;
    if(audio.duration){
      const newOffset = (percent/100)*audio.duration;
      audio.currentTime = newOffset;
      try{ _applyAirportSectionState(_mediaTimeToCatalogTime(newOffset, audio.duration), {force:true, crossfade:true}); }catch(e){}
    }
    try{ if(!webPlaying){ _audioTimeBase = audio.currentTime || 0; _audioTimeStamp = _nowMs(); } }catch(e){}
  });
}

const mVolume = document.getElementById('mVolume');
function _getPlayerVolume(){
  try{
    const value = Number(mVolume && mVolume.value);
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.9;
  }catch(e){ return 0.9; }
}

function _setPlayerVolume(value, persist=false){
  const volume = Math.max(0, Math.min(1, Number(value) || 0));
  // Once routed through Web Audio, keep the element at unity and use exactly
  // one gain stage. Otherwise desktop browsers would apply the volume twice.
  try{ audio.volume = audioSourceGain ? 1 : volume; }catch(e){}
  try{
    if(audioSourceGain && !webPlaying){
      const when = audioContext ? audioContext.currentTime : 0;
      audioSourceGain.gain.setValueAtTime(volume, when);
    }
  }catch(e){}
  try{
    if(webGain){
      const when = audioCtx ? audioCtx.currentTime : 0;
      webGain.gain.setValueAtTime(volume, when);
    }
  }catch(e){}
  if(persist){ try{ localStorage.setItem('gb:volume', String(volume)); }catch(e){} }
}

if(mVolume){
  _setPlayerVolume(mVolume.value);
  mVolume.addEventListener('input',()=>{
    // Safari may expose a locked HTMLMediaElement volume. Route through a Web
    // Audio gain node as well, initialized from this user gesture.
    try{ initAudioContext(); }catch(e){}
    try{ if(audioContext && audioContext.state === 'suspended') audioContext.resume().catch(()=>{}); }catch(e){}
    _setPlayerVolume(mVolume.value, true);
  });
}

audio.addEventListener('ended',()=>{
  if(loopMode === 'one'){
    const _ls = _getTrackLoopStart(tracks && tracks[index]);
    try{ audio.currentTime = _catalogTimeToMediaTime(_ls || 0, audio.duration); }catch(e){ try{ audio.currentTime = 0; }catch(e2){} }
    play();
    return;
  }
  try{ stopProgress(); }catch(e){}
  // If autoplay is disabled, stop after the current track
  if(!isAutoplayEnabled()){
    const modalOpen = !!(modal && !modal.classList.contains('hidden'));
    if(modalOpen){
      // In fullscreen, keep current track UI visible; just stop playback state.
      _setPlaybackState(false);
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
    const playable = getPlayableIndices();
    const repIndex = _getRepresentativeTrackIndex(index);
    const atLast = !!(playable && playable.length && repIndex === playable[playable.length - 1]);
    if(atLast && !isShuffling){
      if(loopMode === 'all'){
        // wrap back to first track
        index = playable[0];
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
if(miniPlay){miniPlay.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniPlayer && miniPlayer.classList.contains('no-song')){ return; } }catch(e){} _togglePlayback();});}
if(miniPrev){miniPrev.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniPrev.disabled) return; }catch(e){} skip(-1)});}
if(miniNext){miniNext.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniNext.disabled) return; }catch(e){} skip(1)});}
if(miniCover){miniCover.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniPlayer && miniPlayer.classList.contains('no-song')) return; }catch(e){} openModal(index);});}
if(miniTitle){miniTitle.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniPlayer && miniPlayer.classList.contains('no-song')) return; }catch(e){} openModal(index);});}
if(miniArtist){miniArtist.addEventListener('click',(ev)=>{ev.stopPropagation(); try{ if(miniPlayer && miniPlayer.classList.contains('no-song')) return; }catch(e){} openModal(index);});}

// Download buttons wiring
if(mDownload){ mDownload.addEventListener('click',(ev)=>{ ev.stopPropagation(); try{ if(!tracks || !tracks[index] || !tracks[index].file) return; downloadTrackAt(index); }catch(e){} }); }
if(miniDownload){ miniDownload.addEventListener('click',(ev)=>{ ev.stopPropagation(); try{ if(!tracks || !tracks[index] || !tracks[index].file) return; downloadTrackAt(index); }catch(e){} }); }

// Easter egg: 10 rapid cover clicks
let _eggClickCount = 0;
let _eggClickTimer = null;
let _eggFindCount = 0;
const _EGG_MESSAGES = [
  { emoji:'👀', msg:'ok you found it.', sub:'cool.' },
  { emoji:'🤨', msg:'still clicking?', sub:'there\'s nothing else here.' },
  { emoji:'😐', msg:'what do you want from me', sub:'seriously.' },
  { emoji:'😑', msg:'there is nothing here.', sub:'nothing.' },
  { emoji:'😤', msg:'I\'m serious.', sub:'stop.' },
  { emoji:'🍪', msg:'fine. have a cookie.', sub:'you happy now?' },
  { emoji:'😒', msg:'...you ate the cookie didn\'t you', sub:'of course you did.' },
  { emoji:'🎧', msg:'please just go listen to something', sub:'that\'s literally what this is for... oh wait, maybe you already are' },
  { emoji:'🍖', msg:'ok i\'m calling boneloaf', sub:'i\'ll tell them to delay the next update.' },
  { emoji:'🎵', msg:'...', sub:'...' },
  { emoji:'🫵', msg:'YOU.', sub:'stop.' },
];
let _eggToastEl = null;
let _eggToastTimer = null;
let _whopperActive = false;
function _showWhopper(){
  try{
    _whopperActive = true;
    const W_IMG   = 'images/whopper.png';
    const W_AUDIO = 'music/whopper.ogg'; // OGG primary; Safari swapped to .mp3 via _audioFile at load time
    const W_TITLE = 'Whopper Whopper';
    const W_ARTIST= 'Burger King';

    // 1. Patch all track data so every future loadTrack/renderList call uses whopper values
    if(tracks && tracks.length){
      tracks.forEach(t=>{
        if(!t) return;
        t._origFile   = t._origFile   || t.file;
        t._origImage  = t._origImage  || t.image;
        t._origTitle  = t._origTitle  || t.title;
        t._origArtist = t._origArtist || t.artist;
        t._origStage  = t._origStage  !== undefined ? t._origStage  : t.stage;
        t._origSide   = t._origSide   !== undefined ? t._origSide   : t.side;
        t.file   = W_AUDIO;
        t.image  = W_IMG;
        t.title  = W_TITLE;
        t.artist = W_ARTIST;
        // Keep stage/side on floating-ship game variants so they stay hidden from the list;
        // strip it from everything else to kill Airport sections + version-switcher behaviour.
        const isGameVariant = (String(t._origStage||'').trim() === 'Airship') &&
                              (String(t._origSide ||'').trim().toLowerCase() === 'game');
        if(!isGameVariant){
          t.stage = '';
          t.side  = '';
          if('loopStart' in t) t.loopStart = 0;
          if('loopEnd'   in t) t.loopEnd   = 0;
        }
      });
    }

    // Hide the version-switcher UI (Airport / Floating Ship) permanently
    try{ if(mVersionSwitcher) mVersionSwitcher.style.display = 'none'; }catch(e){}

    // 2. Patch Airport sections so _getDisplayTitle/_getDisplayArtist return whopper values
    try{
      AIRPORT_SECTIONS.forEach(s=>{
        if(!s) return;
        s._origTitle  = s._origTitle  || s.title;
        s._origArtist = s._origArtist || s.artist;
        s._origCover  = s._origCover  || s.cover;
        s.title  = W_TITLE;
        s.artist = W_ARTIST;
        s.cover  = W_IMG;
      });
    }catch(e){}

    // 3. Override body::before background (the site's main blurred bg) via injected style
    try{
      const styleEl = document.createElement('style');
      styleEl.id = 'whopper-bg-override';
      styleEl.textContent = `body::before { background-image: url('${W_IMG}') !important; }`;
      document.head.appendChild(styleEl);
    }catch(e){}

    // helper: skip SVG icons (shuffle, etc.)
    const _isWIcon = s => !s || s.endsWith('.svg') || s.includes('.svg?') || s.startsWith('data:image/svg');

    // 4. Slam every <img> on the page right now (skip SVG icons)
    document.querySelectorAll('img').forEach(img=>{ if(!_isWIcon(img.getAttribute('src'))) img.src = W_IMG; });

    // 5. Force modalBg background-image to whopper
    try{
      const bg1 = document.getElementById('modalBg');
      const bg2 = document.getElementById('modalBg2');
      if(bg1) bg1.style.backgroundImage = `url('${W_IMG}')`;
      if(bg2) bg2.style.backgroundImage = `url('${W_IMG}')`;
    }catch(e){}

    // 6. Update all live text + cover UI elements
    try{ if(trackTitle)  trackTitle.textContent  = W_TITLE;  }catch(e){}
    try{ if(trackArtist) trackArtist.textContent = W_ARTIST; }catch(e){}
    try{ if(mTitle)      mTitle.textContent      = W_TITLE;  }catch(e){}
    try{ if(mArtist)     mArtist.textContent     = W_ARTIST; }catch(e){}
    try{ if(miniTitle)   miniTitle.textContent   = W_TITLE;  }catch(e){}
    try{ if(miniArtist)  miniArtist.textContent  = W_ARTIST; }catch(e){}

    // 7. Re-render the track list immediately (images/names update now)
    try{ renderList(); }catch(e){}

    // 8. Load whopper.mp3's actual duration, then patch trackDurations + tracks[i].duration
    //    and re-render so all per-track durations and the total OST duration reflect whopper
    try{
      const durProbe = new Audio();
      durProbe.preload = 'metadata';
      durProbe.addEventListener('loadedmetadata', ()=>{
        try{
          const wDur = isFinite(durProbe.duration) && durProbe.duration > 0 ? durProbe.duration : 0;
          if(wDur > 0){
            for(let i = 0; i < tracks.length; i++){
              if(tracks[i]) tracks[i].duration = wDur;
              trackDurations[i] = wDur;
            }
            try{ renderList(); }catch(e){}
            try{ updateOSTDuration(); }catch(e){}
          }
        }catch(e){}
      }, { once:true });
      durProbe.src = _audioFile(W_AUDIO);
    }catch(e){}

    // 9. Reload + play current track as whopper audio
    try{
      const wasPlaying = !!isPlaying;
      loadTrack(index, { fade:'cross' });
      if(wasPlaying) setTimeout(()=>{ try{ play(); }catch(e){} }, 400);
    }catch(e){}

    // 9. MutationObserver: catch any img added or whose src gets changed later (skip SVG icons)
    try{
      const obs = new MutationObserver(muts=>{
        muts.forEach(m=>{
          // New nodes
          m.addedNodes.forEach(n=>{
            if(n.nodeName==='IMG' && !_isWIcon(n.getAttribute('src'))){ n.src = W_IMG; }
            if(n.querySelectorAll) n.querySelectorAll('img').forEach(img=>{ if(!_isWIcon(img.getAttribute('src'))) img.src = W_IMG; });
          });
          // Src attribute changed back to something else
          if(m.type==='attributes' && m.target && m.target.nodeName==='IMG'){
            const cur = m.target.getAttribute('src');
            if(!_isWIcon(cur) && cur !== W_IMG && !(cur||'').endsWith(W_IMG)){
              m.target.src = W_IMG;
            }
          }
        });
      });
      obs.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['src'] });
    }catch(e){}
  }catch(e){}
}
function _showEggVideo(opts){
  // opts: { videoSrc, toastEmoji, toastMsg, toastSub, caption }
  try{
    const videoSrc   = opts.videoSrc;
    const toastEmoji = opts.toastEmoji || '🚛';
    const toastMsg   = opts.toastMsg   || '';
    const toastSub   = opts.toastSub   || '';
    const caption      = opts.caption      || '';
    const captionAt    = (typeof opts.captionAt === 'number') ? opts.captionAt : 2;
    // Pause music if playing
    try{ if(isPlaying) pause(); }catch(e){}
    // Bop the cover art
    [coverImg, mCover].forEach(el=>{
      if(!el) return;
      el.classList.remove('cover-bop'); void el.offsetWidth; el.classList.add('cover-bop');
      el.addEventListener('animationend', ()=> el.classList.remove('cover-bop'), { once:true });
    });
    // Dismiss any pending toast
    if(_eggToastEl){ try{ document.body.removeChild(_eggToastEl); }catch(e){} _eggToastEl = null; }
    if(_eggToastTimer){ clearTimeout(_eggToastTimer); _eggToastTimer = null; }
    // Show the intro toast
    const introEl = document.createElement('div');
    introEl.className = 'egg-toast';
    introEl.innerHTML = `<div class="egg-toast__emoji">${toastEmoji}</div><div class="egg-toast__msg">${toastMsg}</div><div class="egg-toast__sub">${toastSub}</div>`;
    document.body.appendChild(introEl);
    _eggToastEl = introEl;
    // Halfway through the toast, enter fullscreen
    setTimeout(()=>{
      try{
        const fsEl = document.documentElement;
        if(fsEl.requestFullscreen) fsEl.requestFullscreen().catch(()=>{});
        else if(fsEl.webkitRequestFullscreen) fsEl.webkitRequestFullscreen();
      }catch(e){}
    }, 900);
    // After 1800ms dismiss toast and start cover expansion
    setTimeout(()=>{
      introEl.classList.add('closing');
      setTimeout(()=>{ try{ document.body.removeChild(introEl); if(_eggToastEl===introEl) _eggToastEl=null; }catch(e){} }, 280);
      // Find best cover element and snapshot its position
      const coverEl = (mCover && mCover.getBoundingClientRect().width > 0) ? mCover : coverImg;
      const rect = coverEl ? coverEl.getBoundingClientRect() : null;
      // Create expanding cover panel that starts at the cover art and fills the screen
      const blast = document.createElement('div');
      if(rect && coverEl && coverEl.src){
        blast.style.cssText = `position:fixed;z-index:9999;pointer-events:none;background:url('${coverEl.src}') center/cover no-repeat #000;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;border-radius:10px;transition:left 420ms cubic-bezier(0.4,0,0.2,1),top 420ms cubic-bezier(0.4,0,0.2,1),width 420ms cubic-bezier(0.4,0,0.2,1),height 420ms cubic-bezier(0.4,0,0.2,1),border-radius 420ms ease;`;
      } else {
        blast.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;background:#000;left:0;top:0;width:100vw;height:100vh;';
      }
      document.body.appendChild(blast);
      // Force layout then animate to fullscreen
      void blast.offsetWidth;
      blast.style.left   = '0';
      blast.style.top    = '0';
      blast.style.width  = '100vw';
      blast.style.height = '100vh';
      blast.style.borderRadius = '0';
      // After cover has finished expanding, fade in video
      setTimeout(()=>{
        const overlay = document.createElement('div');
        overlay.className = 'egg-vid-overlay';
        const vid = document.createElement('video');
        vid.src = videoSrc;
        vid.playsInline = true;
        vid.autoplay = false;
        const txt = document.createElement('div');
        txt.className = 'egg-vid-overlay__text';
        txt.textContent = caption;
        overlay.appendChild(vid);
        overlay.appendChild(txt);
        document.body.appendChild(overlay);
        // Fade in quickly then play
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          overlay.classList.add('visible');
          vid.play().catch(()=>{});
        }));
        // Show caption at ~2 seconds in
        let _hadText = false;
        vid.addEventListener('timeupdate', ()=>{
          if(!_hadText && vid.currentTime >= captionAt){ _hadText = true; txt.classList.add('visible'); }
        });
        // Fade out and clean up when video ends — NO click-to-dismiss
        vid.addEventListener('ended', ()=>{
          overlay.classList.remove('visible');
          try{ document.body.removeChild(blast); }catch(e){}
          setTimeout(()=>{ try{ document.body.removeChild(overlay); }catch(e){} }, 320);
          try{
            if(document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(()=>{});
            else if(document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
          }catch(e){}
        });
      }, 480);
    }, 1800);
  }catch(e){}
}
function _showEggToast(){
  try{
    const _EGG_VIDEOS = [
      { videoSrc:'vids/torture 1.mp4', toastEmoji:'🚛', toastMsg:'alright',       toastSub:'you asked for it.',       caption:'HA! ya like that?',         captionAt:2  },
      { videoSrc:'vids/torture 2.mp4', toastEmoji:'🚛', toastMsg:'seriously??',   toastSub:"you're pretty persistent", caption:'that oughtta do it',        captionAt:1  },
      { videoSrc:'vids/torture 3.mp4', toastEmoji:'🚛', toastMsg:'dude really',   toastSub:'let me just',              caption:"how about THAT?",          captionAt:2  },
      { videoSrc:'vids/torture 4.mp4', toastEmoji:'🚛', toastMsg:'still no??',    toastSub:'fine.',                    caption:'don\'t even think about it',   captionAt:2  },
      { videoSrc:'vids/torture 5.mp4', toastEmoji:'🤏', toastMsg:'are you fr?',   toastSub:"that's the last straw",   caption:'',                           captionAt:99 },
    ];
    const videoThreshold = _EGG_MESSAGES.length; // 11
    const whopperToastIdx = videoThreshold + _EGG_VIDEOS.length;     // 16
    const whopperIdx      = videoThreshold + _EGG_VIDEOS.length + 1; // 17
    if(_eggFindCount === whopperIdx){
      // 18th: whopper mode — no toast, just chaos
      _eggFindCount++;
      _showWhopper();
    } else if(_eggFindCount === whopperToastIdx){
      // 17th: text toast only
      _eggFindCount++;
      if(_eggToastEl){ try{ document.body.removeChild(_eggToastEl); }catch(e){} _eggToastEl = null; }
      if(_eggToastTimer){ clearTimeout(_eggToastTimer); _eggToastTimer = null; }
      const el = document.createElement('div');
      el.className = 'egg-toast';
      el.innerHTML = '<div class="egg-toast__emoji">😵</div><div class="egg-toast__msg">dude</div><div class="egg-toast__sub">what else do you want me to do.</div>';
      document.body.appendChild(el);
      _eggToastEl = el;
      [coverImg, mCover].forEach(img=>{
        if(!img) return;
        img.classList.remove('cover-bop'); void img.offsetWidth; img.classList.add('cover-bop');
        img.addEventListener('animationend', ()=> img.classList.remove('cover-bop'), { once:true });
      });
      _eggToastTimer = setTimeout(()=>{
        if(_eggToastEl === el){
          el.classList.add('closing');
          setTimeout(()=>{ try{ document.body.removeChild(el); if(_eggToastEl===el) _eggToastEl=null; }catch(e){} }, 280);
        }
        _eggToastTimer = null;
      }, 2800);
    } else if(_eggFindCount >= videoThreshold){
      // Video phase — clamp to last video once all are exhausted
      const vidIdx = Math.min(_eggFindCount - videoThreshold, _EGG_VIDEOS.length - 1);
      _eggFindCount++;
      _showEggVideo(_EGG_VIDEOS[vidIdx]);
    } else {
      // Text toast phase
      const msg = _EGG_MESSAGES[_eggFindCount];
      _eggFindCount++;
      // bop the covers
      [coverImg, mCover].forEach(el=>{
        if(!el) return;
        el.classList.remove('cover-bop');
        void el.offsetWidth;
        el.classList.add('cover-bop');
        el.addEventListener('animationend', ()=> el.classList.remove('cover-bop'), { once:true });
      });
      // dismiss existing toast
      if(_eggToastEl){ try{ document.body.removeChild(_eggToastEl); }catch(e){} _eggToastEl = null; }
      if(_eggToastTimer){ clearTimeout(_eggToastTimer); _eggToastTimer = null; }
      const el = document.createElement('div');
      el.className = 'egg-toast';
      el.innerHTML = `<div class="egg-toast__emoji">${msg.emoji}</div><div class="egg-toast__msg">${msg.msg}</div><div class="egg-toast__sub">${msg.sub}</div>`;
      document.body.appendChild(el);
      _eggToastEl = el;
      _eggToastTimer = setTimeout(()=>{
        if(_eggToastEl === el){
          el.classList.add('closing');
          setTimeout(()=>{ try{ document.body.removeChild(el); if(_eggToastEl===el) _eggToastEl=null; }catch(e){} }, 280);
        }
        _eggToastTimer = null;
      }, 2800);
    }
  }catch(e){}
}
function _handleCoverEggClick(){
  try{
    // Don't count clicks while a toast or video is already showing
    if(_eggToastEl) return;
    if(document.querySelector('.egg-vid-overlay')) return;
    _eggClickCount++;
    if(_eggClickTimer) clearTimeout(_eggClickTimer);
    _eggClickTimer = setTimeout(()=>{ _eggClickCount = 0; _eggClickTimer = null; }, 3000);
    if(_eggClickCount >= 10){
      _eggClickCount = 0;
      clearTimeout(_eggClickTimer); _eggClickTimer = null;
      _showEggToast();
    }
  }catch(e){}
}

// prevent hero cover being interactive when no track loaded
if(coverImg){
  coverImg.addEventListener('click',(ev)=>{
    ev.stopPropagation();
    _handleCoverEggClick();
    try{ if(!audio || !audio.src) return; }catch(e){ return; }
    openModal(index);
  });
}
if(mCover){
  mCover.addEventListener('click', ()=>{
    _handleCoverEggClick();
  });
}

function downloadTrackAt(i){
  downloadTrack(tracks[i]);
}

async function downloadAllTracks(){
  return downloadCatalogAsZip(tracks, {
    button: downloadAllBtn,
    label: downloadAllLabel,
  });
}

// keyboard
document.addEventListener('keydown',(e)=>{
  const tag = document.activeElement && document.activeElement.tagName;
  if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  // ignore keyboard controls when no track is loaded
  try{ if(!audio || !audio.src) return; }catch(e){}
  if(e.code === 'Space' || e.key === ' '){
    e.preventDefault();
    _togglePlayback();
    return;
  }
  if(e.code === 'ArrowRight'){
    if(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
    e.preventDefault();
    try{ _seekBySeconds(10, { suppressWaveformInfoFade: true }); }catch(e){}
    return;
  }
  if(e.code === 'ArrowLeft'){
    if(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
    e.preventDefault();
    try{ _seekBySeconds(-10, { suppressWaveformInfoFade: true }); }catch(e){}
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
  if(e.code === 'KeyF' || e.key === 'f' || e.key === 'F'){
    if(e.ctrlKey || e.metaKey || e.altKey){
      return;
    }
    e.preventDefault();
    if(waveformActive){
      return;
    }
    // Toggle fullscreen modal for the current track.
    if(modal.classList.contains('hidden')){
      openModal(index, { autoplay: false });
    }else{
      closeModal();
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

modalBack.addEventListener('click', ()=>{
  // In visualizer mode, back exits the visualizer first.
  if(waveformActive){
    toggleWaveform();
    return;
  }
  closeModal();
});

// Waveform visualization
let waveformActive = false;
let waveformAnimating = false;
let waveformTogglingLocked = false;
let visualizationMode = 'spectrum'; // 'spectrum' or 'waveform'
let audioContext = null;
let analyser = null;
let audioSource = null;
let audioSourceGain = null; // zero-gain node for audioSource; lets us silence the element's WebAudio path without audio.muted=true
let waveformAnimationId = null;
let waveformColors = ['rgba(255, 77, 126, 0.9)', 'rgba(255, 184, 107, 0.9)', 'rgba(126, 77, 255, 0.9)'];
let waveformColorsFrom = null;
let waveformColorsTo = null;
let waveformColorsTransitionStart = 0;
let waveformColorsTransitionDuration = 650;
let waveformLastInfoImage = '';
let spectrumParticles = [];
const PARTICLE_MAX = 60;

function _parseRgbaColor(str){
  try{
    const m = String(str || '').match(/rgba?\(([^)]+)\)/i);
    if(!m) return [255, 255, 255, 0.9];
    const parts = m[1].split(',').map(x=>parseFloat(String(x).trim()));
    const r = Math.max(0, Math.min(255, Math.round(parts[0] || 0)));
    const g = Math.max(0, Math.min(255, Math.round(parts[1] || 0)));
    const b = Math.max(0, Math.min(255, Math.round(parts[2] || 0)));
    const a = (typeof parts[3] === 'number' && isFinite(parts[3])) ? Math.max(0, Math.min(1, parts[3])) : 0.9;
    return [r, g, b, a];
  }catch(e){ return [255, 255, 255, 0.9]; }
}

function _rgbaTupleToString(tuple){
  try{
    const r = Math.max(0, Math.min(255, Math.round(tuple[0] || 0)));
    const g = Math.max(0, Math.min(255, Math.round(tuple[1] || 0)));
    const b = Math.max(0, Math.min(255, Math.round(tuple[2] || 0)));
    const a = (typeof tuple[3] === 'number' && isFinite(tuple[3])) ? Math.max(0, Math.min(1, tuple[3])) : 0.9;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }catch(e){ return 'rgba(255, 255, 255, 0.900)'; }
}

function _normalizeWaveformPalette(colors){
  try{
    let arr = Array.isArray(colors) ? colors.slice(0, 4).filter(Boolean) : [];
    if(arr.length < 2){
      arr = ['rgba(255, 77, 126, 0.9)', 'rgba(255, 184, 107, 0.9)', 'rgba(126, 77, 255, 0.9)'];
    }
    return arr;
  }catch(e){ return ['rgba(255, 77, 126, 0.9)', 'rgba(255, 184, 107, 0.9)', 'rgba(126, 77, 255, 0.9)']; }
}

function _startWaveformColorsTransition(nextColors, durationMs=650){
  try{
    const next = _normalizeWaveformPalette(nextColors);
    const prev = _normalizeWaveformPalette(waveformColors);
    const maxLen = Math.max(prev.length, next.length);
    waveformColorsFrom = Array.from({length:maxLen}, (_,i)=>prev[i] || prev[prev.length-1]);
    waveformColorsTo = Array.from({length:maxLen}, (_,i)=>next[i] || next[next.length-1]);
    waveformColorsTransitionStart = _nowMs();
    waveformColorsTransitionDuration = Math.max(120, Number(durationMs) || 650);
  }catch(e){ waveformColors = _normalizeWaveformPalette(nextColors); }
}

function _stepWaveformColorsTransition(){
  try{
    if(!waveformColorsFrom || !waveformColorsTo) return;
    const elapsed = _nowMs() - waveformColorsTransitionStart;
    const t = Math.max(0, Math.min(1, elapsed / waveformColorsTransitionDuration));
    const mixed = [];
    for(let i=0;i<waveformColorsTo.length;i++){
      const a = _parseRgbaColor(waveformColorsFrom[i] || waveformColorsFrom[waveformColorsFrom.length - 1]);
      const b = _parseRgbaColor(waveformColorsTo[i] || waveformColorsTo[waveformColorsTo.length - 1]);
      mixed.push(_rgbaTupleToString([
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        a[3] + (b[3] - a[3]) * t
      ]));
    }
    waveformColors = mixed;
    if(t >= 1){
      waveformColors = _normalizeWaveformPalette(waveformColorsTo);
      waveformColorsFrom = null;
      waveformColorsTo = null;
    }
  }catch(e){}
}

// Beat-reactive hero art pulse
let beatRaf = null;
let beatEnergy = 0;
let _beatDataArray = null;

function startBeatPulse(){
  if(isReducedAnimations || isLiteMode){
    try{ stopBeatPulse(); }catch(e){}
    return;
  }
  // Ordinary Safari playback stays on the native media pipeline. Routing the
  // element through MediaElementAudioSourceNode makes post-seek audio timing
  // intermittent in WebKit. The explicit waveform view may still opt in.
  if(isSafari() && !waveformActive){
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
    if(miniCover){ miniCover.style.transition = 'transform .26s ease, box-shadow .26s ease, opacity .32s ease'; miniCover.style.transform = ''; miniCover.style.boxShadow = ''; }
    if(mCover){ mCover.style.transition = 'transform .26s ease, box-shadow .26s ease, opacity .32s ease'; mCover.style.transform = ''; mCover.style.boxShadow = ''; }
    try{
      const cardImgs = trackListEl ? trackListEl.querySelectorAll('.track img') : [];
      cardImgs.forEach(cardImg=>{
        if(!cardImg) return;
        cardImg.style.transition = 'transform .24s ease, box-shadow .24s ease';
        cardImg.style.transform = '';
        cardImg.style.boxShadow = '';
      });
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
      
      // Connect audio element to analyser via a controllable gain node.
      // audioSourceGain lets us silence the element's WebAudio contribution
      // (value=0 when BufferSource loop is active) without ever setting
      // audio.muted=true, which would break the iOS lock-screen widget.
      if(!audioSource){
        audioSource = audioContext.createMediaElementSource(audio);
        audioSourceGain = audioContext.createGain();
        audioSourceGain.gain.value = webPlaying ? 0 : _getPlayerVolume();
        audioSource.connect(audioSourceGain);
        audioSourceGain.connect(analyser);
        try{ audio.volume = 1; }catch(e){}
      }

      // Ensure analyser output is connected exactly once.
      try{ analyser.disconnect(); }catch(e){}
      try{ analyser.connect(audioContext.destination); }catch(e){}

      // Wire iOS audio-session state change handler.
      try{ _wireAudioCtxStateChange(audioContext); }catch(e){}

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
    try{ _stepWaveformColorsTransition(); }catch(e){}
    
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

function updateWaveformInfo(imageSrc = null, opts = {}){
  if(!waveformActive) return;
  const forceImageUpdate = !!(opts && opts.forceImageUpdate);
  const forceContentUpdate = !(opts && opts.forceContentUpdate === false);
  const animateContent = !(opts && opts.animateContent === false);
  const colorTransitionMs = (opts && typeof opts.colorTransitionMs === 'number') ? opts.colorTransitionMs : 650;
  
  // Use provided image source or fall back to mCover
  const imgSrc = imageSrc || (mCover && mCover.src);
  
  if(imgSrc){
    const imageChanged = forceImageUpdate || !waveformLastInfoImage || waveformLastInfoImage !== String(imgSrc);
    waveformLastInfoImage = String(imgSrc);
    if(!imageChanged && !forceContentUpdate) return;
    // Preload the new image first
    const img = new Image();
    img.onload = ()=>{
      if(imageChanged) waveformContainer.style.backgroundImage = `url(${imgSrc})`;
      
      // Extract colors immediately after image loads
      const newColors = extractColorsFromImage(img);
      if(newColors && newColors.length >= 2){
        _startWaveformColorsTransition(newColors, colorTransitionMs);
      }
    };
    img.src = imgSrc;
  }
  
  // Check if top info already exists
  let topInfo = waveformContainer.querySelector('.waveform-top-info');
  
  if(topInfo){
    // Update existing content only when it actually changed
    const coverEl = topInfo.querySelector('.waveform-top-info__cover');
    const titleEl = topInfo.querySelector('.waveform-top-info__title');
    const artistEl = topInfo.querySelector('.waveform-top-info__artist');
    const nextCover = String(imgSrc || (mCover && mCover.src) || '');
    const nextTitle = String((mTitle && mTitle.textContent) || '');
    const nextArtist = String((mArtist && mArtist.textContent) || '');
    const curCover = String((coverEl && coverEl.getAttribute('src')) || '');
    const curTitle = String((titleEl && titleEl.textContent) || '');
    const curArtist = String((artistEl && artistEl.textContent) || '');
    const contentChanged = forceContentUpdate || forceImageUpdate || (nextCover !== curCover) || (nextTitle !== curTitle) || (nextArtist !== curArtist);
    if(!contentChanged) return;

    if(!animateContent){
      if(coverEl && nextCover) coverEl.src = nextCover;
      if(titleEl) titleEl.textContent = nextTitle;
      if(artistEl) artistEl.textContent = nextArtist;
      return;
    }
    
    // Fade out
    if(coverEl) coverEl.style.opacity = '0';
    if(titleEl) titleEl.style.opacity = '0';
    if(artistEl) artistEl.style.opacity = '0';
    
    // Update content and fade back in after transition
    setTimeout(()=>{
      if(coverEl && nextCover) coverEl.src = nextCover;
      if(titleEl) titleEl.textContent = nextTitle;
      if(artistEl) artistEl.textContent = nextArtist;
      
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
  const badge = document.querySelector('#changelogToast .changelog-toast__badge');
  const VERSION = (badge && badge.textContent ? badge.textContent.trim().replace(/^v/i, '') : '0');
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

  function getChangelogExpandedMaxHeight(){
    return Math.min((window.innerHeight || 0) * 0.6, 420);
  }

  function shouldShowChangelogScrollbar(){
    if(!body) return false;
    return body.scrollHeight > (getChangelogExpandedMaxHeight() + 1);
  }

  function updateChangelogBodyScrollState(){
    if(!body) return;
    // Keep scrollbar behavior in sync with the current viewport max-height rule.
    const canScroll = shouldShowChangelogScrollbar();
    body.classList.toggle('can-scroll', canScroll);
  }

  body.addEventListener('transitionend', (ev) => {
    if(ev.propertyName !== 'max-height') return;
    updateChangelogBodyScrollState();
  });

  window.addEventListener('resize', () => {
    updateChangelogBodyScrollState();
  });

  toggle.addEventListener('click', () => {
    const opening = !body.classList.contains('open');
    if(opening){
      // Decide before expansion starts so long changelogs keep a visible scrollbar during animation.
      body.classList.toggle('can-scroll', shouldShowChangelogScrollbar());
      body.classList.add('open');
    }else{
      body.classList.remove('open');
    }
    const open = body.classList.contains('open');
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

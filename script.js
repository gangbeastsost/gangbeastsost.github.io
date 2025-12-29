const audio = document.getElementById('audio');
const preloadAllBtn = document.getElementById('preloadAllBtn');
const trackListEl = document.getElementById('trackList');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const coverImg = document.getElementById('coverImg');
const heroArt = document.getElementById('heroArt');

// modal player elements
const modal = document.getElementById('modal');
const modalBg = document.getElementById('modalBg');
const modalBack = document.getElementById('modalBack');
const mCover = document.getElementById('mCover');
const mTitle = document.getElementById('mTitle');
const mArtist = document.getElementById('mArtist');
const mSeek = document.getElementById('mSeek');
const mCur = document.getElementById('mCur');
const mRem = document.getElementById('mRem');
const mPlay = document.getElementById('mPlay');
const mPrev = document.getElementById('mPrev');
const mNext = document.getElementById('mNext');
const mShuffle = document.getElementById('mShuffle');
const mLoop = document.getElementById('mLoop');
// mini player elements
const miniPlayer = document.getElementById('miniPlayer');
const miniCover = document.getElementById('miniCover');
const miniTitle = document.getElementById('miniTitle');
const miniArtist = document.getElementById('miniArtist');
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
const viewBtn = document.getElementById('viewBtn');
const viewDropdown = document.getElementById('viewDropdown');

let tracks = [];
let index = 0;
let isPlaying = false;
let isShuffling = false;
let currentViewFilter = 'all';
window.currentViewFilter = currentViewFilter;
let progressRaf = null;

const OFFICIAL_ARTIST = 'doseone & Bob Larder';

function isTrackAllowedByViewFilter(t){
  try{
    if(!t) return false;
    const artist = (t.artist ? String(t.artist).trim() : '');
    if(currentViewFilter === 'exclude'){
      return artist === OFFICIAL_ARTIST;
    }
    if(currentViewFilter === 'only'){
      return artist !== OFFICIAL_ARTIST;
    }
    return true;
  }catch(e){ return true; }
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

// Decode and cache an audio file into an AudioBuffer for seamless looping
function computeNextIndexForAuto(){
  try{
    if(isShuffling && shuffleQueue && shuffleQueue.length>0) return shuffleQueue[0];
    return findNextAllowedIndex(index, 1);
  }catch(e){ return (index + 1) % tracks.length; }
}

async function decodeFile(file){
  if(!file) return null;
  try{
    if(bufferCache.has(file)) return bufferCache.get(file);
    // lazy-create AudioContext
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const res = await fetch(encodeURI(file));
    const ab = await res.arrayBuffer();
    const buf = await audioCtx.decodeAudioData(ab);
    bufferCache.set(file, buf);
    return buf;
  }catch(e){ console.warn('decodeFile failed', e); return null; }
}

function preloadNextTrack(){
  try{
    const nextIdx = computeNextIndexForAuto();
    if(nextIdx===null || nextIdx===undefined) return;
    nextPreloadedIndex = nextIdx;
    const file = tracks[nextIdx] && tracks[nextIdx].file;
    if(file) decodeFile(file).catch(()=>{});
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
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = bufferCache.get(file);
    if(!buf) return false;
    offset = Math.max(0, Math.min(offset, buf.duration || 0));
    // create source + gain
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = (audio && typeof audio.volume !== 'undefined') ? audio.volume : 1;
    src.connect(gain).connect(audioCtx.destination);
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
    // mute <audio> element only if it was playing to avoid audible overlap when the web source starts
    try{ if(audioIsPlaying && audio){ audio.muted = true; } }catch(e){}
    // start at offset at the scheduled time; let it loop indefinitely
    src.start(startTime, offset % buf.duration);
    // after a short grace period, pause the <audio> element and restore muted state (keep paused)
    try{
      if(audioIsPlaying){
        const toPauseMs = Math.max(30, Math.floor((startDelay + 0.02) * 1000));
        setTimeout(()=>{
          try{ if(audio){ audio.pause(); audio.muted = false; } }catch(e){}
        }, toPauseMs);
      }
    }catch(e){}
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
      // stop progress updates and show preload state
      try{ stopProgress(); }catch(e){}
      // Never render long text here (it overlaps the seek UI). Keep duration at 0:00 while preloading.
      if(mRem) mRem.textContent = fmt(0);
      if(miniRem) miniRem.textContent = fmt(0);
      // Only replace the hero title when a track is already loaded.
      // If nothing is loaded ("No song playing"), keep that text unchanged during preloading.
      try{ if(trackTitle && audio && audio.src) trackTitle.textContent = 'Preloading...'; }catch(e){}
      if(mCur) mCur.textContent = fmt(0);
      if(miniCur) miniCur.textContent = fmt(0);
      try{ if(mSeek) { mSeek.value = 0; } if(miniSeek){ miniSeek.value = 0; } }catch(e){}
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

async function preloadAllTracks(){
  if(!tracks || !tracks.length) return;
  if(!('caches' in window)){
    console.warn('Cache API not available');
    setPreloading(true);
    for(const t of tracks){ await decodeFile(t.file); }
    setPreloading(false);
    try{ localStorage.setItem('gb:preloadAll','1'); }catch(e){}
    return;
  }
  const cacheName = 'gb-preload-cache-v1';
  setPreloading(true);
  try{
    const cache = await caches.open(cacheName);
    for(let i=0;i<tracks.length;i++){
      const t = tracks[i];
      preloadAllBtn && (preloadAllBtn.textContent = `Preloading ${i+1}/${tracks.length}`);
      const url = encodeURI(t.file);
      try{
        // try cache first
        let resp = await cache.match(url);
        if(!resp){
          resp = await fetch(url, {mode:'cors'});
          if(resp && resp.ok) await cache.put(url, resp.clone());
        }
        if(resp){
          const ab = await resp.arrayBuffer();
          if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          try{ const buf = await audioCtx.decodeAudioData(ab.slice(0)); bufferCache.set(t.file, buf); }catch(e){ try{ const buf = await audioCtx.decodeAudioData(ab); bufferCache.set(t.file, buf); }catch(e){ console.warn('decode failed for', t.file, e);} }
        }
      }catch(e){ console.warn('preload failed for', t.file, e); }
    }
    try{ localStorage.setItem('gb:preloadAll','1'); }catch(e){}
  }catch(e){ console.warn('preloadAllTracks failed', e); }
  setPreloading(false);
}

async function clearPreloadAll(){
  try{ setPreloading(true); }catch(e){}
  try{
    if('caches' in window){ const cache = await caches.open('gb-preload-cache-v1'); await caches.delete('gb-preload-cache-v1'); }
    bufferCache.clear();
    try{ localStorage.removeItem('gb:preloadAll'); }catch(e){}
  }catch(e){ console.warn('clearPreloadAll failed', e); }
  try{ setPreloading(false); }catch(e){}
}

async function init(){
  const resp = await fetch('tracks.json');
  tracks = await resp.json();
  // restore saved view filter (persisted across refreshes)
  try{
    const saved = localStorage.getItem('gb:viewFilter');
    if(saved && (saved === 'all' || saved === 'exclude' || saved === 'only')){
      currentViewFilter = saved;
      window.currentViewFilter = saved;
    }
    // if the dropdown exists, update aria-pressed state to match
    try{
      if(viewDropdown){
        viewDropdown.querySelectorAll('.dropdown-item').forEach(d=>{
          const v = d.dataset.value;
          d.setAttribute('aria-pressed', v === currentViewFilter ? 'true' : 'false');
        });
      }
    }catch(e){}
  }catch(e){}
  renderList();
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
  }catch(e){}
  // restore settings
  try{
    const vol = localStorage.getItem('gb:volume');
    if(vol!==null && typeof mVolume !== 'undefined' && mVolume) { mVolume.value = vol; audio.volume = parseFloat(vol); }
    const sh = localStorage.getItem('gb:shuffle');
    if(sh==='1'){ setShuffleState(true); }
    const lp = localStorage.getItem('gb:loop');
    if(lp==='1'){ setLoopState(true); }
    const last = localStorage.getItem('gb:lastIndex');
    // remember last index but do NOT auto-load it on startup — show "No song playing" instead
    if(last!==null){ const li = parseInt(last,10); if(!isNaN(li) && li>=0 && li<tracks.length) { /* lastSaved = li; */ } }
  }catch(e){console.warn('restore settings failed',e)}
  // wire preloadAll button
  try{
    if(preloadAllBtn){
      const preloaded = localStorage.getItem('gb:preloadAll') === '1';
      preloadAllBtn.textContent = preloaded ? 'Clear Preload' : 'Preload All';
      preloadAllBtn.addEventListener('click', async ()=>{
        try{
          preloadAllBtn.disabled = true;
          if(localStorage.getItem('gb:preloadAll') === '1') {
            await clearPreloadAll();
            preloadAllBtn.textContent = 'Preload All';
          } else {
            await preloadAllTracks();
            preloadAllBtn.textContent = 'Clear Preload';
          }
        }catch(e){ console.warn(e); }
        preloadAllBtn.disabled = false;
      });
      // adjust tooltip alignment when hovering/focusing so it won't overflow the viewport
      const adjustTooltipAlignment = ()=>{
        try{
          const rect = preloadAllBtn.getBoundingClientRect();
          // prefer a tooltip max width of ~300; if the button is too close to right edge, align to right
          const tooltipMax = 300;
          if(rect.left + tooltipMax > window.innerWidth - 12){ preloadAllBtn.classList.add('tooltip-right'); }
          else { preloadAllBtn.classList.remove('tooltip-right'); }
        }catch(e){}
      };
      preloadAllBtn.addEventListener('mouseenter', adjustTooltipAlignment);
      preloadAllBtn.addEventListener('focus', adjustTooltipAlignment);
      window.addEventListener('resize', adjustTooltipAlignment);
      // mirror tooltip alignment logic for Download All button
      const adjustDownloadTooltipAlignment = ()=>{
        try{
          if(!downloadAllBtn) return;
          const rect = downloadAllBtn.getBoundingClientRect();
          const tooltipMax = 300;
          if(rect.left + tooltipMax > window.innerWidth - 12){ downloadAllBtn.classList.add('tooltip-right'); }
          else { downloadAllBtn.classList.remove('tooltip-right'); }
        }catch(e){}
      };
      if(downloadAllBtn){ downloadAllBtn.addEventListener('mouseenter', adjustDownloadTooltipAlignment); downloadAllBtn.addEventListener('focus', adjustDownloadTooltipAlignment); }
      // ensure window resize also adjusts Download All tooltip
      window.addEventListener('resize', adjustDownloadTooltipAlignment);
      if(downloadAllBtn){
        downloadAllBtn.addEventListener('click', async ()=>{
          try{ downloadAllBtn.disabled = true; await downloadAllTracks(); }catch(e){ console.warn(e); }
          try{ downloadAllBtn.disabled = false; }catch(e){}
        });
      }
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

          // Global hotkeys: L = loop toggle, Shift+ArrowRight = next, Shift+ArrowLeft = prev
          try{
            document.addEventListener('keydown', (ev)=>{
              // ignore when focused on inputs or editable areas
              const tgt = ev.target || {};
              const tag = (tgt.tagName || '').toUpperCase();
              if(tag === 'INPUT' || tag === 'TEXTAREA' || tgt.isContentEditable) return;
              if(ev.key === 'l' || ev.key === 'L'){
                try{ toggleLoop(); }catch(e){}
              }
              if(ev.key === 'ArrowRight' && ev.shiftKey){
                    try{ if(audio && audio.src) { skip(1); ev.preventDefault(); } }catch(e){}
              }
              if(ev.key === 'ArrowLeft' && ev.shiftKey){
                    try{ if(audio && audio.src) { skip(-1); ev.preventDefault(); } }catch(e){}
              }
            });
          }catch(e){}
    }
  }catch(e){}
  // if preloadAll was previously set, try to restore cached responses into bufferCache
  try{
    const preloaded = localStorage.getItem('gb:preloadAll') === '1';
    if(preloaded && preloadAllBtn){
      // show progressive restore counts and disable the button until all restores complete
      preloadAllBtn.disabled = true;
      let restoredCount = 0;
      const total = tracks.length || 0;
      preloadAllBtn.textContent = `Preloaded ${restoredCount}/${total}`;
      // indicate preloading/restore state in UI (disable seekers etc.)
      try{ setPreloading(true); }catch(e){}
      try{
        if('caches' in window){
          const cache = await caches.open('gb-preload-cache-v1');
          // prioritize a small set to make restore feel instant (current/last + first few)
          const lastSaved = parseInt(localStorage.getItem('gb:lastIndex'),10);
          const priorityIdx = [];
          if(!Number.isNaN(lastSaved) && lastSaved>=0 && lastSaved<tracks.length) priorityIdx.push(lastSaved);
          for(let i=0;i<tracks.length && priorityIdx.length<3;i++){ if(!priorityIdx.includes(i)) priorityIdx.push(i); }
          try{ if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
          // decode priority items immediately and update counter
          for(const i of priorityIdx){
            const t = tracks[i];
            try{
              const url = encodeURI(t.file);
              const resp = await cache.match(url);
              if(resp){
                const ab = await resp.arrayBuffer();
                try{ const buf = await audioCtx.decodeAudioData(ab.slice(0)); bufferCache.set(t.file, buf); }catch(e){ try{ const buf = await audioCtx.decodeAudioData(ab); bufferCache.set(t.file, buf); }catch(e){ console.warn('decode failed during restore priority', t.file, e); } }
                if(bufferCache.has(t.file)){ restoredCount++; preloadAllBtn.textContent = `Preloaded ${restoredCount}/${total}`; }
              }
            }catch(e){ console.warn('restore decode failed for', t.file, e); }
          }
          // schedule background decode of remaining files sequentially to avoid blocking
          const remaining = [];
          for(let i=0;i<tracks.length;i++){ if(!priorityIdx.includes(i)) remaining.push(i); }
          const bgDecode = async (list)=>{
            while(list.length){
              const idx = list.shift();
              try{
                const t = tracks[idx];
                const url = encodeURI(t.file);
                const resp = await cache.match(url);
                if(resp){
                  const ab = await resp.arrayBuffer();
                  try{ const buf = await audioCtx.decodeAudioData(ab.slice(0)); bufferCache.set(t.file, buf); }catch(e){ try{ const buf = await audioCtx.decodeAudioData(ab); bufferCache.set(t.file, buf); }catch(e){ /* swallow */ } }
                  if(bufferCache.has(t.file)){ restoredCount++; preloadAllBtn.textContent = `Preloaded ${restoredCount}/${total}`; }
                }
              }catch(e){ }
              // small spacing between decodes to keep UI responsive
              await new Promise(r=>setTimeout(r, 150));
            }
          };
          // wait for background decode to complete before unblocking UI
          await bgDecode(remaining);
        }
      }catch(e){ console.warn('restore preloadAll failed inner', e); }
      finally{
        // always clear preloading UI state even if something failed
        try{ setPreloading(false); }catch(e){}
        preloadAllBtn.textContent = 'Clear Preload'; preloadAllBtn.disabled = false;
      }
    }
  }catch(e){ console.warn('restore preloadAll failed', e); }
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

}

function renderList(){
  trackListEl.innerHTML = '';
  tracks.forEach((t,i)=>{
    // apply current view filter
    try{
      if(currentViewFilter === 'exclude'){
        // Exclude custom maps: keep only tracks by the official artist
        if(!t.artist || String(t.artist).trim() !== 'doseone & Bob Larder') return;
      } else if(currentViewFilter === 'only'){
        // Only custom maps: show only tracks NOT by the official artist
        if(t.artist && String(t.artist).trim() === 'doseone & Bob Larder') return;
      }
    }catch(e){}

    const el = document.createElement('button');
    el.className = 'track';
    el.innerHTML = `<img src="${encodeURI(t.image)}" alt="cover"><div class="meta"><div class="title">${t.title}</div><div class="sub">${t.artist||''}</div></div>`;
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
}

function loadTrack(i, opts={fade:'cross'}){
  index = i;
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
    try{ el.style.transition = `opacity ${dur}ms ease`; el.style.opacity = 0 }catch(e){}
    const tmp = new Image(); tmp.onload = ()=>{ el.src = src; requestAnimationFrame(()=>{ try{ el.style.opacity = 1 }catch(e){} }); }; tmp.src = src;
  };
  if(opts.fade === 'in'){
    // modal likely just opened; fade background in
    if(modalBg){ try{ modalBg.style.transition = 'opacity 320ms ease'; modalBg.style.opacity = 0 }catch(e){}; modalBg.style.backgroundImage = `url('${encodeURI(t.image)}')`; requestAnimationFrame(()=>{ try{ modalBg.style.opacity = 1 }catch(e){} }); }
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
        try{ bg2.style.transition = 'opacity 260ms ease'; }catch(e){}
        bg2.style.backgroundImage = `url('${encodeURI(t.image)}')`;
        // force frame then fade in
        requestAnimationFrame(()=>{ try{ bg2.style.opacity = 1 }catch(e){} });
        // when transition ends, commit to modalBg and hide bg2
        const onEnd = (ev)=>{ if(ev.target !== bg2) return; try{ bg2.removeEventListener('transitionend', onEnd); _bg2PendingListener = null; modalBg.style.backgroundImage = bg2.style.backgroundImage; bg2.style.opacity = 0 }catch(e){} };
        _bg2PendingListener = onEnd;
        bg2.addEventListener('transitionend', onEnd);
      };
      img.src = t.image;
    } else {
      if(modalBg){ try{ modalBg.style.opacity = 0 }catch(e){}; setTimeout(()=>{ modalBg.style.backgroundImage = `url('${encodeURI(t.image)}')`; try{ modalBg.style.opacity = 1 }catch(e){} }, 220); }
    }
    setImgFade(mCover, encodeURI(t.image));
    setImgFade(miniCover, encodeURI(t.image));
  }
  if(miniTitle) miniTitle.textContent = t.title;
  if(miniArtist) miniArtist.textContent = t.artist||'';
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
  // remove this index from any pending shuffle queue so it won't repeat
  try{ if(shuffleQueue && shuffleQueue.length){ shuffleQueue = shuffleQueue.filter(x=>x!==index); } }catch(e){}
  try{ localStorage.setItem('gb:lastIndex', String(index)); }catch(e){}
}


async function play(){
  // if loop (gapless) mode enabled try to use WebAudio for seamless loop
  if(mLoop && mLoop.classList.contains('active')){
    const file = tracks[index] && tracks[index].file;
    if(file){
            // if decoded already, start web loop immediately (using scheduler)
            try{
            const cached = bufferCache.get(file);
            if(cached){
              const offset = (webOffsetValid ? webOffset : (audio && audio.currentTime ? audio.currentTime : 0));
              const started = switchToWebLoop(file, offset);
              if(started){ isPlaying = true; mPlay.textContent='❚❚'; heroArt.classList.add('playing'); if(miniPlay) miniPlay.textContent='❚❚'; if(miniPlayer) miniPlayer.classList.remove('hidden'); startProgress(); preloadNextTrack(); return; }
            }
          // not decoded yet or cached null — decode first and start via WebAudio to avoid <audio> preloading artifacts
          // ensure any previous web loop is stopped to avoid overlap
          if(webPlaying) stopWebLoop();
          try{
            setPreloading(true);
            const buf = await decodeFile(file);
            setPreloading(false);
            if(buf){
              // start web loop at offset 0 (or current audio.currentTime if set)
              const offset = (webOffsetValid ? webOffset : (audio && audio.currentTime ? audio.currentTime : 0));
              const started = switchToWebLoop(file, offset);
              if(started){ isPlaying = true; mPlay.textContent='❚❚'; heroArt.classList.add('playing'); if(miniPlay) miniPlay.textContent='❚❚'; if(miniPlayer) miniPlayer.classList.remove('hidden'); startProgress(); return; }
            }
            // kicked off — preload next track as well
            preloadNextTrack();
          }catch(e){ setPreloading(false); console.warn('decode/play fallback failed', e); }
          // fallback: play via <audio> if WebAudio start failed
          try{ await audio.play(); }catch(e){}
          // continue with fallback audio playback
          isPlaying=true; mPlay.textContent='❚❚'; heroArt.classList.add('playing'); if(miniPlay) miniPlay.textContent='❚❚'; if(miniPlayer) miniPlayer.classList.remove('hidden'); startProgress();
          return;
      }catch(e){ console.warn('play decode/start failed', e); }
    }
  }
  // fallback: stop any web loop and use <audio>
  try{ if(webPlaying) stopWebLoop(); }catch(e){}
  try{ await audio.play(); }catch(e){ console.warn('audio.play failed', e); }
  isPlaying=true; mPlay.textContent='❚❚'; heroArt.classList.add('playing'); if(miniPlay) miniPlay.textContent='❚❚'; if(miniPlayer) miniPlayer.classList.remove('hidden'); startProgress();
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
}

function startProgress(){
  if(progressRaf) return;
  const step = ()=>{
    // prefer WebAudio timing when an active web loop is running
    const dur = (webPlaying && webSource && webSource.buffer) ? webSource.buffer.duration : audio.duration;
    if(dur && isFinite(dur)){
      const cur = (webPlaying && webSource && webSource.buffer) ? getWebCurrentTime() : audio.currentTime;
      const p = (cur/dur)*100;
      if(mSeek) mSeek.value = p; if(miniSeek) miniSeek.value = p;
      if(mCur) mCur.textContent = fmt(cur);
      if(miniCur) miniCur.textContent = fmt(cur);
      if(mRem) mRem.textContent = (isFinite(dur)? fmt(dur) : '');
      if(miniRem) miniRem.textContent = (isFinite(dur)? fmt(dur) : '');
    }
    progressRaf = requestAnimationFrame(step);
  };
  progressRaf = requestAnimationFrame(step);
}

function stopProgress(){ if(progressRaf){ cancelAnimationFrame(progressRaf); progressRaf = null; } }

// modal controls only (main player removed)
mPlay.addEventListener('click',()=>{isPlaying?pause():play();});
mPrev.addEventListener('click',()=>{skip(-1)});
mNext.addEventListener('click',()=>{skip(1)});

// Shared state helpers for shuffle/loop to sync modal + mini
function setShuffleState(active){
  isShuffling = !!active;
  // if enabling shuffle, ensure loop is disabled
  if(isShuffling){ setLoopState(false); }
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

function setLoopState(active){
  const a = !!active;
  // if enabling loop, ensure shuffle is disabled
  if(a){ setShuffleState(false); }
  if(mLoop) mLoop.classList.toggle('active', a);
  if(miniLoop) miniLoop.classList.toggle('active', a);
  audio.loop = a;
  try{ if(mLoop) mLoop.setAttribute('aria-pressed', a? 'true':'false'); if(miniLoop) miniLoop.setAttribute('aria-pressed', a? 'true':'false'); }catch(e){}
  try{ localStorage.setItem('gb:loop', a?'1':'0') }catch(e){}
  // loop is handled by the <audio> element only while seamless mode is disabled
  try{ audio.loop = a; }catch(e){}
  // when disabling loop, stop any active WebAudio loop and transfer position back to the <audio> element
  if(!a){
    try{
      if(webPlaying){
        const pos = getWebCurrentTime();
        stopWebLoop();
        try{ audio.currentTime = pos; }catch(e){}
        if(isPlaying){ try{ audio.play(); }catch(e){} }
      }
    }catch(e){ }
  }

  // when enabling loop during playback, try to decode and switch to WebAudio for gapless loop
  if(a){
    try{
      const t = tracks[index];
      if(!t) return;
      const file = t.file;
      // if already running via WebAudio, nothing to do
      if(webPlaying && webFile === file) return;
      // if audio is playing, attempt to switch immediately if decoded, otherwise decode in background then switch
      if(isPlaying){
        const cached = bufferCache.get(file);
        if(cached){
          // switch immediately using current audio position
          try{
            const ok = switchToWebLoop(file, audio.currentTime || 0);
            if(ok){
              try{ mPlay.textContent='❚❚'; if(miniPlay) miniPlay.textContent='❚❚'; heroArt.classList.add('playing'); startProgress(); }catch(e){}
            }
          }catch(e){ }
        } else {
          // decode in background and switch when ready (only if still loop active and track unchanged)
          decodeFile(file).then(buf=>{
            try{
              const stillCurrent = tracks[index] && tracks[index].file === file;
              if(buf && a && stillCurrent && isPlaying){
                try{ const ok = switchToWebLoop(file, audio.currentTime || 0); if(ok){ try{ startProgress(); }catch(e){} } }catch(e){}
              }
            }catch(e){}
          }).catch(()=>{});
        }
      }
    }catch(e){ console.warn('setLoopState: background web loop init failed', e); }
  }
}
function toggleLoop(){ setLoopState(!(mLoop && mLoop.classList.contains('active'))); }

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
  try{ if(webPlaying) stopWebLoop(); }catch(e){}
  // if modal is open, perform a crossfade; otherwise just load
  if(!modal.classList.contains('hidden')){
    loadTrack(index, {fade:'cross'});
  } else {
    loadTrack(index, {fade:'in'});
  }
  play();
}

function clearPlaybackToNoSong(){
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
  }catch(e){}
}

audio.addEventListener('timeupdate',()=>{
  // prefer WebAudio timing when web loop active
  const dur = (webPlaying && webSource && webSource.buffer) ? webSource.buffer.duration : audio.duration;
  const cur = (webPlaying && webSource && webSource.buffer) ? getWebCurrentTime() : audio.currentTime;
  if(dur){
    const p = (cur/dur)*100;
    // modal times
    if(mSeek) mSeek.value = p;
    if(miniSeek) miniSeek.value = p;
    if(mCur) mCur.textContent = fmt(cur);
    // main player shows total duration; mini shows total as well
    if(mRem) mRem.textContent = (isFinite(dur) ? fmt(dur) : '');
    if(miniCur) miniCur.textContent = fmt(cur);
    if(miniRem) miniRem.textContent = (isFinite(dur) ? fmt(dur) : '');
  }
});

// When metadata is loaded, initialize seek and time displays so they stay in sync
audio.addEventListener('loadedmetadata', ()=>{
  // use WebAudio buffer duration when available
  const dur = (webPlaying && webSource && webSource.buffer) ? webSource.buffer.duration : audio.duration;
  const cur = (webPlaying && webSource && webSource.buffer) ? getWebCurrentTime() : audio.currentTime;
  if(dur && isFinite(dur)){
    const p = (cur/dur)*100 || 0;
    if(mSeek) mSeek.value = p; if(miniSeek) miniSeek.value = p;
    if(mCur) mCur.textContent = fmt(cur);
    mRem.textContent = fmt(dur);
    if(miniCur) miniCur.textContent = fmt(cur);
    if(miniRem) miniRem.textContent = fmt(dur);
  } else {
    if(mSeek) mSeek.value = 0; if(miniSeek) miniSeek.value = 0;
    if(mCur) mCur.textContent = fmt(0);
    if(mRem) mRem.textContent = '';
    if(miniCur) miniCur.textContent = fmt(0);
    if(miniRem) miniRem.textContent = '';
  }
});

mSeek.addEventListener('input',()=>{
  const percent = mSeek.value;
  try{
      if(webPlaying && webSource && webSource.buffer){
        const newOffset = (percent/100) * webSource.buffer.duration;
        switchToWebLoop(tracks[index].file, newOffset);
      return;
    }
  }catch(e){}
  // using the audio element for seeking — clear any saved web offset so resume uses audio.currentTime
  webOffsetValid = false;
  if(audio.duration){ audio.currentTime = (percent/100)*audio.duration }
});
if(miniSeek){
  miniSeek.addEventListener('input',()=>{
    const percent = miniSeek.value;
      try{
        if(webPlaying && webSource && webSource.buffer){
          const newOffset = (percent/100) * webSource.buffer.duration;
          switchToWebLoop(tracks[index].file, newOffset);
        return;
      }
    }catch(e){}
    // clear cached web offset when seeking via audio element
    webOffsetValid = false;
    if(audio.duration){ audio.currentTime = (percent/100)*audio.duration }
  });
}

const mVolume = document.getElementById('mVolume');
if(mVolume){
  audio.volume = parseFloat(mVolume.value);
  mVolume.addEventListener('input',()=>{ audio.volume = mVolume.value; try{ if(webGain) webGain.gain.value = mVolume.value; }catch(e){} });
}
if(mVolume){ mVolume.addEventListener('input',()=>{ try{ localStorage.setItem('gb:volume', String(mVolume.value)) }catch(e){} }); }

audio.addEventListener('ended',()=>{
  if(mLoop && mLoop.classList.contains('active')){audio.currentTime=0;play();return}
  stopProgress();
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
        if(downloadAllBtn) downloadAllBtn.textContent = `Zipping ${i+1}/${tracks.length}`;
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
    if(downloadAllBtn) downloadAllBtn.textContent = 'Compressing...';
    const outBlob = await zip.generateAsync({type:'blob'}, (meta)=>{ if(downloadAllBtn) downloadAllBtn.textContent = `Compressing ${Math.round(meta.percent)}%`; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(outBlob);
    a.download = 'Gang Beasts OST.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }catch(e){ console.warn('downloadAllTracks failed', e); alert('Download failed'); }
  finally{ if(downloadAllBtn){ downloadAllBtn.disabled = false; downloadAllBtn.textContent = 'Download All'; } }
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
      if(webPlaying && webSource && webSource.buffer){
        const dur = webSource.buffer.duration;
        const cur = getWebCurrentTime();
        const next = Math.min(dur, cur + 10);
        switchToWebLoop(webFile || tracks[index].file, next % dur);
      } else {
        if(audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
      }
    }catch(e){ if(audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); }
    return;
  }
  if(e.code === 'ArrowLeft'){
    e.preventDefault();
    try{
      if(webPlaying && webSource && webSource.buffer){
        const dur = webSource.buffer.duration;
        const cur = getWebCurrentTime();
        const prev = Math.max(0, cur - 10);
        switchToWebLoop(webFile || tracks[index].file, prev % dur);
      } else {
        if(audio.duration) audio.currentTime = Math.max(0, audio.currentTime - 10);
      }
    }catch(e){ if(audio.duration) audio.currentTime = Math.max(0, audio.currentTime - 10); }
    return;
  }
});

// Modal open/close
function openModal(i){
  const t = tracks[i];
  const wasHidden = modal.classList.contains('hidden');
  if(wasHidden){
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    // if different track or no source, load with fade-in; otherwise just fade the modalBg in
    if(index !== i || !audio.src){
      loadTrack(i, {fade:'in'});
      play();
      mPlay.textContent = '❚❚';
    } else {
      // fade in existing background
      if(modalBg){ try{ modalBg.style.transition='opacity 320ms ease'; modalBg.style.opacity = 0 }catch(e){}; setTimeout(()=>{ try{ modalBg.style.opacity = 1 }catch(e){} }, 30); }
      mPlay.textContent = isPlaying ? '❚❚' : '▶';
    }
  } else {
    // modal already open: change track with crossfade unless same track
    if(index !== i || !audio.src){ loadTrack(i, {fade:'cross'}); play(); mPlay.textContent='❚❚'; }
    else { mPlay.textContent = isPlaying ? '❚❚' : '▶'; }
  }
}


function closeModal(){
  // play exit animation then hide
  if(!modal.classList.contains('hidden')){
    modal.classList.add('closing');
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

#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TRACKS_JSON = path.join(ROOT, 'tracks.json');
const MUSIC_DIR = path.join(ROOT, 'music');

const DRUMS_SIDE = 'Drums';
const DRUMS_ARTIST = 'doseone & Bob Larder';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function getDrumsOggFiles() {
  const files = fs.readdirSync(MUSIC_DIR, { withFileTypes: true });
  return files
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((name) => /\.ogg$/i.test(name))
    .filter((name) => /\bDrums\.ogg$/i.test(name));
}

function stripDrumsSuffix(s) {
  return String(s || '').replace(/\s+Drums$/i, '').trim();
}

function fileBaseName(filePath) {
  const p = String(filePath || '').trim();
  return path.basename(p, path.extname(p)).trim();
}

function _norm(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function _titleMatchesSource(title, source) {
  const t = _norm(title);
  const s = _norm(source);
  if (!t || !s) return false;
  return t === s || t.startsWith(`${s} `) || s.startsWith(`${t} `);
}

function findAnchorTrack(tracks, sourceTitle) {
  const source = _norm(sourceTitle);
  if (!source) return null;

  const nonDrums = tracks
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t && !isDrumsTrack(t));

  const directMatches = nonDrums.filter(({ t }) => {
    const byTitle = _titleMatchesSource(t.title, sourceTitle);
    const byFile = _titleMatchesSource(fileBaseName(t.file), sourceTitle);
    return byTitle || byFile;
  });

  // 1) Exact/direct B-side title/file match.
  const directB = directMatches.find(({ t }) => String(t.side || '').trim().toLowerCase() === 'b');
  if (directB) return { index: directB.i, track: directB.t };

  // 2) If we found a direct source track, prefer the B-side within its stage.
  if (directMatches.length > 0) {
    const srcStage = _norm(directMatches[0].t.stage);
    if (srcStage) {
      const stageB = nonDrums.find(({ t }) => _norm(t.stage) === srcStage && String(t.side || '').trim().toLowerCase() === 'b');
      if (stageB) return { index: stageB.i, track: stageB.t };
      const stageAny = nonDrums.find(({ t }) => _norm(t.stage) === srcStage);
      if (stageAny) return { index: stageAny.i, track: stageAny.t };
    }
  }

  // 3) If source title matches a stage name directly, prefer that stage's B-side.
  const stageBByName = nonDrums.find(({ t }) => _norm(t.stage) === source && String(t.side || '').trim().toLowerCase() === 'b');
  if (stageBByName) return { index: stageBByName.i, track: stageBByName.t };
  const stageAnyByName = nonDrums.find(({ t }) => _norm(t.stage) === source);
  if (stageAnyByName) return { index: stageAnyByName.i, track: stageAnyByName.t };

  // 4) Last resort: any direct match.
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    if (!t || isDrumsTrack(t)) continue;
    const byTitle = _titleMatchesSource(t.title, sourceTitle);
    const byFile = _titleMatchesSource(fileBaseName(t.file), sourceTitle);
    if (byTitle || byFile) return { index: i, track: t };
  }
  return null;
}

function findSourceTrack(tracks, sourceTitle) {
  const nonDrums = tracks
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t && !isDrumsTrack(t));

  // Prefer exact title match first, then exact file-base match, then fuzzy match.
  const exactTitle = nonDrums.find(({ t }) => _norm(t.title) === _norm(sourceTitle));
  if (exactTitle) return exactTitle.track || exactTitle.t;
  const exactFile = nonDrums.find(({ t }) => _norm(fileBaseName(t.file)) === _norm(sourceTitle));
  if (exactFile) return exactFile.track || exactFile.t;
  const fuzzy = nonDrums.find(({ t }) => _titleMatchesSource(t.title, sourceTitle) || _titleMatchesSource(fileBaseName(t.file), sourceTitle));
  return fuzzy ? (fuzzy.track || fuzzy.t) : null;
}

function buildDrumsTrack(fileName, existingTrack, sourceTrack, anchorTrack) {
  const baseName = path.basename(fileName, path.extname(fileName)).trim();
  const sourceTitle = stripDrumsSuffix(baseName);
  const fallbackImageBase = (sourceTitle.split(/\s+/)[0] || sourceTitle).trim();
  const metaTrack = sourceTrack || anchorTrack || null;

  const out = {
    title: baseName,
    stage: (metaTrack && metaTrack.stage) ? String(metaTrack.stage) : sourceTitle,
    side: DRUMS_SIDE,
    artist: DRUMS_ARTIST,
    file: `music/${fileName}`,
    image: (metaTrack && metaTrack.image)
      ? String(metaTrack.image)
      : `images/${fallbackImageBase}.png`
  };

  if (existingTrack && typeof existingTrack.duration === 'number' && isFinite(existingTrack.duration) && existingTrack.duration > 0) {
    out.duration = existingTrack.duration;
  }

  return out;
}

function isDrumsTrack(t) {
  if (!t) return false;
  const side = String(t.side || '').trim().toLowerCase();
  const file = String(t.file || '').trim();
  return side === 'drums' || /\bdrums\.ogg$/i.test(file);
}

function hasDuplicate(tracks, nextTrack) {
  const nextFile = String(nextTrack.file || '').trim().toLowerCase();

  return tracks.some((t) => {
    const file = String((t && t.file) || '').trim().toLowerCase();
    return file === nextFile;
  });
}

function main() {
  if (!fs.existsSync(TRACKS_JSON)) {
    console.error('tracks.json not found:', TRACKS_JSON);
    process.exit(1);
  }
  if (!fs.existsSync(MUSIC_DIR)) {
    console.error('music directory not found:', MUSIC_DIR);
    process.exit(1);
  }

  const tracks = readJson(TRACKS_JSON);
  const drumsFiles = getDrumsOggFiles();
  const drumsFilesSorted = drumsFiles.slice().sort((a, b) => a.localeCompare(b));

  const existingByFile = new Map();
  tracks.forEach((t) => {
    const key = String((t && t.file) || '').trim().toLowerCase();
    if (key) existingByFile.set(key, t);
  });

  // Remove existing drums tracks so reruns can place them directly below originals.
  const outTracks = tracks.filter((t) => !isDrumsTrack(t));

  let added = 0;
  let skipped = 0;

  for (const fileName of drumsFilesSorted) {
    const fileKey = `music/${fileName}`.toLowerCase();
    const existing = existingByFile.get(fileKey);
    const sourceTitle = stripDrumsSuffix(path.basename(fileName, path.extname(fileName)).trim());
    const anchor = findAnchorTrack(outTracks, sourceTitle);
    const sourceTrack = findSourceTrack(outTracks, sourceTitle);
    const nextTrack = buildDrumsTrack(fileName, existing, sourceTrack, anchor && anchor.track);
    if (!nextTrack.stage) {
      skipped++;
      continue;
    }
    if (hasDuplicate(outTracks, nextTrack)) {
      skipped++;
      continue;
    }
    const insertAt = anchor ? (anchor.index + 1) : outTracks.length;
    outTracks.splice(insertAt, 0, nextTrack);
    added++;
  }

  writeJson(TRACKS_JSON, outTracks);

  console.log(`Drums files found: ${drumsFilesSorted.length}`);
  console.log(`Added: ${added}`);
  console.log(`Skipped: ${skipped}`);
  console.log('tracks.json updated.');
}

main();

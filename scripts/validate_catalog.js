#!/usr/bin/env node
/**
 * Validate tracks.json, its referenced assets, and generated song share pages.
 *
 * Usage:
 *   node scripts/validate_catalog.js
 *   node scripts/validate_catalog.js --strict
 *
 * Errors always produce a non-zero exit code. Warnings only fail in strict mode.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  AIRPORT_STAGE,
  AIRPORT_DEFAULT_IMAGE,
  AIRPORT_SECTIONS,
} = require('./generate_song_pages');

const ROOT = path.resolve(__dirname, '..');
const TRACKS_PATH = path.join(ROOT, 'tracks.json');
const SONG_DIR = path.join(ROOT, 'song');
const SITE_URL = process.env.SITE_URL || 'https://gangbeastsost.net';
const STRICT = process.argv.includes('--strict');
const HELP = process.argv.includes('--help') || process.argv.includes('-h');
const KNOWN_ARGS = new Set(['--strict', '--help', '-h']);
const REQUIRED_STRING_FIELDS = ['title', 'stage', 'side', 'artist', 'file', 'image'];

const diagnostics = [];

function addDiagnostic(level, code, message) {
  diagnostics.push({ level, code, message });
}

function error(code, message) {
  addDiagnostic('error', code, message);
}

function warn(code, message) {
  addDiagnostic('warning', code, message);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readCatalog() {
  if (!fs.existsSync(TRACKS_PATH)) {
    error('catalog-missing', 'tracks.json does not exist.');
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(TRACKS_PATH, 'utf8'));
    if (!Array.isArray(parsed)) {
      error('catalog-shape', 'tracks.json must contain a top-level array.');
      return null;
    }
    return parsed;
  } catch (cause) {
    error('catalog-json', `tracks.json is not valid JSON: ${cause.message}`);
    return null;
  }
}

function resolveRepoFile(relativePath, context) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) return null;

  const normalized = relativePath.trim().replace(/\\/g, '/');
  if (path.posix.isAbsolute(normalized)) {
    error('asset-path', `${context} uses an absolute path: ${relativePath}`);
    return null;
  }

  const resolved = path.resolve(ROOT, normalized);
  if (resolved === ROOT || !resolved.startsWith(`${ROOT}${path.sep}`)) {
    error('asset-path', `${context} escapes the repository root: ${relativePath}`);
    return null;
  }
  return resolved;
}

function checkFile(relativePath, context) {
  const resolved = resolveRepoFile(relativePath, context);
  if (!resolved) return;

  try {
    if (!fs.statSync(resolved).isFile()) {
      error('asset-not-file', `${context} is not a file: ${relativePath}`);
    }
  } catch (cause) {
    if (cause && cause.code === 'ENOENT') {
      error('asset-missing', `${context} does not exist: ${relativePath}`);
    } else {
      error('asset-read', `Could not inspect ${context} (${relativePath}): ${cause.message}`);
    }
  }
}

function getSongParam(track) {
  const stage = typeof track.stage === 'string' ? track.stage.trim() : '';
  const side = typeof track.side === 'string' ? track.side.trim() : '';
  return stage && side ? `${stage}-${side}` : '';
}

function isSafeSongParam(songParam) {
  return songParam
    && songParam !== '.'
    && songParam !== '..'
    && !/[\\/\0-\x1f\x7f]/.test(songParam);
}

function expectedShareEntries(tracks) {
  const entries = [];

  tracks.forEach((track, index) => {
    const songParam = getSongParam(track);
    if (!songParam) return;
    entries.push({
      songParam,
      title: track.title || songParam,
      artist: track.artist || '',
      source: `track ${index + 1}`,
    });
  });

  AIRPORT_SECTIONS.forEach((section) => {
    entries.push({
      songParam: `${AIRPORT_STAGE}-${section.id}`,
      title: section.title,
      artist: section.artist,
      image: section.cover || AIRPORT_DEFAULT_IMAGE,
      source: `Airport section ${section.id}`,
    });
  });

  return entries;
}

function validateTracks(tracks) {
  const identifiers = new Map();

  tracks.forEach((track, index) => {
    const label = `track ${index + 1}`;
    if (!track || typeof track !== 'object' || Array.isArray(track)) {
      error('track-shape', `${label} must be an object.`);
      return;
    }

    REQUIRED_STRING_FIELDS.forEach((field) => {
      if (typeof track[field] !== 'string' || !track[field].trim()) {
        error('field-required', `${label} has no valid ${field} value.`);
      }
    });

    const songParam = getSongParam(track);
    if (songParam) {
      if (!isSafeSongParam(songParam)) {
        error('share-path-unsafe', `${label} produces an unsafe share path: ${songParam}`);
      }

      const key = songParam.toLocaleLowerCase('en-US');
      if (identifiers.has(key)) {
        error(
          'share-path-duplicate',
          `${label} and ${identifiers.get(key)} produce the same share path: ${songParam}`,
        );
      } else {
        identifiers.set(key, label);
      }
    }

    if (typeof track.file === 'string' && track.file.trim()) {
      checkFile(track.file, `${label} audio`);

      if (/\.ogg$/i.test(track.file.trim())) {
        const mp3Path = track.file.trim().replace(/^(music\/)(.+)\.ogg$/i, '$1mp3/$2.mp3');
        if (mp3Path === track.file.trim()) {
          error(
            'audio-path-layout',
            `${label} OGG path cannot be mapped to Safari MP3 layout: ${track.file}`,
          );
        } else {
          checkFile(mp3Path, `${label} Safari MP3`);
        }
      } else {
        warn('audio-format', `${label} does not reference an OGG file: ${track.file}`);
      }
    }

    if (typeof track.image === 'string' && track.image.trim()) {
      checkFile(track.image, `${label} cover`);
    }

    if (!Object.prototype.hasOwnProperty.call(track, 'duration')) {
      warn('duration-missing', `${label} (${track.title || 'untitled'}) has no baked duration.`);
    } else if (
      typeof track.duration !== 'number'
      || !Number.isFinite(track.duration)
      || track.duration <= 0
    ) {
      error('duration-invalid', `${label} has an invalid duration: ${String(track.duration)}`);
    }
  });
}

function extractMetaContent(html, property) {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<meta\\s+property=["']${escapedProperty}["']\\s+content=["']([^"']*)["']\\s*\\/?\\s*>`,
    'i',
  );
  const match = html.match(pattern);
  return match ? match[1] : null;
}

function validateSharePage(entry) {
  const pagePath = path.join(SONG_DIR, entry.songParam, 'index.html');
  const displayPath = `song/${entry.songParam}/index.html`;
  let html;

  try {
    html = fs.readFileSync(pagePath, 'utf8');
  } catch (cause) {
    if (cause && cause.code === 'ENOENT') {
      error('share-page-missing', `${entry.source} is missing ${displayPath}.`);
    } else {
      error('share-page-read', `Could not read ${displayPath}: ${cause.message}`);
    }
    return;
  }

  const expectedTitle = escapeHtml(entry.title);
  const expectedArtist = escapeHtml(entry.artist);
  const expectedUrl = `${SITE_URL}/song/${encodeURIComponent(entry.songParam)}/`;
  const ogTitle = extractMetaContent(html, 'og:title');
  const ogDescription = extractMetaContent(html, 'og:description');
  const ogUrl = extractMetaContent(html, 'og:url');
  const ogImage = extractMetaContent(html, 'og:image');

  if (ogTitle !== expectedTitle) {
    error('share-page-title', `${displayPath} has stale or missing OpenGraph title metadata.`);
  }
  if (ogDescription !== expectedArtist) {
    error('share-page-description', `${displayPath} has stale or missing OpenGraph artist metadata.`);
  }
  if (ogUrl !== expectedUrl) {
    error('share-page-url', `${displayPath} has stale or missing OpenGraph URL metadata.`);
  }

  const expectedQuery = `/?song=${encodeURIComponent(entry.songParam)}`;
  if (!html.includes(expectedQuery)) {
    error('share-page-redirect', `${displayPath} does not redirect to ${expectedQuery}.`);
  }

  if (!ogImage) {
    error('share-page-image', `${displayPath} has no OpenGraph image.`);
  } else if (ogImage.startsWith(`${SITE_URL}/`)) {
    const relativeImage = ogImage.slice(SITE_URL.length + 1);
    checkFile(relativeImage, `${displayPath} OpenGraph image`);
  } else {
    warn('share-page-image-host', `${displayPath} uses an unexpected OpenGraph image host: ${ogImage}`);
  }
}

function validateSharePages(entries) {
  const expectedNames = new Set();

  entries.forEach((entry) => {
    const key = entry.songParam.toLocaleLowerCase('en-US');
    if (expectedNames.has(key)) {
      error('share-page-duplicate', `Multiple entries expect the share page ${entry.songParam}.`);
      return;
    }
    expectedNames.add(key);
    validateSharePage(entry);
  });

  let actualDirectories = [];
  try {
    actualDirectories = fs.readdirSync(SONG_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (cause) {
    error('share-directory-read', `Could not inspect song/: ${cause.message}`);
    return;
  }

  actualDirectories.forEach((directory) => {
    if (!expectedNames.has(directory.toLocaleLowerCase('en-US'))) {
      warn('share-page-extra', `song/${directory}/ is not produced by the current catalog.`);
    }
  });
}

function printHelp() {
  console.log('Usage: node scripts/validate_catalog.js [--strict]');
  console.log('');
  console.log('  --strict  Treat warnings as failures.');
}

function printResults(trackCount, sharePageCount) {
  console.log('Gang Beasts OST catalog validation');
  console.log(`Tracks checked: ${trackCount}`);
  console.log(`Share pages expected: ${sharePageCount}`);
  console.log('');

  diagnostics.forEach((diagnostic) => {
    const prefix = diagnostic.level === 'error' ? 'ERROR' : 'WARN ';
    console.log(`${prefix} [${diagnostic.code}] ${diagnostic.message}`);
  });

  const errors = diagnostics.filter((item) => item.level === 'error').length;
  const warnings = diagnostics.filter((item) => item.level === 'warning').length;
  if (diagnostics.length) console.log('');
  console.log(`Summary: ${errors} error(s), ${warnings} warning(s).`);

  if (errors === 0 && (!STRICT || warnings === 0)) {
    console.log(warnings ? 'Catalog is valid with warnings.' : 'Catalog is valid.');
  } else if (errors === 0) {
    console.log('Strict validation failed because warnings were found.');
  } else {
    console.log('Catalog validation failed.');
  }

  return errors > 0 || (STRICT && warnings > 0) ? 1 : 0;
}

function main() {
  if (HELP) {
    printHelp();
    return 0;
  }

  const unknownArgs = process.argv.slice(2).filter((arg) => !KNOWN_ARGS.has(arg));
  if (unknownArgs.length) {
    console.error(`Unknown argument(s): ${unknownArgs.join(', ')}`);
    printHelp();
    return 2;
  }

  const tracks = readCatalog();
  if (!tracks) return printResults(0, 0);

  validateTracks(tracks);
  const shareEntries = expectedShareEntries(tracks);
  validateSharePages(shareEntries);
  return printResults(tracks.length, shareEntries.length);
}

process.exitCode = main();

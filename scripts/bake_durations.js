#!/usr/bin/env node
/**
 * bake_durations.js
 * 
 * Reads every MP3 in tracks.json, measures its duration with a pure-Node
 * MPEG-frame parser (no npm packages required), and writes a `duration`
 * field (seconds, rounded to 1 decimal) back into tracks.json.
 *
 * Usage:
 *   node scripts/bake_durations.js
 *
 * Re-run any time you add or replace tracks.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const TRACKS_JSON = path.join(ROOT, 'tracks.json');

// ---------------------------------------------------------------------------
// Pure-Node MP3 duration parser (CBR + VBR via Xing/Info/VBRI headers)
// Supports MPEG-1 and MPEG-2 Layer III.
// ---------------------------------------------------------------------------

const BITRATE_TABLE = {
  // [mpeg_version][layer][index]  (index 0 = free, 15 = bad)
  // mpeg_version: 1 = MPEG1, 2 = MPEG2/2.5
  1: {
    1: [0,32,64,96,128,160,192,224,256,288,320,352,384,416,448],
    2: [0,32,48,56, 64, 80, 96,112,128,160,192,224,256,320,384],
    3: [0,32,40,48, 56, 64, 80, 96,112,128,160,192,224,256,320],
  },
  2: {
    1: [0,32,48,56, 64, 80, 96,112,128,144,160,176,192,224,256],
    2: [0, 8,16,24, 32, 40, 48, 56, 64, 80, 96,112,128,144,160],
    3: [0, 8,16,24, 32, 40, 48, 56, 64, 80, 96,112,128,144,160],
  },
};

const SAMPLE_RATE_TABLE = {
  1: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  3: [11025, 12000,  8000],
};

const SAMPLES_PER_FRAME = {
  1: { 1: 384, 2: 1152, 3: 1152 },
  2: { 1: 384, 2: 1152, 3:  576 },
  3: { 1: 384, 2: 1152, 3:  576 },
};

function getMp3Duration(buf) {
  let offset = 0;

  // --- Skip ID3v2 tag ---
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) { // "ID3"
    const flags  = buf[5];
    const syncsafe = ((buf[6]&0x7F)<<21)|((buf[7]&0x7F)<<14)|((buf[8]&0x7F)<<7)|(buf[9]&0x7F);
    offset = 10 + syncsafe;
    if (flags & 0x10) offset += 10; // footer present
  }

  // --- Find first valid sync word ---
  const limit = Math.min(buf.length - 4, offset + 131072); // search first 128 KB
  while (offset < limit) {
    if (buf[offset] === 0xFF && (buf[offset + 1] & 0xE0) === 0xE0) {
      // Quick sanity: layer != 0, bitrate != 0xFF, sr != 0x3
      const b1 = buf[offset + 1];
      const b2 = buf[offset + 2];
      const layer = (b1 >> 1) & 0x3;
      const brIdx = (b2 >> 4) & 0xF;
      const srIdx = (b2 >> 2) & 0x3;
      if (layer !== 0 && brIdx !== 0xF && brIdx !== 0 && srIdx !== 3) break;
    }
    offset++;
  }
  if (offset >= limit) return null;

  // --- Parse first frame header ---
  const b0 = buf[offset];
  const b1 = buf[offset + 1];
  const b2 = buf[offset + 2];
  const b3 = buf[offset + 3];

  // MPEG version: bits 19-20
  const versionBits = (b1 >> 3) & 0x3;
  // 0=MPEG2.5, 1=reserved, 2=MPEG2, 3=MPEG1
  const mpegVer = versionBits === 3 ? 1 : versionBits === 2 ? 2 : versionBits === 0 ? 3 : null;
  if (!mpegVer) return null;

  const layerBits = (b1 >> 1) & 0x3;  // 1=L3, 2=L2, 3=L1
  const layer = 4 - layerBits;         // convert to 1/2/3
  if (layer < 1 || layer > 3) return null;

  const brIdx = (b2 >> 4) & 0xF;
  const srIdx = (b2 >> 2) & 0x3;
  const padding = (b2 >> 1) & 0x1;
  const channelMode = (b3 >> 6) & 0x3; // 3 = mono

  const verKey = mpegVer === 1 ? 1 : 2;
  const brRow  = (BITRATE_TABLE[verKey] || {})[layer];
  if (!brRow) return null;
  const bitrate = brRow[brIdx] * 1000;

  const srRow = SAMPLE_RATE_TABLE[mpegVer];
  if (!srRow) return null;
  const sampleRate = srRow[srIdx];

  if (!bitrate || !sampleRate) return null;

  const spf = (SAMPLES_PER_FRAME[mpegVer] || {})[layer];
  if (!spf) return null;

  // Side-info size for Layer 3 (determines Xing/Info header location)
  const sideInfoSize = layer === 3
    ? (channelMode === 3 ? (mpegVer === 1 ? 17 : 9) : (mpegVer === 1 ? 32 : 17))
    : 0;

  // Frame size in bytes
  const frameBytes = layer === 1
    ? Math.floor(12 * bitrate / sampleRate + padding) * 4
    : Math.floor(144 * bitrate / sampleRate) + padding;

  // --- Check for Xing / Info VBR header ---
  if (layer === 3) {
    const xOff = offset + 4 + sideInfoSize;
    if (xOff + 8 < buf.length) {
      const tag = buf.slice(xOff, xOff + 4).toString('latin1');
      if (tag === 'Xing' || tag === 'Info') {
        const flags = (buf[xOff+4]<<24)|(buf[xOff+5]<<16)|(buf[xOff+6]<<8)|buf[xOff+7];
        if (flags & 0x1) {
          const totalFrames = (buf[xOff+8]<<24)|(buf[xOff+9]<<16)|(buf[xOff+10]<<8)|buf[xOff+11];
          if (totalFrames > 0) return (totalFrames * spf) / sampleRate;
        }
      }

      // VBRI header (Fraunhofer encoder; always at offset+36)
      const vbriOff = offset + 36;
      if (vbriOff + 26 < buf.length) {
        const vtag = buf.slice(vbriOff, vbriOff + 4).toString('latin1');
        if (vtag === 'VBRI') {
          const totalFrames = (buf[vbriOff+14]<<24)|(buf[vbriOff+15]<<16)|
                              (buf[vbriOff+16]<<8)|buf[vbriOff+17];
          if (totalFrames > 0) return (totalFrames * spf) / sampleRate;
        }
      }
    }
  }

  // --- CBR fallback: estimate from file size ---
  if (frameBytes <= 0) return null;
  const dataSize = buf.length - offset;
  const numFrames = dataSize / frameBytes;
  return (numFrames * spf) / sampleRate;
}

// ---------------------------------------------------------------------------
// Pure-Node OGG Vorbis duration parser
// Reads the sample rate from the Vorbis ID header (first page) then scans
// the tail of the file for the highest granule position.
// ---------------------------------------------------------------------------

function getOggDuration(buf) {
  // Verify OGG capture pattern
  if (buf.length < 27 ||
      buf[0] !== 0x4F || buf[1] !== 0x67 ||
      buf[2] !== 0x67 || buf[3] !== 0x53) return null;

  // ── 1. Extract Vorbis sample rate from the identification header ──────────
  let sampleRate = 0;
  {
    let pos = 0;
    for (let attempt = 0; attempt < 8 && pos + 27 <= buf.length; attempt++) {
      if (buf[pos]   !== 0x4F || buf[pos+1] !== 0x67 ||
          buf[pos+2] !== 0x67 || buf[pos+3] !== 0x53) break;
      const numSegs = buf[pos + 26];
      if (pos + 27 + numSegs > buf.length) break;
      let dataLen = 0;
      for (let s = 0; s < numSegs; s++) dataLen += buf[pos + 27 + s];
      const d = pos + 27 + numSegs; // start of first packet in page
      // Vorbis ID header: type byte 0x01 + ascii "vorbis"
      if (d + 16 <= buf.length &&
          buf[d]   === 0x01 &&
          buf[d+1] === 0x76 && buf[d+2] === 0x6F && buf[d+3] === 0x72 &&
          buf[d+4] === 0x62 && buf[d+5] === 0x69 && buf[d+6] === 0x73) {
        sampleRate = buf.readUInt32LE(d + 12); // after type(1)+"vorbis"(6)+version(4)+channels(1)
        break;
      }
      pos = d + dataLen;
    }
  }
  if (!sampleRate) return null;

  // ── 2. Scan the tail for the highest valid granule position ───────────────
  const tailStart = Math.max(0, buf.length - 65536);
  let maxGranule = 0n;

  for (let i = tailStart; i <= buf.length - 27; i++) {
    if (buf[i]   !== 0x4F || buf[i+1] !== 0x67 ||
        buf[i+2] !== 0x67 || buf[i+3] !== 0x53) continue;
    if (buf[i + 4] !== 0) continue; // OGG version must be 0
    const numSegs = buf[i + 26];
    if (i + 27 + numSegs > buf.length) continue;
    // Granule position: 64-bit little-endian at offset 6 in the page header
    const lo = buf.readUInt32LE(i + 6);
    const hi = buf.readUInt32LE(i + 10);
    if (lo === 0xFFFFFFFF && hi === 0xFFFFFFFF) continue; // −1 sentinel = no position
    const granule = (BigInt(hi) << 32n) | BigInt(lo >>> 0);
    if (granule > maxGranule) maxGranule = granule;
    // Skip to the next page to avoid false-matches inside packet data
    let pageDataLen = 0;
    for (let s = 0; s < numSegs; s++) pageDataLen += buf[i + 27 + s];
    i += 27 + numSegs + pageDataLen - 1; // -1 because loop does i++
  }

  if (maxGranule === 0n) return null;
  return Number(maxGranule) / sampleRate;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!fs.existsSync(TRACKS_JSON)) {
    console.error('tracks.json not found at', TRACKS_JSON);
    process.exit(1);
  }

  const tracks = JSON.parse(fs.readFileSync(TRACKS_JSON, 'utf8'));
  console.log(`Processing ${tracks.length} tracks…\n`);

  let updated = 0;
  let skipped = 0;
  let failed  = 0;

  for (let i = 0; i < tracks.length; i++) {
    const t        = tracks[i];
    const filePath = path.join(ROOT, t.file);
    const label    = `[${String(i + 1).padStart(3)}/${tracks.length}] ${t.title}`;

    if (!fs.existsSync(filePath)) {
      console.warn(`  MISSING  ${label}`);
      failed++;
      continue;
    }

    try {
      const buf = fs.readFileSync(filePath);
      const ext = path.extname(t.file).toLowerCase();
      const dur = (ext === '.ogg' || ext === '.oga') ? getOggDuration(buf) : getMp3Duration(buf);

      if (typeof dur === 'number' && isFinite(dur) && dur > 0) {
        tracks[i].duration = Math.round(dur * 10) / 10;
        updated++;
        process.stdout.write(`  OK  ${label} — ${tracks[i].duration}s\n`);
      } else {
        console.warn(`  FAIL ${label} — could not parse duration`);
        failed++;
      }
    } catch (e) {
      console.warn(`  ERR  ${label} — ${e.message}`);
      failed++;
    }
  }

  fs.writeFileSync(TRACKS_JSON, JSON.stringify(tracks, null, 2) + '\n');

  console.log(`\n─────────────────────────────────`);
  console.log(`Updated : ${updated}`);
  console.log(`Skipped : ${skipped}`);
  console.log(`Failed  : ${failed}`);
  console.log(`tracks.json written.`);
}

main().catch(e => { console.error(e); process.exit(1); });

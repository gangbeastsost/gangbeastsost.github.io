const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const tracksPath = path.join(root, 'tracks.json');
const outDir = path.join(root, 'song');
const ogImagesDir = path.join(root, 'images', 'og');

// Used to build absolute OG urls (recommended for Discord). Keep in sync with your Pages domain.
const SITE_URL = process.env.SITE_URL || 'https://gangbeastsost.net';

const OG_SQUARE_SIZE = 300;

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function _psQuote(s){
  return `'${String(s).replace(/'/g, "''")}'`;
}

function ensureSquareOgImage(imageRel) {
  try {
    if (!imageRel) return null;
    const rel = String(imageRel).replace(/^\/+/, '');
    const srcAbs = path.join(root, rel);
    if (!fs.existsSync(srcAbs)) return null;

    const ext = path.extname(rel);
    const base = path.basename(rel, ext);
    const safeBase = base.replace(/[^a-z0-9_-]+/gi, '-');
    const outRel = `images/og/${safeBase}-${OG_SQUARE_SIZE}.png`;
    const outAbs = path.join(root, outRel);

    ensureDir(ogImagesDir);

    // Skip if already generated and up-to-date.
    try {
      if (fs.existsSync(outAbs)) {
        const srcStat = fs.statSync(srcAbs);
        const outStat = fs.statSync(outAbs);
        if (outStat.mtimeMs >= srcStat.mtimeMs) {
          return { outRel, width: OG_SQUARE_SIZE, height: OG_SQUARE_SIZE };
        }
      }
    } catch (e) {}

    // Windows-only crop via PowerShell + System.Drawing (keeps repo dependency-free).
    if (process.platform !== 'win32') {
      return { outRel: rel, width: null, height: null };
    }

    const ps = [
      'Add-Type -AssemblyName System.Drawing;',
      `$src=${_psQuote(srcAbs)};`,
      `$dst=${_psQuote(outAbs)};`,
      `$img=[System.Drawing.Image]::FromFile($src);`,
      '$size=[Math]::Min($img.Width,$img.Height);',
      '$x=[Math]::Floor(($img.Width-$size)/2);',
      '$y=[Math]::Floor(($img.Height-$size)/2);',
      `$out=${OG_SQUARE_SIZE};`,
      '$bmp = New-Object System.Drawing.Bitmap $out,$out;',
      '$g=[System.Drawing.Graphics]::FromImage($bmp);',
      '$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;',
      '$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::HighQuality;',
      '$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality;',
      '$dstRect = New-Object System.Drawing.Rectangle 0,0,$out,$out;',
      '$srcRect = New-Object System.Drawing.Rectangle $x,$y,$size,$size;',
      '$g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel);',
      '$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png);',
      '$g.Dispose(); $bmp.Dispose(); $img.Dispose();'
    ].join(' ');

    const r = spawnSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'inherit' });
    if (r.status !== 0) {
      return { outRel: rel, width: null, height: null };
    }

    return { outRel, width: OG_SQUARE_SIZE, height: OG_SQUARE_SIZE };
  } catch (e) {
    return null;
  }
}

function writeSongPage({ songParam, title, artist, imageRel }) {
  const sharePath = `/song/${encodeURIComponent(songParam)}/`;
  const ogUrl = `${SITE_URL}${sharePath}`;

  const square = ensureSquareOgImage(imageRel);
  const ogImageRel = (square && square.outRel) ? square.outRel : (imageRel ? imageRel.replace(/^\/+/, '') : 'images/headphones.png');
  const ogImage = `${SITE_URL}/${ogImageRel.replace(/^\/+/, '')}`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>${escapeHtml(title)} — ${escapeHtml(artist)}</title>
  <meta name="description" content="${escapeHtml(artist)}" />

  <meta property="og:type" content="music.song" />
  <meta property="og:site_name" content="Gang Beasts OST" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(artist)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:width" content="${OG_SQUARE_SIZE}" />
  <meta property="og:image:height" content="${OG_SQUARE_SIZE}" />
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />

  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(artist)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

  <meta http-equiv="refresh" content="0; url=/?song=${encodeURIComponent(songParam)}" />
  <script>
    // Redirect humans to the real player.
    location.replace('/?song=${encodeURIComponent(songParam)}');
  </script>
</head>
<body>
  Redirecting…
</body>
</html>
`;

  const dir = path.join(outDir, songParam);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

function main() {
  if (!fs.existsSync(tracksPath)) {
    console.error('tracks.json not found:', tracksPath);
    process.exit(1);
  }

  const tracks = JSON.parse(fs.readFileSync(tracksPath, 'utf8'));
  ensureDir(outDir);

  let count = 0;
  for (const t of tracks) {
    const stage = (t.stage ? String(t.stage).trim() : '');
    const side = (t.side ? String(t.side).trim() : '');
    if (!stage || !side) continue;

    const songParam = `${stage}-${side}`;
    writeSongPage({
      songParam,
      title: t.title || songParam,
      artist: t.artist || '',
      imageRel: t.image || ''
    });
    count++;
  }

  console.log(`Generated ${count} song share page(s) in ${outDir}`);
}

main();

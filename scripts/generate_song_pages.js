const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const tracksPath = path.join(root, 'tracks.json');
const outDir = path.join(root, 'song');

// Used to build absolute OG urls (recommended for Discord). Keep in sync with your Pages domain.
const SITE_URL = process.env.SITE_URL || 'https://gangbeastsost.github.io';

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

function writeSongPage({ songParam, title, artist, imageRel }) {
  const sharePath = `/song/${encodeURIComponent(songParam)}/`;
  const ogUrl = `${SITE_URL}${sharePath}`;
  const ogImage = imageRel ? `${SITE_URL}/${imageRel.replace(/^\/+/, '')}` : `${SITE_URL}/images/headphones.png`;

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
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />

  <meta name="twitter:card" content="summary_large_image" />
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

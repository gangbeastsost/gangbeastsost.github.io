const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const musicDir = path.join(root, 'music');
const imgDir = path.join(root, 'images');
const out = path.join(root, 'tracks.json');

function scan() {
  const musicFiles = fs.existsSync(musicDir) ? fs.readdirSync(musicDir).filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f)) : [];
  const imageFiles = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f)) : [];

  const tracks = musicFiles.map(m => {
    const name = path.parse(m).name;
    // attempt to find matching image by name
    const img = imageFiles.find(i => path.parse(i).name.toLowerCase() === name.toLowerCase()) || imageFiles[0] || '';
    return {
      title: name,
      artist: 'Gang Beasts OST',
      file: `music/${m}`,
      image: img ? `images/${img}` : ''
    };
  });

  fs.writeFileSync(out, JSON.stringify(tracks, null, 2), 'utf8');
  console.log(`Wrote ${tracks.length} tracks to ${out}`);
}

scan();

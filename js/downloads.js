export function getMp3DownloadPath(path) {
  if (!path) return path;
  return String(path).replace(/^(music\/)(?!mp3\/)(.+)\.ogg(?=($|[?#]))/i, '$1mp3/$2.mp3');
}

export function downloadTrack(track, browserDocument = globalThis.document) {
  if (!track?.file) return;
  try {
    const downloadPath = getMp3DownloadPath(track.file);
    const parts = downloadPath.split('/');
    let filename = parts.at(-1)?.split('?')[0] || '';
    if (!filename) filename = `${track.title || 'track'}.mp3`;
    const anchor = browserDocument.createElement('a');
    anchor.href = encodeURI(downloadPath);
    anchor.download = filename;
    browserDocument.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } catch (cause) {
    console.warn('download failed', cause);
  }
}

export async function downloadCatalogAsZip(tracks, options = {}) {
  if (!Array.isArray(tracks) || tracks.length === 0) return;
  const {
    Zip = globalThis.JSZip,
    button = null,
    label = null,
    browserDocument = globalThis.document,
    browserWindow = globalThis.window,
  } = options;

  if (!Zip) {
    browserWindow.alert('ZIP library not loaded. Please ensure you are online.');
    return;
  }

  const setLabel = (text) => {
    if (label) label.textContent = text;
    else if (button) button.textContent = text;
  };

  try {
    if (button) button.disabled = true;
    const zip = new Zip();
    for (let index = 0; index < tracks.length; index += 1) {
      const track = tracks[index];
      const url = encodeURI(track.file);
      try {
        setLabel(`Zipping ${index + 1}/${tracks.length}`);
        const response = await fetch(url);
        if (!response.ok) {
          console.warn('fetch failed', url, response.status);
          continue;
        }
        const blob = await response.blob();
        const parts = (track.file || url).split('/');
        const filename = parts.at(-1)?.split('?')[0] || `track-${index + 1}.mp3`;
        zip.file(filename, blob);
      } catch (cause) {
        console.warn('downloadAll: failed to fetch', track.file, cause);
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    setLabel('Compressing...');
    const output = await zip.generateAsync({ type: 'blob' }, (metadata) => {
      setLabel(`Compressing ${Math.round(metadata.percent)}%`);
    });
    const anchor = browserDocument.createElement('a');
    anchor.href = URL.createObjectURL(output);
    anchor.download = 'Gang Beasts OST.zip';
    browserDocument.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(anchor.href);
  } catch (cause) {
    console.warn('downloadAllTracks failed', cause);
    browserWindow.alert('Download failed');
  } finally {
    if (button) button.disabled = false;
    setLabel('Download All');
  }
}

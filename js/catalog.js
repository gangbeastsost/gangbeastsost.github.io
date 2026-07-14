export const OFFICIAL_ARTIST = 'doseone & Bob Larder';

export function isTrackAllowedByViewFilter(track, options = {}) {
  if (!track) return false;

  const {
    viewFilter = 'all',
    customFiles = [],
    customMode = 'exclude',
  } = options;
  const artist = String(track.artist || '').trim();
  const side = String(track.side || '').trim().toLowerCase();
  const file = String(track.file || '').trim();
  const isDrums = side === 'drums';

  if (viewFilter === 'all') return !isDrums;
  if (viewFilter === 'exclude') return artist === OFFICIAL_ARTIST && !isDrums;
  if (viewFilter === 'only') return artist !== OFFICIAL_ARTIST && !isDrums;
  if (viewFilter === 'drums-include') return true;
  if (viewFilter === 'drums-only') return isDrums;
  if (viewFilter === 'custom') {
    if (!Array.isArray(customFiles) || customFiles.length === 0) return true;
    if (customMode === 'include') return customFiles.includes(file);
    return !customFiles.includes(file);
  }
  return true;
}

export function escapeHtml(value) {
  try {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  } catch (cause) {
    return '';
  }
}

export function formatDuration(seconds) {
  if (!seconds || Number.isNaN(Number(seconds))) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export function formatTotalDuration(seconds) {
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function getDefaultCover() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#444" rx="24"/><text x="50%" y="50%" font-size="80" fill="#bbb" font-family="Inter, system-ui, Arial, sans-serif" font-weight="700" dominant-baseline="middle" text-anchor="middle">:(</text></svg>';
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

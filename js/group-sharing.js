const SHARE_VERSION = 1;
const MAX_ENCODED_LENGTH = 8192;
const MAX_GROUP_NAME_LENGTH = 40;
const MAX_TRACKS = 200;
const MAX_TRACK_ID_LENGTH = 100;

export class GroupShareError extends Error {
  constructor(message, code = 'invalid') {
    super(message);
    this.name = 'GroupShareError';
    this.code = code;
  }
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toBase64Url(value) {
  return bytesToBase64(new TextEncoder().encode(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new GroupShareError('This group link has an invalid payload.', 'encoding');
  }
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(base64ToBytes(padded));
  } catch (cause) {
    throw new GroupShareError('This group link could not be decoded.', 'encoding');
  }
}

export function getSharedTrackId(track) {
  if (!track) return '';
  const stage = String(track.stage || '').trim();
  const side = String(track.side || '').trim();
  return stage && side ? `${stage}-${side}` : '';
}

export function normalizeGroupName(name) {
  const normalized = String(name || '').trim();
  return normalized || 'Custom group';
}

function normalizeTrackIds(trackIds) {
  if (!Array.isArray(trackIds)) {
    throw new GroupShareError('This group link does not contain a valid track list.', 'tracks');
  }
  if (trackIds.length > MAX_TRACKS) {
    throw new GroupShareError('This shared group contains too many tracks.', 'tracks');
  }
  const normalized = trackIds.map((trackId) => String(trackId || '').trim());
  if (normalized.some((trackId) => !trackId || trackId.length > MAX_TRACK_ID_LENGTH)) {
    throw new GroupShareError('This group link contains an invalid track identifier.', 'tracks');
  }
  return [...new Set(normalized)];
}

export function encodeGroupShare({ name, mode, trackIds }) {
  const normalizedName = normalizeGroupName(name);
  if (normalizedName.length > MAX_GROUP_NAME_LENGTH) {
    throw new GroupShareError(`Group names cannot exceed ${MAX_GROUP_NAME_LENGTH} characters.`, 'name');
  }
  if (mode !== 'include' && mode !== 'exclude') {
    throw new GroupShareError('This group has an invalid Include/Exclude mode.', 'mode');
  }
  const normalizedTrackIds = normalizeTrackIds(trackIds);
  if (!normalizedTrackIds.length) {
    throw new GroupShareError('Add at least one available track before sharing this group.', 'tracks');
  }
  return toBase64Url(JSON.stringify({
    v: SHARE_VERSION,
    n: normalizedName,
    m: mode,
    t: normalizedTrackIds,
  }));
}

export function decodeGroupShare(payload) {
  const encoded = String(payload || '').trim();
  if (!encoded) throw new GroupShareError('Paste a group sharing URL first.', 'missing');
  if (encoded.length > MAX_ENCODED_LENGTH) {
    throw new GroupShareError('This group link is too large to import.', 'size');
  }

  let parsed;
  try {
    parsed = JSON.parse(fromBase64Url(encoded));
  } catch (cause) {
    if (cause instanceof GroupShareError) throw cause;
    throw new GroupShareError('This group link does not contain valid group data.', 'json');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new GroupShareError('This group link does not contain valid group data.', 'shape');
  }
  if (parsed.v !== SHARE_VERSION) {
    throw new GroupShareError('This group link uses an unsupported sharing version.', 'version');
  }

  const name = normalizeGroupName(parsed.n);
  if (name.length > MAX_GROUP_NAME_LENGTH) {
    throw new GroupShareError(`Group names cannot exceed ${MAX_GROUP_NAME_LENGTH} characters.`, 'name');
  }
  if (parsed.m !== 'include' && parsed.m !== 'exclude') {
    throw new GroupShareError('This group link has an invalid Include/Exclude mode.', 'mode');
  }

  return {
    version: SHARE_VERSION,
    name,
    mode: parsed.m,
    trackIds: normalizeTrackIds(parsed.t),
  };
}

export function parseGroupShareUrl(value, baseUrl = globalThis.location?.href) {
  let url;
  try {
    url = new URL(String(value || '').trim(), baseUrl);
  } catch (cause) {
    throw new GroupShareError('Enter a valid group sharing URL.', 'url');
  }
  const payload = url.searchParams.get('group');
  if (!payload) throw new GroupShareError('This URL does not contain a shared group.', 'missing');
  return decodeGroupShare(payload);
}

export function resolveSharedGroup(sharedGroup, tracks) {
  const tracksById = new Map();
  (Array.isArray(tracks) ? tracks : []).forEach((track) => {
    const trackId = getSharedTrackId(track);
    const file = String(track?.file || '').trim();
    if (trackId && file && !tracksById.has(trackId)) tracksById.set(trackId, track);
  });

  const matchedTracks = [];
  const unknownTrackIds = [];
  sharedGroup.trackIds.forEach((trackId) => {
    const track = tracksById.get(trackId);
    if (track) matchedTracks.push(track);
    else unknownTrackIds.push(trackId);
  });
  if (!matchedTracks.length) {
    throw new GroupShareError('None of this group\'s tracks are available in the current catalog.', 'no-matches');
  }
  return {
    ...sharedGroup,
    matchedTracks,
    files: matchedTracks.map((track) => String(track.file).trim()),
    matchedTrackIds: matchedTracks.map(getSharedTrackId),
    unknownTrackIds,
  };
}

export function createGroupShareUrl(group, tracks, origin = globalThis.location?.origin) {
  if (!origin) throw new GroupShareError('A sharing URL cannot be created here.', 'origin');
  const files = new Set(Array.isArray(group?.files) ? group.files.map((file) => String(file || '').trim()) : []);
  const trackIds = (Array.isArray(tracks) ? tracks : [])
    .filter((track) => files.has(String(track?.file || '').trim()))
    .map(getSharedTrackId)
    .filter(Boolean);
  const payload = encodeGroupShare({
    name: group?.name,
    mode: group?.mode === 'include' ? 'include' : 'exclude',
    trackIds,
  });
  const url = new URL('/', origin);
  url.searchParams.set('group', payload);
  return url.href;
}

export function getGroupFingerprint({ name, mode, trackIds }) {
  return JSON.stringify([
    normalizeGroupName(name),
    mode === 'include' ? 'include' : 'exclude',
    [...new Set((trackIds || []).map((trackId) => String(trackId || '').trim()).filter(Boolean))].sort(),
  ]);
}

export function getAvailableGroupName(name, existingNames) {
  const baseName = normalizeGroupName(name);
  const names = new Set((existingNames || []).map((entry) => normalizeGroupName(entry)));
  if (!names.has(baseName)) return baseName;

  for (let suffix = 2; suffix < 10000; suffix += 1) {
    const suffixText = ` (${suffix})`;
    const candidate = `${baseName.slice(0, MAX_GROUP_NAME_LENGTH - suffixText.length).trimEnd()}${suffixText}`;
    if (!names.has(candidate)) return candidate;
  }
  throw new GroupShareError('A unique name could not be created for this group.', 'name');
}

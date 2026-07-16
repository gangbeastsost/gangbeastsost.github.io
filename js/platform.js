export function supportsOggVorbis(mediaElement = null) {
  try {
    const probe = mediaElement
      || globalThis.document?.createElement?.('audio')
      || (typeof globalThis.Audio === 'function' ? new globalThis.Audio() : null);
    if (!probe || typeof probe.canPlayType !== 'function') return false;
    return [
      'audio/ogg; codecs="vorbis"',
      'audio/ogg',
    ].some((type) => {
      const support = probe.canPlayType(type);
      return support === 'probably' || support === 'maybe';
    });
  } catch (cause) {
    return false;
  }
}

export function resolveAudioFile(filePath, mediaElement = null) {
  if (!filePath) return filePath;
  if (supportsOggVorbis(mediaElement)) {
    return filePath.replace(/^(music\/)mp3\/(.+)\.mp3($|\?)/i, '$1$2.ogg$3');
  }
  return filePath.replace(/^(music\/)(.+)\.ogg($|\?)/i, '$1mp3/$2.mp3$3');
}

export function isIOSDevice(browserNavigator = globalThis.navigator) {
  try {
    const userAgent = browserNavigator?.userAgent || '';
    const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent);
    const isModernIPad = browserNavigator?.platform === 'MacIntel'
      && browserNavigator?.maxTouchPoints > 1;
    return isAppleMobile || isModernIPad;
  } catch (cause) {
    return false;
  }
}

export function isSafariBrowser(browserNavigator = globalThis.navigator) {
  try {
    const userAgent = browserNavigator?.userAgent || '';
    const vendor = browserNavigator?.vendor || '';
    return /Apple/i.test(vendor)
      && /Safari/i.test(userAgent)
      && !/(?:CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium|Android)/i.test(userAgent);
  } catch (cause) {
    return false;
  }
}

export function isSafariBrowser(browserNavigator = globalThis.navigator) {
  const userAgent = browserNavigator?.userAgent || '';
  return /safari/i.test(userAgent) && !/chrome|chromium|crios|android/i.test(userAgent);
}

export function resolveAudioFile(filePath, browserNavigator = globalThis.navigator) {
  if (!filePath) return filePath;
  if (isSafariBrowser(browserNavigator)) {
    return filePath.replace(/^(music\/)(.+)\.ogg($|\?)/i, '$1mp3/$2.mp3$3');
  }
  return filePath.replace(/^(music\/)mp3\/(.+)\.mp3($|\?)/i, '$1$2.ogg$3');
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

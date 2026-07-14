const copiedButtonTimers = new WeakMap();

export function getTrackSongParam(track) {
  if (!track) return null;
  const stage = String(track.stage || '').trim();
  const side = String(track.side || '').trim();
  return stage && side ? `${stage}-${side}` : null;
}

export function setSongQueryParam(value, targetWindow = globalThis.window) {
  try {
    const url = new URL(targetWindow.location.href);
    if (value) url.searchParams.set('song', value);
    else url.searchParams.delete('song');
    const next = `${url.pathname}${url.search || ''}${url.hash || ''}`;
    targetWindow.history.replaceState(null, '', next);
  } catch (cause) {}
}

export function getSongShareUrl(songParam, origin = globalThis.window?.location?.origin) {
  if (!songParam || !origin) return null;
  return `${origin}/song/${encodeURIComponent(songParam)}`;
}

export async function copyTextToClipboard(text, environment = {}) {
  if (!text) return false;
  const browserNavigator = environment.navigator || globalThis.navigator;
  const browserDocument = environment.document || globalThis.document;
  const browserWindow = environment.window || globalThis.window;

  try {
    if (
      browserNavigator?.clipboard?.writeText
      && browserWindow?.isSecureContext
    ) {
      await browserNavigator.clipboard.writeText(text);
      return true;
    }
  } catch (cause) {}

  try {
    const textArea = browserDocument.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    browserDocument.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);
    const copied = browserDocument.execCommand && browserDocument.execCommand('copy');
    browserDocument.body.removeChild(textArea);
    return Boolean(copied);
  } catch (cause) {
    return false;
  }
}

export function flashCopiedState(button) {
  if (!button) return;
  const previousTimer = copiedButtonTimers.get(button);
  if (previousTimer) clearTimeout(previousTimer);
  button.classList.add('copied');
  const timer = setTimeout(() => {
    button.classList.remove('copied');
    copiedButtonTimers.delete(button);
  }, 850);
  copiedButtonTimers.set(button, timer);
}

export function setCopyButtonState(button, url) {
  if (!button) return;
  const enabled = Boolean(url);
  button.disabled = !enabled;
  button.title = enabled ? 'Copy link' : 'No share link for this track';
  button.setAttribute('aria-label', enabled ? 'Copy link' : 'No share link for this track');
}

export function wireCopyButtons(buttons, getCurrentUrl) {
  buttons.filter(Boolean).forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        const copied = await copyTextToClipboard(getCurrentUrl());
        if (copied) flashCopiedState(button);
      } catch (cause) {}
    });
  });
}

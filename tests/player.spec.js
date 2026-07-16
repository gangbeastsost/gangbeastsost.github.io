const { test, expect } = require('@playwright/test');
const tracks = require('../tracks.json');

const OFFICIAL_ARTIST = 'doseone & Bob Larder';

function isDrums(track) {
  return String(track.side || '').toLowerCase() === 'drums';
}

function isListedCard(track) {
  return !(track.stage === 'Airship' && track.side === 'Game');
}

function expectedCount(filter) {
  return tracks.filter((track) => {
    if (!isListedCard(track)) return false;
    if (filter === 'all') return !isDrums(track);
    if (filter === 'drums-include') return true;
    if (filter === 'drums-only') return isDrums(track);
    if (filter === 'exclude') return track.artist === OFFICIAL_ARTIST && !isDrums(track);
    if (filter === 'only') return track.artist !== OFFICIAL_ARTIST && !isDrums(track);
    return true;
  }).length;
}

async function openPlayer(page, path = '/') {
  await page.goto(path);
  await expect(page.locator('#trackList .track').first()).toBeVisible();
}

async function chooseView(page, value) {
  await page.locator('#viewBtn').click();
  await page.locator(`#viewDropdown [data-value="${value}"]`).click();
}

test('loads the catalog and supports search and built-in filters', async ({ page }) => {
  await openPlayer(page);
  const cards = page.locator('#trackList .track');

  await expect(cards).toHaveCount(expectedCount('all'));
  await expect(page.locator('.hero-kicker')).toHaveText('Now broadcasting');
  const heroTitleButtonGap = await page.locator('.hero-info .title-row').evaluate((row) => {
    const title = row.querySelector('h1');
    const button = row.querySelector('.copy-link-btn');
    return Math.round(button.getBoundingClientRect().left - title.getBoundingClientRect().right);
  });
  expect(heroTitleButtonGap).toBeLessThanOrEqual(12);
  await expect(cards.first().locator('.track-number')).toHaveText(/^\d{2}$/);
  await expect(cards.first().locator('.track-stage')).not.toHaveText('');
  await expect(cards.first().locator('.track-meter i')).toHaveCount(4);
  const firstCardRows = await cards.evaluateAll((elements) => elements.slice(0, 5).map((element) => Math.round(element.getBoundingClientRect().top)));
  expect(firstCardRows.filter((top) => top === firstCardRows[0])).toHaveLength(4);
  const stageAccents = await cards.evaluateAll((elements) => elements.map((element) => ({
    stage: element.dataset.stage,
    accent: element.style.getPropertyValue('--track-accent'),
  })));
  const accentsByStage = new Map();
  for (const { stage, accent } of stageAccents) {
    if (accentsByStage.has(stage)) expect(accent).toBe(accentsByStage.get(stage));
    else accentsByStage.set(stage, accent);
  }
  expect(new Set(accentsByStage.values()).size).toBe(accentsByStage.size);
  await page.locator('#searchInput').fill('Tutorial');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Tutorial');
  await page.locator('#searchInput').fill('');

  for (const filter of ['drums-include', 'drums-only', 'exclude', 'only', 'all']) {
    await chooseView(page, filter);
    await expect(cards).toHaveCount(expectedCount(filter));
  }
});

test('keeps the playing-card hover lift and uses the gummy timeline styling', async ({ page }) => {
  await openPlayer(page);

  const card = page.locator('#trackList .track').first();
  await card.evaluate((element) => element.classList.add('active', 'playing'));
  await expect.poll(() => card.evaluate((element) => getComputedStyle(element).animationName))
    .toBe('gummy-card-pulse');

  await card.hover({ force: true });
  await expect.poll(() => card.evaluate((element) => getComputedStyle(element).animationName))
    .toBe('none');
  const hoverTransform = await card.evaluate((element) => getComputedStyle(element).transform);
  expect(hoverTransform).not.toBe('none');

  const timelineStyle = await page.locator('#miniSeek').evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      height: style.height,
      borderWidth: style.borderTopWidth,
      borderColor: style.borderTopColor,
      backgroundSize: style.backgroundSize,
      overflow: style.overflow,
    };
  });
  expect(timelineStyle.height).toBe('14px');
  expect(timelineStyle.borderWidth).toBe('1px');
  expect(timelineStyle.borderColor).toBe('rgba(255, 243, 213, 0.38)');
  expect(timelineStyle.backgroundSize).toContain('8px 100%');
  expect(timelineStyle.overflow).toBe('visible');

  await page.locator('#miniSeek').evaluate((element) => {
    element.value = '99';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const endpointFill = await page.locator('#miniSeek').evaluate((element) =>
    element.style.getPropertyValue('--seek-fill'));
  expect(endpointFill).toBe('calc(99.000% - 7.840px)');
});

test('plays, pauses, seeks, and changes tracks', async ({ page }) => {
  await openPlayer(page);

  const tutorialIndex = tracks.findIndex((track) => track.stage === 'Tutorial' && track.side === 'A');
  const tutorialCard = page.locator(`.track[data-track-index="${tutorialIndex}"]`);
  await tutorialCard.click();

  await expect(page.locator('#preloadToast')).toHaveClass(/show/);
  await expect(page.locator('#preloadToast')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#trackTitle')).toHaveText('Tutorial');
  await expect(page.locator('#miniPlayer')).not.toHaveClass(/no-song/);
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.paused)).toBe(false);

  await page.locator('#miniPlay').click();
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.paused)).toBe(true);

  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.duration)).toBeGreaterThan(0);
  await page.locator('#miniSeek').fill('25');
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentTime)).toBeGreaterThan(1);

  await page.locator('#miniNext').click();
  await expect(page.locator('#trackTitle')).not.toHaveText('Tutorial');
});

test('opens dedicated share links as paused deep links', async ({ page }) => {
  await openPlayer(page, '/song/Tutorial-A/');

  await expect(page).toHaveURL(/\/?\?song=Tutorial-A$/);
  await expect(page.locator('#trackTitle')).toHaveText('Tutorial');
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.paused)).toBe(true);
});

test('uses the catalog M4A file', async ({ page }) => {
  await openPlayer(page, '/?song=Tutorial-A');

  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentSrc || audio.src))
    .toMatch(/\/music\/m4a\/Tutorial\.m4a$/);
});

test('keeps using M4A when Safari reports partial OGG support', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeCanPlayType = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function canPlayType(type) {
      const requestedType = String(type || '');
      if (/^audio\/ogg;/i.test(requestedType)) return 'no';
      if (/^audio\/ogg$/i.test(requestedType)) return 'maybe';
      return nativeCanPlayType.call(this, type);
    };
  });
  await openPlayer(page, '/?song=Tutorial-A');

  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentSrc || audio.src))
    .toMatch(/\/music\/m4a\/Tutorial\.m4a$/);
});

test('keeps using M4A when OGG Vorbis is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeCanPlayType = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function canPlayType(type) {
      if (/^audio\/ogg(?:;|$)/i.test(String(type || ''))) return '';
      return nativeCanPlayType.call(this, type);
    };
  });
  await openPlayer(page, '/?song=Tutorial-A');

  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentSrc || audio.src))
    .toMatch(/\/music\/m4a\/Tutorial\.m4a$/);
});

test('uses catalog timing when browser media metadata reports the wrong duration', async ({ page }) => {
  await openPlayer(page, '/?song=Alley-B');
  await expect(page.locator('#trackTitle')).toHaveText('Beef City Hustle');

  await page.locator('#audio').evaluate((audio) => {
    Object.defineProperty(audio, 'duration', { configurable: true, value: 211.10102040816327 });
    Object.defineProperty(audio, 'currentTime', { configurable: true, writable: true, value: 105.55051020408164 });
    audio.dispatchEvent(new Event('timeupdate'));
  });

  await expect(page.locator('#miniRem')).toHaveText('3:21');
  await expect(page.locator('#miniCur')).toHaveText('1:45');
});

test('prepares Airport deep links at the requested section before playback', async ({ page }) => {
  await openPlayer(page, '/song/Airport-Section-B-2/');

  await expect(page.locator('#trackTitle')).toHaveText('Airport (Airborne 2)');
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentTime))
    .toBeGreaterThan(169.9);
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentTime))
    .toBeLessThan(170.3);
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.paused)).toBe(true);
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.muted)).toBe(false);
});

test('does not scale Airport seeks when only the reported duration is wrong', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeDuration = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'duration');
    Object.defineProperty(HTMLMediaElement.prototype, 'duration', {
      configurable: true,
      get() {
        const source = this.currentSrc || this.src || '';
        if (/Airport(?:%20|\s)/i.test(source)) return 420;
        return nativeDuration.get.call(this);
      },
    });
  });
  await openPlayer(page, '/song/Airport-Section-B-2/');

  await expect(page.locator('#trackTitle')).toHaveText('Airport (Airborne 2)');
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentTime))
    .toBeGreaterThan(169.9);
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentTime))
    .toBeLessThan(170.3);

  await page.keyboard.press('Control+ArrowRight');
  await expect(page.locator('#trackTitle')).toHaveText('Airport (Airborne 3)');
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentTime))
    .toBeGreaterThan(225.5);
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentTime))
    .toBeLessThan(225.9);
  await expect(page).toHaveURL(/song=Airport-Section-B-3/);
});

test('uses a silent preroll for repeated Safari section seeks', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'vendor', { configurable: true, value: 'Apple Computer, Inc.' });
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.5 Safari/605.1.15',
    });
    const nativePause = HTMLMediaElement.prototype.pause;
    const nativeCurrentTime = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime');
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    window.__playerPauseCount = 0;
    window.__playerSeekTargets = [];
    window.__mediaElementSourceCount = 0;
    if (AudioContextType) {
      const nativeCreateMediaElementSource = AudioContextType.prototype.createMediaElementSource;
      AudioContextType.prototype.createMediaElementSource = function createMediaElementSource(element) {
        window.__mediaElementSourceCount += 1;
        return nativeCreateMediaElementSource.call(this, element);
      };
    }
    HTMLMediaElement.prototype.pause = function pause() {
      if (this.id === 'audio') window.__playerPauseCount += 1;
      return nativePause.call(this);
    };
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      configurable: true,
      get() { return nativeCurrentTime.get.call(this); },
      set(value) {
        if (this.id === 'audio') window.__playerSeekTargets.push(value);
        return nativeCurrentTime.set.call(this, value);
      },
    });
  });
  await openPlayer(page, '/song/Airport-Section-B-2/');
  await page.locator('#miniPlay').click();
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.paused)).toBe(false);
  expect(await page.evaluate(() => window.__mediaElementSourceCount)).toBe(0);
  await page.evaluate(() => {
    window.__playerPauseCount = 0;
    window.__playerSeekTargets = [];
  });

  await page.keyboard.press('Control+ArrowRight');
  await page.keyboard.press('Control+ArrowRight');
  await page.keyboard.press('Control+ArrowRight');

  await expect(page.locator('#trackTitle')).toHaveText('Airport (Ending)');
  await expect.poll(() => page.evaluate(() => window.__playerPauseCount)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__playerSeekTargets.at(-1)))
    .toBeGreaterThan(336.5);
  await expect.poll(() => page.evaluate(() => window.__playerSeekTargets.at(-1)))
    .toBeLessThan(336.75);
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentTime))
    .toBeGreaterThan(336.6);
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentTime))
    .toBeLessThan(337.3);
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.paused)).toBe(false);
  expect(await page.evaluate(() => window.__mediaElementSourceCount)).toBe(0);
});

test('ignores stale media readiness when tracks are switched rapidly', async ({ page }) => {
  await openPlayer(page);
  const tutorialIndex = tracks.findIndex((track) => track.stage === 'Tutorial' && track.side === 'A');
  const gondolaIndex = tracks.findIndex((track) => track.stage === 'Gondola' && track.side === 'B');

  await page.locator(`.track[data-track-index="${tutorialIndex}"]`).click();
  await page.locator(`.track[data-track-index="${gondolaIndex}"]`).click();

  await expect(page.locator('#trackTitle')).toHaveText('Gondola Dive');
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentSrc || audio.src))
    .toMatch(/\/music\/m4a\/Gondola%20Dive\.m4a$/);
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.paused)).toBe(false);
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.currentTime)).toBeGreaterThan(0);
});

test('keeps playback controls paused when native playback rejects', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function play() {
      return Promise.reject(new DOMException('Playback blocked for test', 'NotAllowedError'));
    };
  });
  await openPlayer(page);
  const tutorialIndex = tracks.findIndex((track) => track.stage === 'Tutorial' && track.side === 'A');

  await page.locator(`.track[data-track-index="${tutorialIndex}"]`).click();

  await expect(page.locator('#miniPlay')).toHaveText('▶');
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.paused)).toBe(true);
  await expect(page.locator('#heroArt')).not.toHaveClass(/playing/);
});

test('downloads an individual M4A track', async ({ page }) => {
  await openPlayer(page, '/?song=Tutorial-A');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#miniDownload').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('Tutorial.m4a');
  expect(download.url()).toMatch(/\/music\/m4a\/Tutorial\.m4a$/);
});

test('opens and closes the custom track context menu', async ({ page }) => {
  await openPlayer(page);

  const tutorialIndex = tracks.findIndex((track) => track.stage === 'Tutorial' && track.side === 'A');
  await page.locator(`.track[data-track-index="${tutorialIndex}"]`).click({ button: 'right' });
  await expect(page.locator('#trackContextMenu')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#trackContextMenu [data-action="play"]')).toHaveText(/Play Now/);

  await page.locator('#trackContextMenu [data-action="play"]').click();
  await expect(page.locator('#trackContextMenu')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#trackTitle')).toHaveText('Tutorial');
});

test('supports keyboard controls and important dialogs', async ({ page }) => {
  await openPlayer(page, '/?song=Tutorial-A');

  await page.keyboard.press('?');
  await expect(page.locator('#keyboardHint')).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Escape');
  await expect(page.locator('#keyboardHint')).toHaveAttribute('aria-hidden', 'true');

  await page.keyboard.press('f');
  await expect(page.locator('#modal')).not.toHaveClass(/hidden/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toHaveClass(/hidden/);

  await page.locator('#helpBtn').click();
  await expect(page.locator('#infoModal')).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Escape');
  await expect(page.locator('#infoModal')).toHaveAttribute('aria-hidden', 'true');

  await page.locator('#settingsBtn').click();
  await expect(page.locator('#settingsModal')).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Escape');
  await expect(page.locator('#settingsModal')).toHaveAttribute('aria-hidden', 'true');

  await page.keyboard.press('s');
  await expect(page.locator('#miniShuffle')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('l');
  await expect(page.locator('#miniLoop')).toHaveAttribute('data-loop', 'one');

  await page.keyboard.press('Shift+ArrowRight');
  await expect(page.locator('#trackTitle')).not.toHaveText('Tutorial');
});

test('persists volume changes through the unified audio gain control', async ({ page }) => {
  await openPlayer(page, '/?song=Tutorial-A');
  await page.keyboard.press('f');
  await page.locator('#mVolume').fill('0.35');

  await expect(page.locator('#mVolume')).toHaveValue('0.35');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('gb:volume'))).toBe('0.35');
});

test('restores persisted visual settings and view preference', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gb:reduceAnimations', '1');
    localStorage.setItem('gb:liteMode', '1');
    localStorage.setItem('gb:viewFilter', 'drums-only');
  });

  await openPlayer(page);
  await expect(page.locator('body')).toHaveClass(/reduce-animations/);
  await expect(page.locator('body')).toHaveClass(/lite-mode/);
  await expect(page.locator('#trackList .track')).toHaveCount(expectedCount('drums-only'));

  await page.locator('#settingsBtn').click();
  await expect(page.locator('#toggleReduceAnimations')).toBeChecked();
  await expect(page.locator('#toggleLiteMode')).toBeChecked();
});

test('restores, opens, plays from, and clears listen history', async ({ page }) => {
  const tutorial = tracks.find((track) => track.stage === 'Tutorial' && track.side === 'A');
  await page.addInitScript((historyEntry) => {
    localStorage.setItem('gb:history', JSON.stringify([{ ...historyEntry, ts: Date.now() }]));
  }, tutorial);

  await openPlayer(page);
  await page.locator('#historyBtn').click();
  await expect(page.locator('#historyPanel')).toHaveClass(/open/);
  await expect(page.locator('.history-entry')).toHaveCount(1);
  await expect(page.locator('.history-entry__title')).toHaveText('Tutorial');

  await page.locator('.history-entry__play').click();
  await expect(page.locator('#trackTitle')).toHaveText('Tutorial');
  await expect.poll(() => page.locator('#audio').evaluate((audio) => audio.paused)).toBe(false);

  await page.locator('#historyClearBtn').click();
  await expect(page.locator('.history-empty')).toBeVisible();
  await expect(page.locator('.history-entry')).toHaveCount(0);
});

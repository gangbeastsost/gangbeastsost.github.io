const { test, expect } = require('@playwright/test');
const tracks = require('../tracks.json');

const OFFICIAL_ARTIST = 'doseone & Bob Larder';

function isDrums(track) {
  return String(track.side || '').toLowerCase() === 'drums';
}

function isListedCard(track) {
  return !(track.stage === 'Airship' && track.side === 'Game');
}

function expectedCustomAccent(value) {
  const raw = String(value || '').trim();
  const triplet = raw.match(/^(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})$/)
    || raw.match(/^rgb\(\s*(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})\s*\)$/i);
  return triplet ? `rgb(${triplet.slice(1).map(Number).join(', ')})` : raw;
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

function makeGroupSharePayload({ name, mode, trackIds, version = 1 }) {
  return Buffer.from(JSON.stringify({ v: version, n: name, m: mode, t: trackIds }), 'utf8').toString('base64url');
}

async function openPlayer(page, path = '/') {
  await page.goto(path);
  await expect(page.locator('#trackList .track').first()).toBeVisible();
}

async function chooseFilter(page, value) {
  await page.locator('#viewBtn').click();
  await page.locator(`#viewDropdown [data-value="${value}"]`).click();
}

async function chooseLayout(page, value) {
  await page.locator(`#layoutSwitcher [data-layout="${value}"]`).click();
}

test('loads the catalog and supports search and built-in filters', async ({ page }) => {
  await openPlayer(page);
  const cards = page.locator('#trackList .track');

  await expect(cards).toHaveCount(expectedCount('all'));
  await expect(page.locator('.hero-kicker')).toHaveText('Now broadcasting');
  await expect(page.locator('#viewBtn')).toContainText('Filter');
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
    trackIndex: Number(element.dataset.trackIndex),
  })));
  const accentsByStage = new Map();
  for (const { stage, accent, trackIndex } of stageAccents) {
    const configuredAccent = String(tracks[trackIndex]?.accent || '').trim();
    if (configuredAccent) {
      expect(accent).toBe(expectedCustomAccent(configuredAccent));
      continue;
    }
    if (accentsByStage.has(stage)) expect(accent).toBe(accentsByStage.get(stage));
    else accentsByStage.set(stage, accent);
  }
  expect(new Set(accentsByStage.values()).size).toBe(accentsByStage.size);
  await page.locator('#searchInput').fill('Tutorial');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Tutorial');
  await page.locator('#searchInput').fill('');

  for (const filter of ['drums-include', 'drums-only', 'exclude', 'only', 'all']) {
    await chooseFilter(page, filter);
    await expect(cards).toHaveCount(expectedCount(filter));
  }
});

test('opens a search-only floating control with Ctrl or Command F', async ({ page }) => {
  await openPlayer(page);
  const search = page.locator('#searchInput');
  const floatingSearch = page.locator('#floatingSearchInput');
  const floatingSearchWrap = page.locator('#floatingSearchWrap');
  const searchWrap = page.locator('.search-wrap');
  const cards = page.locator('#trackList .track');

  await cards.nth(20).scrollIntoViewIfNeeded();
  const anchorTopBefore = await cards.nth(20).evaluate((element) => Math.round(element.getBoundingClientRect().top));
  const scrolledGeometry = await searchWrap.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { position: style.position, bottom: Math.round(rect.bottom) };
  });
  expect(scrolledGeometry.position).toBe('static');
  expect(scrolledGeometry.bottom).toBeLessThan(0);

  await page.keyboard.press('Control+f');
  await expect(floatingSearch).toBeFocused();
  await expect(floatingSearchWrap).toHaveClass(/open/);
  await expect(floatingSearchWrap).toHaveAttribute('aria-hidden', 'false');
  await expect(floatingSearchWrap.locator('input')).toHaveCount(1);
  const floatingGeometry = await floatingSearchWrap.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { position: getComputedStyle(element).position, top: Math.round(rect.top), width: Math.round(rect.width) };
  });
  expect(floatingGeometry.position).toBe('fixed');
  expect(floatingGeometry.top).toBeGreaterThan(0);
  expect(floatingGeometry.width).toBeLessThanOrEqual(580);
  const anchorTopAfter = await cards.nth(20).evaluate((element) => Math.round(element.getBoundingClientRect().top));
  expect(anchorTopAfter).toBe(anchorTopBefore);

  await floatingSearch.blur();
  const metaShortcutWasPrevented = await page.evaluate(() => {
    const event = new KeyboardEvent('keydown', {
      key: 'f',
      code: 'KeyF',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    return !document.dispatchEvent(event);
  });
  expect(metaShortcutWasPrevented).toBe(true);
  await expect(floatingSearch).toBeFocused();

  await floatingSearch.fill('doseone');
  await expect(search).toHaveValue('doseone');
  await expect.poll(() => cards.count()).toBeGreaterThan(20);

  // A narrow result set shortens the page enough to reveal the original search.
  // Focus should move there without selecting and replacing the entire query.
  await floatingSearch.fill('Tutorial');
  await expect(cards).toHaveCount(1);
  await expect(search).toBeFocused();
  await expect(floatingSearchWrap).not.toHaveClass(/open/);
  const transferredSelection = await search.evaluate((input) => ({
    start: input.selectionStart,
    end: input.selectionEnd,
    length: input.value.length,
  }));
  expect(transferredSelection).toEqual({ start: 8, end: 8, length: 8 });
  await page.keyboard.type('x');
  await expect(search).toHaveValue('Tutorialx');

  await search.fill('');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press('Control+f');
  await expect(search).toBeFocused();
  await expect(floatingSearchWrap).not.toHaveClass(/open/);
});

test('hides mini-player metadata before it can collide with centered controls', async ({ page }) => {
  await page.setViewportSize({ width: 650, height: 520 });
  await openPlayer(page, '/?song=Crane-B');

  await expect(page.locator('#miniPlayer .mini-meta')).toBeHidden();
  await expect(page.locator('#miniCover')).toBeVisible();
  await expect(page.locator('#miniPlayer .mini-controls')).toBeVisible();
});

test('switches between the grid and compact list without changing catalog behavior', async ({ page }) => {
  await openPlayer(page);
  const cards = page.locator('#trackList .track');
  const gridOption = page.locator('#layoutSwitcher [data-layout="grid"]');
  const listOption = page.locator('#layoutSwitcher [data-layout="list"]');

  await expect(gridOption).toHaveAttribute('aria-pressed', 'true');
  await expect(listOption).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#trackList')).toHaveAttribute('data-layout', 'grid');

  await chooseLayout(page, 'list');
  await expect(page.locator('#trackList')).toHaveClass(/layout-list/);
  await expect(gridOption).toHaveAttribute('aria-pressed', 'false');
  await expect(listOption).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('gb:layoutMode'))).toBe('list');

  const listGeometry = await cards.evaluateAll((elements) => elements.slice(0, 5).map((element) => {
    const rect = element.getBoundingClientRect();
    const image = element.querySelector('img').getBoundingClientRect();
    const numberPosition = getComputedStyle(element.querySelector('.track-number')).position;
    return { top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height), imageWidth: Math.round(image.width), numberPosition };
  }));
  expect(new Set(listGeometry.map(({ top }) => top)).size).toBe(listGeometry.length);
  expect(new Set(listGeometry.map(({ width }) => width)).size).toBe(1);
  expect(listGeometry[0].height).toBeLessThanOrEqual(72);
  expect(listGeometry[0].imageWidth).toBe(48);
  expect(listGeometry[0].numberPosition).toBe('static');
  await expect(cards.first().locator('.track-stage')).not.toHaveText('');
  await expect(cards.first().locator('.sub')).not.toHaveText('');
  await expect(cards.first().locator('.track-dur')).not.toHaveText('');

  await chooseFilter(page, 'drums-include');
  await expect(cards).toHaveCount(expectedCount('drums-include'));
  await expect(page.locator('#trackList')).toHaveClass(/layout-list/);
  await page.locator('#searchInput').fill('Tutorial');
  await expect(cards).toHaveCount(1);

  await chooseLayout(page, 'grid');
  await expect(page.locator('#trackList')).not.toHaveClass(/layout-list/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('gb:layoutMode'))).toBe('grid');
});

test('keeps the list toolbar and rows compact on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('gb:layoutMode', 'list'));
  await openPlayer(page);

  const mobileLayout = await page.evaluate(() => {
    const search = document.getElementById('searchInput').getBoundingClientRect();
    const duration = document.getElementById('ostDurationEl').getBoundingClientRect();
    const switcher = document.getElementById('layoutSwitcher').getBoundingClientRect();
    const card = document.querySelector('#trackList .track').getBoundingClientRect();
    return {
      searchBottom: Math.round(search.bottom),
      durationCenter: Math.round(duration.top + (duration.height / 2)),
      switcherTop: Math.round(switcher.top),
      switcherCenter: Math.round(switcher.top + (switcher.height / 2)),
      cardHeight: Math.round(card.height),
    };
  });
  expect(mobileLayout.switcherTop).toBeGreaterThanOrEqual(mobileLayout.searchBottom);
  expect(Math.abs(mobileLayout.switcherCenter - mobileLayout.durationCenter)).toBeLessThanOrEqual(2);
  expect(mobileLayout.cardHeight).toBeLessThanOrEqual(70);
  await expect(page.locator('#layoutSwitcher [data-layout="list"]')).toHaveAttribute('aria-pressed', 'true');
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
  await chooseLayout(page, 'list');

  const tutorialIndex = tracks.findIndex((track) => track.stage === 'Tutorial' && track.side === 'A');
  const tutorialCard = page.locator(`.track[data-track-index="${tutorialIndex}"]`);
  await tutorialCard.click({ button: 'right' });
  await expect(page.locator('#trackContextMenu')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#trackContextMenu [data-action="play"]')).toHaveText(/Play Now/);

  await page.locator('#trackContextMenu [data-action="play"]').click();
  await expect(page.locator('#trackContextMenu')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#trackTitle')).toHaveText('Tutorial');

  await tutorialCard.locator('img').click({ force: true });
  await expect(page.locator('#modal')).not.toHaveClass(/hidden/);
  await page.keyboard.press('Escape');
});

test('supports keyboard controls and important dialogs', async ({ page }) => {
  await openPlayer(page, '/?song=Tutorial-A');

  await page.keyboard.press('?');
  await expect(page.locator('#keyboardHint')).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Escape');
  await expect(page.locator('#keyboardHint')).toHaveAttribute('aria-hidden', 'true');

  await page.keyboard.press('f');
  await expect(page.locator('#modal')).not.toHaveClass(/hidden/);
  const fullscreenBackground = await page.locator('#modal').evaluate((element) => {
    const artStyle = getComputedStyle(element.querySelector('.modal-bg'));
    const patternStyle = getComputedStyle(element, '::before');
    return {
      filter: artStyle.filter,
      patternImage: patternStyle.backgroundImage,
      patternSize: patternStyle.backgroundSize,
    };
  });
  expect(fullscreenBackground.filter).toContain('blur(12px)');
  expect(fullscreenBackground.patternImage).toContain('radial-gradient');
  expect(fullscreenBackground.patternSize).toContain('18px 18px');
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toHaveClass(/closing/);
  await page.waitForTimeout(100);
  const closingPatternOpacity = await page.locator('#modal').evaluate((element) => Number(getComputedStyle(element, '::before').opacity));
  expect(closingPatternOpacity).toBeLessThan(0.78);
  expect(closingPatternOpacity).toBeGreaterThan(0);
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

test('restores persisted visual settings, filter, and layout preferences', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gb:reduceAnimations', '1');
    localStorage.setItem('gb:liteMode', '1');
    localStorage.setItem('gb:viewFilter', 'drums-only');
    localStorage.setItem('gb:layoutMode', 'list');
  });

  await openPlayer(page);
  await expect(page.locator('body')).toHaveClass(/reduce-animations/);
  await expect(page.locator('body')).toHaveClass(/lite-mode/);
  await expect(page.locator('#trackList .track')).toHaveCount(expectedCount('drums-only'));
  await expect(page.locator('#trackList')).toHaveClass(/layout-list/);
  await expect(page.locator('#layoutSwitcher [data-layout="list"]')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#settingsBtn').click();
  await expect(page.locator('#toggleReduceAnimations')).toBeChecked();
  await expect(page.locator('#toggleLiteMode')).toBeChecked();
});

test('announces the complete version 3 changelog once per version', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('gb:changelog-seen', '2.1.1'));
  await openPlayer(page);

  const toast = page.locator('#changelogToast');
  await expect(page.locator('.changelog-toast__badge')).toHaveText('v3.0.0');
  await expect(toast).toHaveClass(/visible/);
  await page.locator('#changelogToggle').click();
  await expect(page.locator('#changelogBody')).toHaveClass(/open/);
  await expect(page.locator('.changelog-toast__list li')).toHaveCount(9);
  await expect(page.locator('.changelog-toast__list')).toContainText('Higher-fidelity M4A audio');
  await expect(page.locator('.changelog-toast__list')).toContainText('Custom group sharing');

  await page.locator('#changelogClose').click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('gb:changelog-seen'))).toBe('3.0.0');
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

test('lets the custom-group track picker escape the settings panel boundary', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 520 });
  await page.addInitScript(() => {
    localStorage.setItem('gb:customFilters', JSON.stringify([{
      id: 'picker-group',
      name: 'Picker test',
      mode: 'exclude',
      files: [],
    }]));
    localStorage.setItem('gb:customFiltersActive', 'picker-group');
  });
  await openPlayer(page);
  await page.locator('#settingsBtn').click();
  await page.locator('#settingsTabExclusions').click();
  await page.locator('#customExcludeTrigger').click();

  const menuGeometry = await page.locator('#customExcludeMenu').evaluate((menu) => {
    const rect = menu.getBoundingClientRect();
    return {
      parentIsBody: menu.parentElement === document.body,
      position: getComputedStyle(menu).position,
      top: rect.top,
      bottom: rect.bottom,
      viewportHeight: window.innerHeight,
    };
  });
  expect(menuGeometry.parentIsBody).toBe(true);
  expect(menuGeometry.position).toBe('fixed');
  expect(menuGeometry.top).toBeGreaterThanOrEqual(0);
  expect(menuGeometry.bottom).toBeLessThanOrEqual(menuGeometry.viewportHeight);

  await page.locator('#customExcludeSearch').fill('Tutorial');
  await expect(page.locator('#customExcludeOptions [data-file]').first()).toBeVisible();
  await page.locator('#customExcludeOptions [data-file]').first().click();
  await expect(page.locator('#customExcludeMenu')).toHaveAttribute('aria-hidden', 'true');
  expect(await page.locator('#customExcludeMenu').evaluate((menu) => menu.parentElement?.id)).toBe('customExcludeSelectWrap');
});

test('shares an active custom group with stable catalog identifiers and a manual-copy fallback', async ({ page }) => {
  const menuA = tracks.find((track) => track.stage === 'Menu' && track.side === 'A');
  const aquariumB = tracks.find((track) => track.stage === 'Aquarium' && track.side === 'B');
  await page.addInitScript(({ files }) => {
    localStorage.setItem('gb:customFilters', JSON.stringify([{
      id: 'group-to-share',
      name: 'Favorites ✨',
      mode: 'include',
      files,
    }]));
    localStorage.setItem('gb:customFiltersActive', 'group-to-share');
  }, { files: [menuA.file, aquariumB.file] });

  await openPlayer(page);
  await page.locator('#settingsBtn').click();
  await page.locator('#settingsTabExclusions').click();
  await expect(page.locator('#customGroupShareBtn')).toBeEnabled();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text) => { window.__copiedGroupUrl = text; } },
    });
  });
  await page.locator('#customGroupShareBtn').click();
  await expect(page.locator('#customGroupShareBtn')).toHaveText('Copied!');
  await expect.poll(() => page.evaluate(() => window.__copiedGroupUrl || '')).toContain('?group=');

  await expect(page.locator('#customGroupShareBtn')).toHaveText('Share');
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => { throw new Error('blocked'); };
    document.execCommand = () => false;
  });
  await page.locator('#customGroupShareBtn').click();

  await expect(page.locator('#customGroupShareFallback')).toBeVisible();
  const shareUrl = await page.locator('#customGroupShareUrl').inputValue();
  const parsedUrl = new URL(shareUrl);
  expect(parsedUrl.pathname).toBe('/');
  expect(parsedUrl.searchParams.has('song')).toBe(false);
  const sharedGroup = JSON.parse(Buffer.from(parsedUrl.searchParams.get('group'), 'base64url').toString('utf8'));
  expect(sharedGroup).toEqual({
    v: 1,
    n: 'Favorites ✨',
    m: 'include',
    t: ['Menu-A', 'Aquarium-B'],
  });
});

test('previews a shared group before importing and preserves unrelated URL and filter state', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('gb:viewFilter', 'drums-only'));
  const payload = makeGroupSharePayload({
    name: 'Party picks 🎉',
    mode: 'include',
    trackIds: ['Menu-A', 'Aquarium-B', 'RemovedStage-Z'],
  });
  await openPlayer(page, `/?song=Tutorial-A&group=${payload}`);

  await expect(page.locator('#settingsModal')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#settingsPageExclusions')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#customGroupImportPanel')).toBeVisible();
  await expect(page.locator('#customGroupImportName')).toHaveText('Party picks 🎉');
  await expect(page.locator('#customGroupImportMode')).toHaveText('Include');
  await expect(page.locator('#customGroupImportMatchesLabel')).toHaveText('Included tracks');
  await expect(page.locator('#customGroupImportMatches')).toHaveText('2');
  await expect(page.locator('#customGroupImportUnknown')).toHaveText('1');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('gb:customFilters'))).toBeNull();
  await expect.poll(() => page.evaluate(() => location.search)).toBe('?song=Tutorial-A');
  await expect(page.locator('#trackList .track')).toHaveCount(expectedCount('drums-only'));

  await page.locator('#customGroupImportConfirmBtn').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('gb:customFilters')));
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({
    name: 'Party picks 🎉',
    mode: 'include',
    files: [
      tracks.find((track) => track.stage === 'Menu' && track.side === 'A').file,
      tracks.find((track) => track.stage === 'Aquarium' && track.side === 'B').file,
    ],
  });
  expect(await page.evaluate(() => window.currentViewFilter)).toBe('drums-only');
  expect(await page.evaluate(() => localStorage.getItem('gb:viewFilter'))).toBe('drums-only');
  await expect(page.locator('#trackList .track')).toHaveCount(expectedCount('drums-only'));
  await expect(page.locator('#customGroupImportMessage')).toContainText('Choose it from Filter');
});

test('suffixes same-name imports, deduplicates repeats, and rejects malformed group URLs', async ({ page }) => {
  const menuA = tracks.find((track) => track.stage === 'Menu' && track.side === 'A');
  await page.addInitScript(({ file }) => {
    localStorage.setItem('gb:customFilters', JSON.stringify([{
      id: 'existing-group',
      name: 'Shared group',
      mode: 'exclude',
      files: [file],
    }]));
    localStorage.setItem('gb:customFiltersActive', 'existing-group');
  }, { file: menuA.file });
  await openPlayer(page);
  await page.locator('#settingsBtn').click();
  await page.locator('#settingsTabExclusions').click();
  await page.locator('#customGroupImportToggleBtn').click();

  const payload = makeGroupSharePayload({ name: 'Shared group', mode: 'exclude', trackIds: ['Aquarium-B'] });
  const sharingUrl = `https://example.com/?group=${payload}`;
  await page.locator('#customGroupImportUrl').fill(sharingUrl);
  await page.locator('#customGroupPreviewBtn').click();
  await expect(page.locator('#customGroupImportMatchesLabel')).toHaveText('Excluded tracks');
  await expect(page.locator('#customGroupImportUnknownRow')).toBeHidden();
  await page.locator('#customGroupImportConfirmBtn').click();
  let stored = await page.evaluate(() => JSON.parse(localStorage.getItem('gb:customFilters')));
  expect(stored.map((group) => group.name)).toEqual(['Shared group', 'Shared group (2)']);

  await page.locator('#customGroupImportUrl').fill(sharingUrl);
  await page.locator('#customGroupPreviewBtn').click();
  await page.locator('#customGroupImportConfirmBtn').click();
  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('gb:customFilters')));
  expect(stored).toHaveLength(2);
  expect(await page.evaluate(() => localStorage.getItem('gb:customFiltersActive'))).toBe(stored[1].id);
  await expect(page.locator('#customGroupImportMessage')).toContainText('already exists');

  await page.locator('#customGroupImportUrl').fill('/?group=not-valid-base64');
  await page.locator('#customGroupPreviewBtn').click();
  await expect(page.locator('#customGroupImportMessage')).toHaveClass(/is-error/);
  await expect(page.locator('#customGroupImportPreview')).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gb:customFilters')))).toHaveLength(2);
});

test('rejects unsupported, oversized, and unavailable shared groups without changing storage', async ({ page }) => {
  await openPlayer(page);
  await page.locator('#settingsBtn').click();
  await page.locator('#settingsTabExclusions').click();
  await expect(page.locator('#customGroupShareBtn')).toBeDisabled();
  await page.locator('#customGroupImportToggleBtn').click();

  const invalidUrls = [
    `/?group=${makeGroupSharePayload({ name: 'Future', mode: 'include', trackIds: ['Menu-A'], version: 2 })}`,
    `/?group=${makeGroupSharePayload({ name: 'Missing', mode: 'exclude', trackIds: ['NoLongerHere-Z'] })}`,
    `/?group=${'a'.repeat(8193)}`,
  ];
  const expectedErrors = ['unsupported sharing version', 'None of this group', 'too large'];

  for (let index = 0; index < invalidUrls.length; index += 1) {
    await page.locator('#customGroupImportUrl').fill(invalidUrls[index]);
    await page.locator('#customGroupPreviewBtn').click();
    await expect(page.locator('#customGroupImportMessage')).toContainText(expectedErrors[index]);
    await expect(page.locator('#customGroupImportMessage')).toHaveClass(/is-error/);
    await expect(page.locator('#customGroupImportPreview')).toBeHidden();
  }
  expect(await page.evaluate(() => localStorage.getItem('gb:customFilters'))).toBeNull();
});

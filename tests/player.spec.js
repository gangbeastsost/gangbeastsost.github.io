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
  await page.locator('#searchInput').fill('Tutorial');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Tutorial');
  await page.locator('#searchInput').fill('');

  for (const filter of ['drums-include', 'drums-only', 'exclude', 'only', 'all']) {
    await chooseView(page, filter);
    await expect(cards).toHaveCount(expectedCount(filter));
  }
});

test('plays, pauses, seeks, and changes tracks', async ({ page }) => {
  await openPlayer(page);

  const tutorialIndex = tracks.findIndex((track) => track.stage === 'Tutorial' && track.side === 'A');
  const tutorialCard = page.locator(`.track[data-track-index="${tutorialIndex}"]`);
  await tutorialCard.click();

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

test('downloads an individual track from its MP3 mirror', async ({ page }) => {
  await openPlayer(page, '/?song=Tutorial-A');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#miniDownload').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('Tutorial.mp3');
  expect(download.url()).toMatch(/\/music\/mp3\/Tutorial\.mp3$/);
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

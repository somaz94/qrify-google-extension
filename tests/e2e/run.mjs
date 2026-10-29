#!/usr/bin/env node
// Drives the real popup in Chrome for Testing: what the unit tests cannot see, from Chrome accepting the
// manifest to the DOM glue in src/popup/ that sits outside the coverage gate.
import { launch, ORIGIN } from '../../hack/chrome.mjs';

const POPUP = `${ORIGIN}/src/popup/popup.html`;
let failures = 0;

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(ok ? `  ✓ ${name}` : `  ✗ ${name}\n      expected ${JSON.stringify(expected)}\n      actual   ${JSON.stringify(actual)}`);
}

// A real alert() would block every later DevTools call, so the page records them instead.
const CAPTURE_ALERTS = `window.alerts = []; window.alert = (message) => window.alerts.push(message);`;

/** Types `text`, clicks Generate and waits for the image the QR library draws from its canvas. */
const generate = (popup, text) => popup.evaluate(`(async () => {
  document.getElementById('qr-text').value = ${JSON.stringify(text)};
  document.getElementById('generate-btn').click();
  return waitForImage();
})()`);

const WAIT_FOR_IMAGE = `window.waitForImage = async () => {
  for (let i = 0; i < 50; i += 1) {
    const img = document.querySelector('#qr-code img');
    if (img?.src.startsWith('data:image/png')) return { width: img.naturalWidth, height: img.naturalHeight };
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
};`;

const state = (popup) => popup.evaluate(`({
  buttons: ['download-btn', 'share-btn'].filter((id) => !document.getElementById(id).classList.contains('hidden')),
  history: [...document.querySelectorAll('.history-item .history-text')].map((item) => item.textContent),
  theme: document.documentElement.getAttribute('data-theme'),
  alerts: window.alerts,
})`);

async function prepare(popup) {
  await popup.evaluate(`chrome.storage.local.clear()`);
  await popup.reload();
  await popup.evaluate(CAPTURE_ALERTS + WAIT_FOR_IMAGE);
}

async function generating(popup) {
  console.log('generating');
  await prepare(popup);
  check('nothing to download before a code exists', (await state(popup)).buttons, []);
  check('Generate draws a 128 px code by default', await generate(popup, 'https://example.com'), { width: 128, height: 128 });
  check('Download and Share appear', (await state(popup)).buttons, ['download-btn', 'share-btn']);

  const resized = await popup.evaluate(`(async () => {
    const size = document.getElementById('qr-size');
    size.value = '256';
    size.dispatchEvent(new Event('change'));
    return waitForImage();
  })()`);
  check('changing the size redraws the code', resized, { width: 256, height: 256 });

  await popup.evaluate(`document.getElementById('qr-text').value = '   '; document.getElementById('generate-btn').click()`);
  check('an empty input asks for text', (await state(popup)).alerts, ['Enter some text first.']);

  const url = await popup.evaluate(`(async () => {
    document.getElementById('current-url-btn').click();
    for (let i = 0; i < 50 && !document.getElementById('qr-text').value.startsWith('chrome-extension:'); i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return document.getElementById('qr-text').value;
  })()`);
  check('Current page URL fills in the active tab', url, POPUP);
}

async function history(popup) {
  console.log('history');
  await prepare(popup);
  await generate(popup, 'first');
  await generate(popup, 'second');
  check('the newest entry is listed first', (await state(popup)).history.slice(0, 2), ['second', 'first']);

  await popup.reload();
  await popup.evaluate(CAPTURE_ALERTS + WAIT_FOR_IMAGE);
  check('history survives reopening the popup', (await state(popup)).history.slice(0, 2), ['second', 'first']);

  const restored = await popup.evaluate(`(async () => {
    document.querySelectorAll('.history-item')[1].click();
    await waitForImage();
    return document.getElementById('qr-text').value;
  })()`);
  check('clicking an entry brings its text back', restored, 'first');
}

async function menus(chrome) {
  console.log('right-click menus');
  const worker = await chrome.serviceWorker();
  check('the manifest starts the service worker', worker.url, `${ORIGIN}/src/background/background.js`);
  // update() rejects for an id that was never created, so this proves all three menus exist.
  const created = await worker.evaluate(`Promise.all(['generateQR', 'generateQRFromImage', 'generateQRFromLink']
    .map((id) => chrome.contextMenus.update(id, {}).then(() => id, () => null)))`);
  check('the three menus are created', created, ['generateQR', 'generateQRFromImage', 'generateQRFromLink']);

  const popup = await chrome.open(`${POPUP}?text=${encodeURIComponent('hello & "world"')}`);
  await popup.evaluate(WAIT_FOR_IMAGE);
  const opened = await popup.evaluate(`(async () => ({ text: document.getElementById('qr-text').value, image: !!(await waitForImage()) }))()`);
  check('a menu click opens the page with its text drawn', opened, { text: 'hello & "world"', image: true });
  check('no errors on the menu page', popup.problems(), []);
  await popup.close();
}

async function theme(popup) {
  console.log('theme');
  await prepare(popup);
  check('starts light', (await state(popup)).theme, 'light');
  await popup.evaluate(`document.getElementById('theme-toggle').click()`);
  check('the toggle switches to dark', (await state(popup)).theme, 'dark');
  await popup.reload();
  check('dark survives reopening the popup', (await state(popup)).theme, 'dark');
}

async function korean(chrome) {
  console.log('Korean UI');
  const popup = await chrome.open(POPUP);
  const shown = await popup.evaluate(`({
    lang: document.documentElement.lang,
    generate: document.getElementById('generate-btn').textContent,
  })`);
  check('the popup follows a Korean browser', shown, { lang: 'ko', generate: 'QR 코드 생성' });
  check('no errors in Korean', popup.problems(), []);
}

const chrome = await launch();
try {
  const popup = await chrome.open(POPUP);
  await generating(popup);
  await history(popup);
  await theme(popup);
  await menus(chrome);
  console.log('errors');
  check('no uncaught exceptions or console errors', popup.problems(), []);
} finally {
  await chrome.close();
}

const korean_ = await launch({ language: 'ko' });
try {
  await korean(korean_);
} finally {
  await korean_.close();
}

if (failures) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');

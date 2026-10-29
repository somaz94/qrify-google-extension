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

// The popup shows problems inline; a real alert() would also block every later DevTools call, so any is recorded.
const CAPTURE_ALERTS = `window.alerts = []; window.alert = (message) => window.alerts.push(message);`;

/** Types `text`, clicks Generate and waits for the image the QR library draws from its canvas. */
const generate = (popup, text) => popup.evaluate(`(async () => {
  const list = document.querySelector('.history-section');
  document.getElementById('qr-text').value = ${JSON.stringify(text)};
  document.getElementById('generate-btn').click();
  return waitForImage(list);
})()`);

// Generating saves to the history before it redraws the list, so a check waits for the new list too.
const WAIT_FOR_IMAGE = `window.waitForImage = async (previousList = document.querySelector('.history-section')) => {
  for (let i = 0; i < 50 && document.querySelector('.history-section') === previousList; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  for (let i = 0; i < 50; i += 1) {
    const img = document.querySelector('#qr-code img');
    if (img?.src.startsWith('data:image/png') && img.complete && img.naturalWidth) return { width: img.naturalWidth, height: img.naturalHeight };
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
};`;

const state = (popup) => popup.evaluate(`({
  buttons: ['download-btn', 'share-btn'].filter((id) => !document.getElementById(id).classList.contains('hidden')),
  history: [...document.querySelectorAll('.history-item .history-text')].map((item) => item.textContent),
  theme: document.documentElement.getAttribute('data-theme'),
  alerts: window.alerts,
  message: document.getElementById('message').hidden ? '' : document.getElementById('message').textContent,
})`);

async function prepare(popup) {
  await popup.evaluate(`chrome.storage.local.clear(); localStorage.clear()`);
  await popup.reload();
  await popup.evaluate(CAPTURE_ALERTS + WAIT_FOR_IMAGE);
}

async function generating(popup) {
  console.log('generating');
  await prepare(popup);
  check('nothing to download before a code exists', (await state(popup)).buttons, []);
  // 'https://example.com' at the highest error correction is version 3, 29 modules of 4 px plus 4 modules a side.
  check('Generate draws a Small code with its margin', await generate(popup, 'https://example.com'), { width: 148, height: 148 });
  const edges = await popup.evaluate(`(() => {
    const img = document.querySelector('#qr-code img');
    const canvas = Object.assign(document.createElement('canvas'), { width: img.naturalWidth, height: img.naturalHeight });
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    const dark = (x) => context.getImageData(x, x, 1, 1).data[0] < 128;
    let first = 0;
    while (!dark(first)) first += 1;
    return { corner: dark(0), first };
  })()`);
  check('the code sits inside a light margin of four modules', edges, { corner: false, first: 16 });
  check('Download and Share appear', (await state(popup)).buttons, ['download-btn', 'share-btn']);

  const resized = await popup.evaluate(`(async () => {
    const size = document.getElementById('qr-size');
    size.value = '256';
    size.dispatchEvent(new Event('change'));
    return waitForImage();
  })()`);
  check('changing the size redraws the code', resized, { width: 296, height: 296 });

  const large = await popup.evaluate(`(async () => {
    const size = document.getElementById('qr-size');
    size.value = '512';
    size.dispatchEvent(new Event('change'));
    await waitForImage();
    const img = document.querySelector('#qr-code img');
    return { natural: img.naturalWidth > 512, fits: document.body.scrollWidth <= innerWidth && img.getBoundingClientRect().width <= innerWidth };
  })()`);
  check('a Large code keeps its pixels but fits the popup', large, { natural: true, fits: true });
  const layout = await popup.evaluate(`(() => {
    const color = document.getElementById('qr-color');
    const style = getComputedStyle(color);
    const swatch = color.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const item = document.querySelector('.history-item');
    const text = item.querySelector('.history-text').getBoundingClientRect();
    const time = item.querySelector('.history-time').getBoundingClientRect();
    return { swatch: swatch >= 16, apart: time.left - text.right >= 4, oneLine: Math.abs(text.top - time.top) < 2 };
  })()`);
  check('color swatches show and a recent entry keeps its text and time apart', layout, { swatch: true, apart: true, oneLine: true });

  check('a redraw does not add the same text again', (await state(popup)).history, ['https://example.com']);

  await popup.evaluate(`document.getElementById('qr-text').value = '   '; document.getElementById('generate-btn').click()`);
  check('an empty input asks for text, in the popup', await state(popup).then(({ alerts, message }) => ({ alerts, message })), { alerts: [], message: 'Enter some text first.' });
  await popup.evaluate(`document.getElementById('qr-color').dispatchEvent(new Event('change'))`);
  check('changing a color with no text says nothing new', await state(popup).then(({ alerts, message }) => ({ alerts, message })), { alerts: [], message: 'Enter some text first.' });
  await popup.evaluate(`document.getElementById('qr-text').dispatchEvent(new Event('input'))`);
  check('typing clears the message', (await state(popup)).message, '');

  const url = await popup.evaluate(`(async () => {
    document.getElementById('current-url-btn').click();
    for (let i = 0; i < 50 && !document.getElementById('qr-text').value.startsWith('chrome-extension:'); i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return document.getElementById('qr-text').value;
  })()`);
  check('Current page URL fills in the active tab', url, POPUP);
}

// BarcodeDetector reads QR codes in Chrome on macOS but not on Linux, so CI checks the encoding in the unit tests only.
async function typing(popup) {
  console.log('typing');
  await prepare(popup);
  const previewed = await popup.evaluate(`(async () => {
    const input = document.getElementById('qr-text');
    input.value = 'typed';
    input.dispatchEvent(new Event('input'));
    const drawn = !!(await waitForImage(null));
    return { drawn, listed: document.querySelectorAll('.history-item').length };
  })()`);
  check('a pause in typing draws the code without listing it', previewed, { drawn: true, listed: 0 });

  const listed = await popup.evaluate(`(async () => {
    const input = document.getElementById('qr-text');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 300));
    const whileComposing = document.querySelectorAll('.history-item').length;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await waitForImage();
    return { whileComposing, after: [...document.querySelectorAll('.history-text')].map((item) => item.textContent) };
  })()`);
  check('Enter lists it, but not while an IME is composing', listed, { whileComposing: 0, after: ['typed'] });

  const cleared = await popup.evaluate(`(async () => {
    const input = document.getElementById('qr-text');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { code: !!document.querySelector('#qr-code img'), buttons: !document.getElementById('download-btn').classList.contains('hidden') };
  })()`);
  check('emptying the input clears the code', cleared, { code: false, buttons: false });
  check('previewing never alerts', (await state(popup)).alerts, []);
}

async function style(popup) {
  console.log('colors and size');
  await prepare(popup);
  check('a first run starts black on white at Small', await popup.evaluate(`[document.getElementById('qr-color').value, document.getElementById('bg-color').value, document.getElementById('qr-size').value]`), ['#000000', '#ffffff', '128']);
  await popup.evaluate(`(() => {
    for (const [id, value] of [['qr-color', '#1a237e'], ['bg-color', '#fff8e1'], ['qr-size', '256']]) {
      const control = document.getElementById(id);
      control.value = value;
      control.dispatchEvent(new Event('change'));
    }
  })()`);
  await popup.reload();
  check('the popup reopens on the colors and size picked last', await popup.evaluate(`[document.getElementById('qr-color').value, document.getElementById('bg-color').value, document.getElementById('qr-size').value]`), ['#1a237e', '#fff8e1', '256']);
}

async function unicode(popup) {
  console.log('unicode');
  await prepare(popup);
  const canDecode = await popup.evaluate(`(async () => 'BarcodeDetector' in window && (await BarcodeDetector.getSupportedFormats()).includes('qr_code'))()`);
  for (const text of ['3번 게이트에서 10시 30분에 만나요', 'Café 😀 🎉', 'https://example.com/?q=한글&x=1']) {
    const drawn = !!(await generate(popup, text));
    const decoded = canDecode
      ? await popup.evaluate(`(async () => (await new BarcodeDetector({ formats: ['qr_code'] }).detect(document.querySelector('#qr-code img')))[0]?.rawValue)()`)
      : text;
    check(`draws and scans back ${JSON.stringify(text)}`, { drawn, decoded }, { drawn: true, decoded: text });
  }
  if (!canDecode) console.log('    (no BarcodeDetector here: drawn, not scanned)');

  await popup.evaluate(`document.getElementById('qr-text').value = 'x'.repeat(5000); document.getElementById('generate-btn').click()`);
  check('a text too long for a QR code says so', await state(popup).then(({ alerts, message }) => ({ alerts, message })), { alerts: [], message: 'This text is too long for a QR code.' });
  await generate(popup, 'short again');
  check('a drawn code clears the message', (await state(popup)).message, '');
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
  check('and moves it up instead of adding it again', (await state(popup)).history, ['first', 'second']);

  const tricky = 'say "hi" <b>bold</b> & more';
  await generate(popup, tricky);
  const shown = await popup.evaluate(`(async () => {
    const item = document.querySelector('.history-item');
    const listed = { text: item.querySelector('.history-text').textContent, markup: !!item.querySelector('b') };
    document.getElementById('qr-text').value = '';
    item.click();
    await waitForImage();
    return { ...listed, restored: document.getElementById('qr-text').value };
  })()`);
  check('quotes and markup are listed and restored as plain text', shown, { text: tricky, markup: false, restored: tricky });
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
  const opened = await popup.evaluate(`(async () => ({ text: document.getElementById('qr-text').value, image: !!(await waitForImage(null)) }))()`);
  check('a menu click opens the page with its text drawn', opened, { text: 'hello & "world"', image: true });
  check('no errors on the menu page', popup.problems(), []);
  await popup.close();
}

// WCAG AA asks 4.5:1 for normal text.
const BUTTON_CONTRAST = `(() => {
  const luminance = (color) => {
    const [r, g, b] = color.match(/\\d+/g).slice(0, 3).map((value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  return ['generate-btn', 'current-url-btn', 'download-btn', 'share-btn'].filter((id) => {
    const style = getComputedStyle(document.getElementById(id));
    const [light, dark] = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
    return (light + 0.05) / (dark + 0.05) < 4.5;
  });
})()`;

// Headless Chrome follows the host's dark mode, so every check pins the system scheme first.
const systemScheme = async (popup, scheme) => {
  await popup.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
  await popup.evaluate(`new Promise((resolve) => setTimeout(resolve, 200))`);
};
const toggleTheme = (popup) => popup.evaluate(`(() => {
  const toggle = document.getElementById('theme-toggle');
  toggle.click();
  return toggle.textContent;
})()`);
// The buttons fade to the new colors over 0.2 s.
const settle = (popup) => popup.evaluate(`new Promise((resolve) => setTimeout(resolve, 300))`);

async function theme(popup) {
  console.log('theme');
  await prepare(popup);
  await systemScheme(popup, 'dark');
  check('follows a dark system by default', [(await state(popup)).theme, await popup.evaluate(`document.getElementById('theme-toggle').textContent`)], ['dark', '🌓']);
  await systemScheme(popup, 'light');
  check('and repaints when the system turns light', (await state(popup)).theme, 'light');

  await systemScheme(popup, 'dark');
  check('the toggle picks light over a dark system', [await toggleTheme(popup), (await state(popup)).theme], ['☀️', 'light']);
  await settle(popup);
  check('button text is readable in the light theme', await popup.evaluate(BUTTON_CONTRAST), []);
  check('then dark', [await toggleTheme(popup), (await state(popup)).theme], ['🌙', 'dark']);
  await settle(popup);
  check('button text is readable in the dark theme', await popup.evaluate(BUTTON_CONTRAST), []);
  await popup.reload();
  check('dark survives reopening the popup', (await state(popup)).theme, 'dark');
  check('then back to following the system', await toggleTheme(popup), '🌓');

  await popup.evaluate(`(async () => { localStorage.clear(); await chrome.storage.local.set({ theme: 'light' }); })()`);
  await popup.reload();
  const migrated = await popup.evaluate(`(async () => ({
    theme: document.documentElement.getAttribute('data-theme'),
    stored: localStorage.getItem('theme'),
    legacy: (await chrome.storage.local.get('theme')).theme ?? null,
  }))()`);
  check('a light theme picked in 1.1 carries over', migrated, { theme: 'light', stored: 'light', legacy: null });
  await popup.send('Emulation.setEmulatedMedia', { features: [] });
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
  await typing(popup);
  await style(popup);
  await unicode(popup);
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

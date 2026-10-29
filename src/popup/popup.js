import { applyTranslations, t } from '../i18n.js';
import { debounce } from '../lib/debounce.js';
import { addEntry, loadHistory, newestFirst, removeEntry, saveHistory } from '../lib/history.js';
import { queuedText } from '../lib/menus.js';
import { encode, layout, paint } from '../lib/qr.js';
import { loadStyle, saveStyle, validStyle } from '../lib/style.js';
import qrcode from '../vendor/qrcode.js';
import { createThemer, migrateTheme, themeIcon, themeTitle } from '../lib/theme.js';

const storage = chrome.storage.local;
const qrText = document.getElementById('qr-text');
const qrCodeDiv = document.getElementById('qr-code');
const qrColor = document.getElementById('qr-color');
const bgColor = document.getElementById('bg-color');
const qrSize = document.getElementById('qr-size');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const themeToggle = document.getElementById('theme-toggle');
const message = document.getElementById('message');

/** Draws the code for the input; `save` also adds it to the recent list, `quiet` keeps problems unsaid. */
function generateQRCode({ quiet = false, save = true } = {}) {
  const text = qrText.value.trim();
  if (!text) {
    clearCode();
    if (!quiet) say('errorEmptyText');
    return;
  }

  const modules = encode(text, qrcode);
  if (!modules) {
    if (!quiet) say('errorTooLong');
    return;
  }
  say(null);
  qrCodeDiv.replaceChildren(drawCode(text, modules));
  downloadBtn.classList.remove('hidden');
  shareBtn.classList.remove('hidden');
  if (save) remember(text);
}

/** Shows the message for `key` under the input, or hides it for `null`. */
function say(key) {
  message.hidden = !key;
  message.textContent = key ? t(key) : '';
}

function clearCode() {
  qrCodeDiv.replaceChildren();
  downloadBtn.classList.add('hidden');
  shareBtn.classList.add('hidden');
}

// While typing, the code follows the input without filling the recent list; Enter or Generate saves it.
const preview = debounce(() => generateQRCode({ quiet: true, save: false }), 300);

function drawCode(text, modules) {
  const box = layout(Number.parseInt(qrSize.value, 10), modules.length);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = box.total;
  paint(canvas.getContext('2d'), modules, box, { dark: qrColor.value, light: bgColor.value });

  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.alt = text;
  return img;
}

async function remember(text) {
  const entry = { text, timestamp: new Date().toISOString(), qrColor: qrColor.value, bgColor: bgColor.value, size: qrSize.value };
  await updateHistory(addEntry(await loadHistory(storage), entry));
}

function renderHistory(history) {
  document.querySelector('.history-section')?.remove();
  if (!history.length) return;

  const section = element('div', 'history-section');
  const header = element('div', 'history-header');
  const title = element('h3');
  title.textContent = t('historyTitle');
  const clear = element('button', 'history-clear');
  clear.textContent = t('historyClear');
  clear.addEventListener('click', () => updateHistory([]));
  header.append(title, clear);

  const list = element('div', 'history-list');
  for (const entry of newestFirst(history)) {
    const item = element('div', 'history-item');
    const text = element('span', 'history-text');
    text.textContent = entry.text;
    const time = element('span', 'history-time');
    time.textContent = new Date(entry.timestamp).toLocaleString();
    const remove = element('button', 'history-remove');
    remove.textContent = '×';
    remove.title = t('historyRemove');
    remove.setAttribute('aria-label', remove.title);
    remove.addEventListener('click', async (event) => {
      event.stopPropagation();
      updateHistory(removeEntry(await loadHistory(storage), entry.text));
    });
    item.append(text, time, remove);
    item.addEventListener('click', () => {
      qrText.value = entry.text;
      showStyle(validStyle(entry));
      restyle();
    });
    list.append(item);
  }
  section.append(header, list);
  document.querySelector('.container').append(section);
}

async function updateHistory(history) {
  await saveHistory(storage, history);
  renderHistory(history);
}

function element(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

async function shareQRCode() {
  const img = qrCodeDiv.querySelector('img');
  if (!img || !navigator.share) {
    say('shareUnsupported');
    return;
  }
  remember(img.alt);
  try {
    const blob = await (await fetch(img.src)).blob();
    const file = new File([blob], 'qrcode.png', { type: 'image/png' });
    await navigator.share({ title: t('shareTitle'), text: t('shareText'), files: [file] });
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Sharing failed:', error);
      say('shareFailed');
    }
  }
}

function downloadQRCode() {
  const img = qrCodeDiv.querySelector('img');
  if (!img) return;
  remember(img.alt);
  const link = document.createElement('a');
  link.download = 'qrify-code.png';
  link.href = img.src;
  link.click();
}

async function useCurrentTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  qrText.value = tab.url;
  generateQRCode();
}

function currentStyle() {
  return { qrColor: qrColor.value, bgColor: bgColor.value, size: qrSize.value };
}

function showStyle(style) {
  qrColor.value = style.qrColor;
  bgColor.value = style.bgColor;
  qrSize.value = style.size;
}

function restyle() {
  saveStyle(storage, currentStyle());
  generateQRCode({ quiet: true });
}

function renderTheme(setting) {
  themeToggle.textContent = themeIcon(setting);
  themeToggle.title = t(themeTitle(setting));
  themeToggle.setAttribute('aria-label', themeToggle.title);
}

document.getElementById('generate-btn').addEventListener('click', () => {
  preview.cancel();
  generateQRCode();
});
qrText.addEventListener('input', () => {
  say(null);
  preview();
});
qrText.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.isComposing) return;
  preview.cancel();
  generateQRCode();
});
document.getElementById('current-url-btn').addEventListener('click', useCurrentTabUrl);
downloadBtn.addEventListener('click', downloadQRCode);
shareBtn.addEventListener('click', shareQRCode);
for (const control of [qrColor, bgColor, qrSize]) control.addEventListener('change', restyle);
themeToggle.addEventListener('click', () => renderTheme(themer.toggle()));

applyTranslations();
const themer = createThemer(document);
renderTheme(themer.current());
migrateTheme(storage).then((moved) => moved && renderTheme(themer.refresh()));

async function start() {
  showStyle(await loadStyle(storage));
  renderHistory(await loadHistory(storage));

  // Set by a right-click menu, which opens this page in a tab.
  const queued = queuedText(location.search);
  if (queued) {
    qrText.value = queued;
    generateQRCode();
  }
}

start();

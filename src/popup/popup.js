import { applyTranslations, t } from '../i18n.js';
import { addEntry, loadHistory, newestFirst, saveHistory } from '../lib/history.js';
import { queuedText } from '../lib/menus.js';
import { qrOptions } from '../lib/qr.js';
import { loadTheme, nextTheme, saveTheme, THEME_ICONS, THEME_TITLES } from '../lib/theme.js';

const storage = chrome.storage.local;
const qrText = document.getElementById('qr-text');
const qrCodeDiv = document.getElementById('qr-code');
const qrColor = document.getElementById('qr-color');
const bgColor = document.getElementById('bg-color');
const qrSize = document.getElementById('qr-size');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const themeToggle = document.getElementById('theme-toggle');

function generateQRCode() {
  const text = qrText.value.trim();
  if (!text) {
    alert(t('errorEmptyText'));
    return;
  }

  qrCodeDiv.innerHTML = '';
  new QRCode(qrCodeDiv, qrOptions({ text, size: qrSize.value, dark: qrColor.value, light: bgColor.value }, QRCode.CorrectLevel));
  downloadBtn.classList.remove('hidden');
  shareBtn.classList.remove('hidden');
  remember(text);
}

async function remember(text) {
  const entry = { text, timestamp: new Date().toISOString(), qrColor: qrColor.value, bgColor: bgColor.value, size: qrSize.value };
  const history = addEntry(await loadHistory(storage), entry);
  await saveHistory(storage, history);
  renderHistory(history);
}

function renderHistory(history) {
  document.querySelector('.history-section')?.remove();

  const section = element('div', 'history-section');
  const title = element('h3');
  title.textContent = t('historyTitle');
  const list = element('div', 'history-list');
  for (const entry of newestFirst(history)) {
    const item = element('div', 'history-item');
    const text = element('span', 'history-text');
    text.textContent = entry.text;
    const time = element('span', 'history-time');
    time.textContent = new Date(entry.timestamp).toLocaleString();
    item.append(text, time);
    item.addEventListener('click', () => {
      qrText.value = entry.text;
      qrColor.value = entry.qrColor;
      bgColor.value = entry.bgColor;
      qrSize.value = entry.size;
      generateQRCode();
    });
    list.append(item);
  }
  section.append(title, list);
  document.querySelector('.container').append(section);
}

function element(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

async function shareQRCode() {
  const img = qrCodeDiv.querySelector('img');
  if (!img || !navigator.share) {
    alert(t('shareUnsupported'));
    return;
  }
  try {
    const blob = await (await fetch(img.src)).blob();
    const file = new File([blob], 'qrcode.png', { type: 'image/png' });
    await navigator.share({ title: t('shareTitle'), text: t('shareText'), files: [file] });
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Sharing failed:', error);
      alert(t('shareFailed'));
    }
  }
}

function downloadQRCode() {
  const img = qrCodeDiv.querySelector('img');
  if (!img) return;
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

function showTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = THEME_ICONS[theme];
  themeToggle.title = t(THEME_TITLES[theme]);
}

document.getElementById('generate-btn').addEventListener('click', generateQRCode);
document.getElementById('current-url-btn').addEventListener('click', useCurrentTabUrl);
downloadBtn.addEventListener('click', downloadQRCode);
shareBtn.addEventListener('click', shareQRCode);
for (const control of [qrColor, bgColor, qrSize]) control.addEventListener('change', generateQRCode);
themeToggle.addEventListener('click', () => {
  const theme = nextTheme(document.documentElement.getAttribute('data-theme'));
  showTheme(theme);
  saveTheme(storage, theme);
});

applyTranslations();
loadTheme(storage).then(showTheme);
loadHistory(storage).then((history) => {
  if (history.length) renderHistory(history);
});

// Set by a right-click menu, which opens this page in a tab.
const queued = queuedText(location.search);
if (queued) {
  qrText.value = queued;
  generateQRCode();
}

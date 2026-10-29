#!/usr/bin/env node
// Regenerates the Chrome Web Store images in store/: draws four codes in the popup in each language and lays
// the captures out with hack/store-slide.html as 1280x800 screenshots, plus the 440x280 small promo tile. The store
// takes localized screenshots but one promo tile for every language, so the tile is drawn in English only.
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { launch, ORIGIN, ROOT } from './chrome.mjs';

// The recent list shows its times in this zone.
const LANGUAGES = { en: 'America/New_York', ko: 'Asia/Seoul' };
const PROMO_LANGUAGE = 'en';
const POPUP = `${ORIGIN}/src/popup/popup.html`;

const RECENT = [
  { text: 'https://example.com/menu', timestamp: '2026-03-24T09:12:00Z', qrColor: '#000000', bgColor: '#ffffff', size: '128' },
  { text: 'WIFI:T:WPA;S:Guest;P:welcome2026;;', timestamp: '2026-03-24T10:05:00Z', qrColor: '#000000', bgColor: '#ffffff', size: '128' },
];

// One popup capture per slide, in slide order. `queued` opens the page as a right-click menu does.
const SHOTS = [
  { text: 'https://github.com/somaz94/qrify-google-extension', recent: RECENT },
  { text: 'https://example.com/event', qrColor: '#1a237e', bgColor: '#fff8e1', size: '256' },
  { queued: { en: 'Meet at gate 3 at 10:30', ko: '3번 게이트에서 10시 30분에 만나요' } },
  { text: 'https://example.com/menu', theme: 'dark', recent: RECENT },
];

const work = mkdtempSync(join(tmpdir(), 'qrify-store-'));
try {
  for (const [language, timeZone] of Object.entries(LANGUAGES)) {
    const browser = await launch({ language, timeZone });
    try {
      const dir = join(work, language);
      mkdirSync(dir);
      for (const [index, shot] of SHOTS.entries()) {
        const setup = await browser.open(POPUP);
        await setup.evaluate(`(async () => {
          await chrome.storage.local.clear();
          await chrome.storage.local.set(${JSON.stringify({ qrHistory: shot.recent ?? [] })});
          localStorage.setItem('theme', ${JSON.stringify(shot.theme ?? 'light')});
        })()`);
        await setup.close();

        const url = shot.queued ? `${POPUP}?${new URLSearchParams({ text: shot.queued[language] })}` : POPUP;
        const popup = await browser.open(url, { width: 352, height: 900, scale: 2 });
        if (!shot.queued) {
          await popup.evaluate(`(() => {
            document.getElementById('qr-text').value = ${JSON.stringify(shot.text)};
            document.getElementById('qr-color').value = ${JSON.stringify(shot.qrColor ?? '#000000')};
            document.getElementById('bg-color').value = ${JSON.stringify(shot.bgColor ?? '#ffffff')};
            document.getElementById('qr-size').value = ${JSON.stringify(shot.size ?? '128')};
            document.getElementById('generate-btn').click();
          })()`);
        }
        await sleep(500);
        await popup.shoot(join(dir, `popup-${index + 1}.png`), 'body');
        await popup.close();
      }

      copyFileSync(join(ROOT, 'hack', 'store-slide.html'), join(dir, 'slide.html'));
      copyFileSync(join(ROOT, 'icons', 'icon128.png'), join(dir, 'icon.png'));
      const out = join(ROOT, 'store', 'screenshots', language);
      mkdirSync(out, { recursive: true });
      for (let n = 0; n < SHOTS.length; n += 1) {
        const slide = await browser.open(`file://${join(dir, 'slide.html')}?lang=${language}&n=${n}`, { width: 1280, height: 800 });
        await sleep(500);
        await slide.shoot(join(out, `${n + 1}.png`));
        await slide.close();
      }
      console.log(`store/screenshots/${language}: ${SHOTS.length} screenshots`);
      if (language === PROMO_LANGUAGE) {
        const promo = await browser.open(`file://${join(dir, 'slide.html')}?lang=${language}&promo`, { width: 440, height: 280 });
        await sleep(500);
        await promo.shoot(join(ROOT, 'store', 'promo-small.png'));
        await promo.close();
        console.log('store/promo-small.png');
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

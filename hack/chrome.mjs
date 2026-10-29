// Loads the unpacked extension into Chrome for Testing (branded Chrome ignores --load-extension) and drives
// its pages over the DevTools protocol with Node's built-in WebSocket, so neither user adds a dependency.
// Shared by `make e2e` and `make store-screenshots`. Needs Node 22+ and, the first time, network access to
// download Chrome for Testing; QRIFY_CHROME points at a Chromium you already have instead.
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

export const ROOT = realpathSync(join(dirname(fileURLToPath(import.meta.url)), '..'));
const CACHE = join(process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache'), 'qrify-chrome');
// Well above the slowest call, so only one that will never be answered trips it.
const SEND_TIMEOUT = 20000;

function chromeBinary() {
  if (process.env.QRIFY_CHROME) return process.env.QRIFY_CHROME;
  const out = execFileSync('npx', ['--yes', '@puppeteer/browsers', 'install', 'chrome@stable', '--path', CACHE], { encoding: 'utf8' });
  const match = /^chrome@\S+ (.+)$/m.exec(out);
  if (!match) throw new Error(`Could not find the Chrome for Testing path in:\n${out}`);
  return match[1].trim();
}

// Chrome on macOS takes its UI language from AppleLanguages and ignores --lang. Headless Chrome reads the
// `(ko)` value as the one page to open, so it replaces about:blank there instead of joining it.
const languageArgs = (language) => (process.platform === 'darwin' ? ['-AppleLanguages', `(${language})`] : [`--lang=${language}`, 'about:blank']);

// An unpacked extension's id is the SHA-256 of its path, hex digits mapped onto a-p.
const extensionId = [...createHash('sha256').update(ROOT).digest('hex').slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join('');
export const ORIGIN = `chrome-extension://${extensionId}`;

/** Starts Chrome with the extension in `language` and `timeZone`; `close()` stops it and removes its profile. */
export async function launch({ language = 'en', timeZone = 'UTC' } = {}) {
  const work = mkdtempSync(join(tmpdir(), 'qrify-chrome-'));
  const args = [
    '--headless=new', `--user-data-dir=${work}`, '--remote-debugging-port=0',
    `--load-extension=${ROOT}`, `--disable-extensions-except=${ROOT}`, '--no-first-run', '--no-default-browser-check',
    // Otherwise macOS asks for the login keychain password and Chrome stalls until someone answers.
    '--disable-gpu', '--use-mock-keychain', '--password-store=basic', '--hide-scrollbars', '--allow-file-access-from-files',
  ];
  // GitHub's Ubuntu runners restrict the user namespaces Chrome's sandbox needs.
  if (process.env.CI) args.push('--no-sandbox');
  const chrome = spawn(chromeBinary(), [...args, ...languageArgs(language)], {
    stdio: 'ignore',
    env: { ...process.env, TZ: timeZone, LANG: `${language}.UTF-8`, LANGUAGE: language },
  });

  const portFile = join(work, 'DevToolsActivePort');
  // Chrome can create the file before it has written both lines.
  const readPort = () => (existsSync(portFile) ? readFileSync(portFile, 'utf8').trim().split('\n') : []);
  for (let i = 0; i < 200 && readPort().length < 2; i += 1) await sleep(100);
  const [port, path] = readPort();
  if (!port) throw new Error('Chrome did not start');
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const problems = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const call = pending.get(message.id);
      if (!call) return;
      pending.delete(message.id);
      clearTimeout(call.timer);
      if (message.error) call.reject(new Error(`${call.method}: ${message.error.message}`));
      else call.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params.exceptionDetails;
      problems.get(message.sessionId)?.push(details.exception?.description ?? details.text);
    } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      problems.get(message.sessionId)?.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    }
  });
  const send = (method, params = {}, sessionId = undefined) => new Promise((resolve, reject) => {
    nextId += 1;
    const id = nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method}: no answer in ${SEND_TIMEOUT} ms`));
    }, SEND_TIMEOUT);
    pending.set(id, { method, resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

  /** `userGesture` runs the expression as if the user had just clicked, which APIs such as the clipboard require. */
  const evaluator = (sessionId) => async (expression, { userGesture = false } = {}) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture }, sessionId);
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value;
  };

  /** Opens `url` in a new tab of `width` x `height` CSS pixels and waits for it to load. */
  async function open(url, { width = 552, height = 700, scale = 1 } = {}) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    problems.set(sessionId, []);
    await send('Runtime.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false }, sessionId);
    const evaluate = evaluator(sessionId);
    const ready = async () => {
      for (let i = 0; i < 100; i += 1) {
        try {
          if (await evaluate('document.readyState === "complete"')) return;
        } catch {
          // Still navigating.
        }
        await sleep(100);
      }
      throw new Error(`${url} did not load`);
    };
    await send('Page.navigate', { url }, sessionId);
    await ready();
    return {
      evaluate,
      ready,
      /** A raw DevTools call on this tab, such as `Emulation.setEmulatedMedia`. */
      send: (method, params) => send(method, params, sessionId),
      /** Uncaught exceptions and console errors the page has reported so far. */
      problems: () => [...problems.get(sessionId)],
      async reload() {
        await send('Page.reload', {}, sessionId);
        await sleep(200);
        await ready();
      },
      async shoot(file, selector = null) {
        const clip = selector
          ? await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height, scale: 1 }; })()`)
          : { x: 0, y: 0, width, height, scale: 1 };
        const { data } = await send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true }, sessionId);
        writeFileSync(file, Buffer.from(data, 'base64'));
      },
      close: () => send('Target.closeTarget', { targetId }),
    };
  }

  /** The URLs of every open tab. */
  async function pageUrls() {
    const { targetInfos } = await send('Target.getTargets');
    return targetInfos.filter((target) => target.type === 'page').map((target) => target.url);
  }

  /** The extension's service worker, to evaluate in; waits for Chrome to start it. */
  async function serviceWorker() {
    for (let i = 0; i < 50; i += 1) {
      const { targetInfos } = await send('Target.getTargets');
      const target = targetInfos.find((info) => info.type === 'service_worker' && info.url.startsWith(ORIGIN));
      if (target) {
        const { sessionId } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
        return { url: target.url, evaluate: evaluator(sessionId) };
      }
      await sleep(100);
    }
    throw new Error('The service worker did not start');
  }

  // The extension is not reachable until Chrome has finished loading it.
  await sleep(1000);
  return {
    open,
    pageUrls,
    serviceWorker,
    /** Grants the extension browser permissions such as `clipboardReadWrite`, so a test can read what it wrote. */
    grant: (permissions) => send('Browser.grantPermissions', { origin: ORIGIN, permissions }),
    async close() {
      ws.close();
      chrome.kill();
      await sleep(300);
      rmSync(work, { recursive: true, force: true });
    },
  };
}

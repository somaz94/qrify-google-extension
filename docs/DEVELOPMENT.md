# Development

<br/>

## Prerequisites

- Google Chrome
- Node.js and npm, for the tests, the linter and the store images only; the extension itself has no build step. `make e2e` and `make store-screenshots` need Node 22 or later

<br/>

## Local development

```bash
make install     # dev dependencies (Jest, ESLint)
make test-cover  # unit tests; fails below the coverage threshold in jest.config.js
make e2e         # the real popup and service worker in Chrome for Testing
make lint
make help        # every target
```

Load the repository directory as an unpacked extension (`chrome://extensions/`, Developer mode, **Load unpacked**). After a change, click the reload button on the extension card and open the popup again. Right-click the popup and pick **Inspect** for its DevTools; the service worker has its own **Inspect views** link on the extension card.

<br/>

## Architecture

Plain ES modules, loaded straight from `src/` with no bundler. Each directory has one role:

| Directory | Role |
|---|---|
| `src/lib/` | Everything that can be tested without a browser: encoding text into modules and laying them out with the quiet zone (`qr.js`), the recent list (`history.js`), the theme (`theme.js`), and the right-click menus and the text they hand to the popup (`menus.js`) |
| `src/vendor/` | Third-party code, unmodified: `qrcode.js` is `dist/qrcode.mjs` from the [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) npm package (MIT) |
| `src/i18n.js` | `t()` and the helper that fills `data-i18n` attributes, over Chrome's `_locales` |
| `src/popup/` | The popup page; DOM glue over `src/lib`. A right-click menu opens the same page in a tab as `popup.html?text=…` |
| `src/background/` | The service worker: creates the right-click menus and opens the popup page for a click |

`src/popup/` and `src/background/` are the only code outside the coverage gate, so logic belongs in `src/lib/`, where it is tested. Both are covered by the end-to-end test.

### Encoding

`encode()` in `src/lib/qr.js` hands qrcode-generator the UTF-8 bytes of the text from `TextEncoder`, one character per byte in byte mode, so Korean, emoji and any other Unicode text scan back unchanged. The code always uses the highest error correction level (H) and the smallest version that fits; text that fits no version returns `null` and the popup says it is too long. `layout()` picks whole-pixel modules close to the chosen size, so edges stay sharp, and `paint()` draws them with a four-module light margin, which scanners need to find the code.

To update the encoder, run `npm pack qrcode-generator`, copy `package/dist/qrcode.mjs` over `src/vendor/qrcode.js`, and run `make test e2e`.

<br/>

## End-to-end test

`make e2e` (`tests/e2e/run.mjs`) loads the extension into Chrome for Testing and drives it over the DevTools protocol: generating, resizing and the quiet zone, Korean and emoji text, the recent list, the theme and button contrast, the right-click menus in the service worker and the page they open, the Korean UI, and no uncaught or console errors. Where Chrome has `BarcodeDetector` (macOS, not the Linux CI runners), it also scans each Unicode code back and compares the text. It checks what unit tests cannot: that Chrome accepts the manifest and that the glue in `src/popup/` and `src/background/` is wired correctly. CI runs it on every push.

`hack/chrome.mjs` starts Chrome and talks to it with Node's built-in `WebSocket`, so the test adds no dependency; `make store-screenshots` uses it too. Branded Chrome ignores `--load-extension`, so it downloads Chrome for Testing into `~/.cache/qrify-chrome` on the first run; set `QRIFY_CHROME` to use a Chromium you already have.

After a change to `popup.html`, `popup.js` or the service worker, run `make e2e` and add a check for the new behavior.

<br/>

## Translations

The popup and the menus follow the browser language through Chrome's `_locales`: English is the default, Korean is in `_locales/ko/`.

- A string is a key in `_locales/en/messages.json` and in every other `_locales/<language>/messages.json`, written as `{ "message": "..." }`. Positional values are `$1` to `$9`
- In HTML, set `data-i18n="key"` for text or `data-i18n-placeholder` / `data-i18n-title` / `data-i18n-aria-label` for attributes; in JavaScript, call `t('key')` from `src/i18n.js`; a menu names its key in `title` in `src/lib/menus.js`
- `tests/locales.test.js` fails when a language misses a key, a placeholder differs, a key the code names does not exist, or a key is no longer used
- In Jest, `tests/setup/chrome-i18n.cjs` serves the English catalog as `chrome.i18n`, so tests assert the English text
- `tests/manifest.test.js` checks that the store summary (`extDescription`) fits the store's 132 characters in every language, and that both `make package` and the release workflow ship `_locales/`

<br/>

## Publishing to the Chrome Web Store

```bash
make bump-version VERSION=1.2.0   # manifest.json, package.json and package-lock.json
make package                      # writes dist/qrify.zip
```

Upload the ZIP in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). The listing text, the graphic assets, the Privacy tab answers and the reviewer test instructions are in [DESCRIPTION.md](DESCRIPTION.md); link [Privacy](PRIVACY.md) as the privacy policy. A tag push (`v*.*.*`) also builds the ZIP and attaches it to the GitHub release with notes from git-cliff.

`make store-screenshots` redraws `store/screenshots/` in English and Korean and the shared `store/promo-small.png`, in the same Chrome for Testing as the end-to-end test.

<br/>

## Conventions

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), in English
- Code comments in English, only where the reason is not obvious from the code
- No new permissions and no network requests; anything that would need one is out of scope

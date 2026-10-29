# CLAUDE.md

<br/>

## Project

- Chrome extension (Manifest V3): a popup that turns text or the current page's URL into a QR code, plus right-click menus for a selection, a link or an image
- Plain ES modules, no bundler, no runtime dependencies beyond the vendored QR encoder in `src/vendor/`; npm is for Jest and ESLint only
- Architecture: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)

<br/>

## Invariants

- **The permissions stay `activeTab`, `contextMenus` and `storage`, and the extension makes no network requests.** A new permission re-prompts every existing user; `tests/manifest.test.js` pins the list. Open a page with `chrome.tabs.create`, which needs none
- **Logic lives in `src/lib/`.** `src/popup/` and `src/background/` are glue over the DOM and the chrome APIs, outside the 90% coverage gate and covered by `make e2e` instead
- **`src/vendor/` is third-party code, copied unmodified.** It is excluded from lint and coverage; change behavior around it in `src/lib/qr.js`
- **Every user-visible string is a `_locales` key**, reached through `t()`, `data-i18n` or a menu's `title`; `tests/locales.test.js` enforces key and placeholder parity and that every key is used

<br/>

## Commands

`make help` lists every target. Before committing: `make lint` and `make test-cover` (the coverage threshold lives in `jest.config.js`). After touching `manifest.json`, `src/popup/` or `src/background/`, also `make e2e`, which drives the real popup and service worker in Chrome for Testing; then `make store-screenshots` redraws the store images in `store/`.

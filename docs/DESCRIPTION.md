# Chrome Web Store Listing

The text pasted into the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) for QRify. The item name and summary come from `name` and the `_locales` description, so they are not repeated here.

<br/>

## Store listing

### Description

```text
QRify turns text or the page you are on into a QR code in one click, and draws it offline in your browser.

Make a code
- Type any text or URL, or take the current page's address with one button
- Right-click selected text, a link or an image and pick QRify to get its code without retyping
- Korean, emoji and any other text are encoded as UTF-8, so phones scan them back exactly
- Ctrl+Shift+Q (Cmd+Shift+Q on macOS) opens the popup

Make it yours
- Pick the code and background colors and one of four sizes
- The light margin scanners need is always drawn around the code
- Download the code as a PNG, or share it through your system's share sheet

Pick up where you left off
- The last ten codes stay in a Recent list with their colors and size, one click from reopening
- A light and a dark theme, following the system unless you pick one
- English and Korean, following the browser language

Privacy
- No network requests, no analytics, no server
- Only your recent codes and your theme are kept, in this browser's extension storage
- Open source: https://github.com/somaz94/qrify-google-extension
```

### Category

Tools

### Language

English is the default listing. The Korean listing uses [`store/listing-ko.txt`](../store/listing-ko.txt) as its description; that text is kept outside `docs/` because it is translated product copy, like `_locales/ko`, not documentation. Keep it in step with the English description above.

### Graphic assets

Upload `store/screenshots/en/` to the default listing and `store/screenshots/ko/` as the Korean localized screenshots, in file order, and `store/promo-small.png` as the small promo tile. The store localizes screenshots only; the promo tile is shared by every language, so it has English copy. `make store-screenshots` redraws all of them from the extension itself (the inputs and the slide copy are in `hack/store-screenshots.mjs` and `hack/store-slide.html`); run it after a change to the popup.

### Additional fields

| Field | Value |
|---|---|
| Homepage URL | `https://github.com/somaz94/qrify-google-extension` |
| Support URL | `https://github.com/somaz94/qrify-google-extension/issues` |
| Mature content | No |

<br/>

## Privacy practices

### Single purpose

```text
Generate QR codes from text the user types, the URL of the current tab, or the text, link or image address the user right-clicks.
```

### Permission justification

| Permission | Justification |
|---|---|
| `activeTab` | `The Current page URL button reads the address of the active tab, after the user opens the popup, to turn it into a QR code.` |
| `contextMenus` | `Adds right-click entries that turn the selected text, a link or an image address into a QR code.` |
| `storage` | `Keeps the user's recent codes on this browser.` |

### Remote code

No. Every script ships in the package, including the QR encoder in `src/vendor/`.

### Data usage

Check none of the data types: the recent list stays in the browser's extension storage and nothing is sent anywhere. Then certify all three statements (not sold to third parties, not used for purposes unrelated to the single purpose, not used for creditworthiness or lending).

### Privacy policy URL

`https://github.com/somaz94/qrify-google-extension/blob/main/docs/PRIVACY.md`

<br/>

## Test instructions

```text
No account or setup is needed. Open the popup, type any text and press Generate QR code; Current page URL takes the address of the active tab. To test the menus, right-click selected text, a link or an image on any page and pick the QRify entry; the code opens in a new tab.
```

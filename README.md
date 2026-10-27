# QRify - QR Code Generator Chrome Extension

QRify is a Chrome extension that allows you to quickly and easily generate QR codes.

<br/>

## Screenshot
<img src="./img/app.png" width="300" alt="QRify App">

<br/>

## Features

- Convert text/URLs to QR codes
- Instantly convert current tab's URL to QR code
- QR code customization
  - Color options (QR code color, background color)
  - Size options (Extra small, Small, Medium, Large)
- Dark mode support
- Download QR codes
- Copy to clipboard
- Recent history (up to 10 entries)
- English and Korean, following the browser language

<br/>

## How to Use

1. Install the extension in Chrome browser
2. Click the QRify icon in the toolbar
3. Enter text or click 'Current Page URL' button
4. Click generate QR code button
5. Customize QR code as needed
6. Use download or share functions

<br/>

## Development

- Chrome Extension Manifest V3
- HTML/CSS/JavaScript
- QRCode.js library
- Every user-visible string is a key in `_locales/<language>/messages.json`; a new string needs the key in every language
- `node --test 'tests/*.test.mjs'` checks that the catalogs have the same keys and placeholders, and that every key the code uses exists

<br/>

## Installation

### From Chrome Web Store
1. Visit [QRify](https://chromewebstore.google.com/detail/qrify/lkencifnlcbcfjdpkooejabmgkmdgpee)
2. Click "Add to Chrome"

### From Source
1. Clone or download this repository
2. Open `chrome://extensions` in Chrome browser
3. Enable 'Developer mode' in the top right
4. Click 'Load unpacked'
5. Select the downloaded folder

<br/>

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
# Changelog

All notable changes to this project will be documented in this file.

## [v1.2.0](https://github.com/somaz94/qrify-google-extension/compare/v1.1.0...v1.2.0) (2026-10-29)

### Features

- download the code as an SVG that stays sharp at any size ([dd64518](https://github.com/somaz94/qrify-google-extension/commit/dd645188f05f3e19af1a6ee6534219e353e3f2d1))
- copy the code to the clipboard as a PNG ([c27730e](https://github.com/somaz94/qrify-google-extension/commit/c27730e4679cbf318a233969200484afa1679ecc))
- show Share only where Chrome can share image files ([4f3f49a](https://github.com/somaz94/qrify-google-extension/commit/4f3f49add01b5534a77cc509c0de28d63608ca28))
- remove a recent code with its × button or all of them with Clear all ([b756b9b](https://github.com/somaz94/qrify-google-extension/commit/b756b9b528c3602d690e8a6cb55fe06adf43e154))
- show problems under the input instead of in alert dialogs ([2904c0a](https://github.com/somaz94/qrify-google-extension/commit/2904c0a7a602db68f561375413f20edc354ca565))
- draw the code as you type and keep it with Enter ([94f0d7d](https://github.com/somaz94/qrify-google-extension/commit/94f0d7d056d741d76bc270fb2e21e6b1577a806c))
- reopen the popup on the colors and size picked last ([fd46c3a](https://github.com/somaz94/qrify-google-extension/commit/fd46c3ae4298e6da2437d84c07db5e151780eb24))
- follow the system theme unless light or dark is picked ([c615379](https://github.com/somaz94/qrify-google-extension/commit/c615379b6eb81ac54ea1079de1f7adbd960a9f54))

### Bug Fixes

- tidy the color and size controls and drop the empty space under them ([b9d19d9](https://github.com/somaz94/qrify-google-extension/commit/b9d19d9977d20ec1f6b2b77e1a8f98804427273a))
- make the button text readable in both themes ([fa63a94](https://github.com/somaz94/qrify-google-extension/commit/fa63a943e90693444a1b15ecbce6bea6fa9632a2))
- encode Korean and emoji as UTF-8 with qrcode-generator 2.0.4 instead of qrcodejs ([2fe66f0](https://github.com/somaz94/qrify-google-extension/commit/2fe66f079a5a84cfe04f195474a163ce9043ca04))
- show the color swatches, fit Large codes in the popup and lay out the recent list ([d73fc9c](https://github.com/somaz94/qrify-google-extension/commit/d73fc9cba27cbc24a61a5801b55f1913d4f4d371))
- draw the four-module margin scanners need around the code ([f34989e](https://github.com/somaz94/qrify-google-extension/commit/f34989e667ebe15d214d3b3cf91564d38b39bf4e))
- stop listing the same text twice and alerting on a style change with no text ([df67ddc](https://github.com/somaz94/qrify-google-extension/commit/df67ddce57017c80f45904a3026622c63417facc))
- keep quotes and markup in recent entries as plain text ([7a54e40](https://github.com/somaz94/qrify-google-extension/commit/7a54e40a9007a1042fa97aa3569dd10e10983ec3))
- make the right-click menus open a QR code for the selection, image or link ([1e8a479](https://github.com/somaz94/qrify-google-extension/commit/1e8a479ddfc1fae0dc3341a7ae867901a62ec7cc))

### Code Refactoring

- move the QR, history and theme logic into src/lib ([1e6bb21](https://github.com/somaz94/qrify-google-extension/commit/1e6bb21c58a6bf9d21f38934668c056d5b56cba1))

### Documentation

- rewrite the README and add development, store listing and privacy docs ([a198367](https://github.com/somaz94/qrify-google-extension/commit/a198367f04a0778a0f9b4713bebb4d2168442e59))

### Tests

- finish the theme fade before checking button contrast ([2260776](https://github.com/somaz94/qrify-google-extension/commit/2260776619b890b215d1ead866c6046bc6cfc9cf))
- drive the real popup in Chrome for Testing with make e2e ([77e69bf](https://github.com/somaz94/qrify-google-extension/commit/77e69bf5fb5b0a543886b3a95872f9a9567adcb6))

### Chores

- bump version to 1.2.0 ([1ba4070](https://github.com/somaz94/qrify-google-extension/commit/1ba4070778cc3189b7162514f585a31f9b362264))
- redraw the store screenshots for the tidier controls ([4b11bd6](https://github.com/somaz94/qrify-google-extension/commit/4b11bd6b060eccb629d790b565d76392bb08723d))
- redraw the store screenshots for the new popup controls ([7b3a115](https://github.com/somaz94/qrify-google-extension/commit/7b3a115f1f85a3f7e3552837e512786afb921855))
- add Chrome Web Store screenshots and their generator ([2bbb62d](https://github.com/somaz94/qrify-google-extension/commit/2bbb62ddcb7ff70d1995902f463007589a10c00d))
- move to ESLint 10 flat config and Jest 30 with a 90% gate ([48c172a](https://github.com/somaz94/qrify-google-extension/commit/48c172a9f16d3e1cb2127e6c4a9c8cfe4b382157))
- remove the unused Kakao SDK ([a18a68e](https://github.com/somaz94/qrify-google-extension/commit/a18a68ecf6ba3f62595b4469670d21077f49f0c7))

### Contributors

- somaz

<br/>

## [v1.1.0](https://github.com/somaz94/qrify-google-extension/releases/tag/v1.1.0) (2026-10-27)

### Features

- add English alongside Korean, following the browser language ([2240fb3](https://github.com/somaz94/qrify-google-extension/commit/2240fb30472f45afd5fcb6500bfb7126ebd4fd88))

### Bug Fixes

- manifest.json ([132477a](https://github.com/somaz94/qrify-google-extension/commit/132477aecf0da64c3283adc860353401fa370b46))
- img/app.png ([6f24624](https://github.com/somaz94/qrify-google-extension/commit/6f24624a9f3ce1b59398b2428a32118b1f11025c))
- img/app.png ([66bb36e](https://github.com/somaz94/qrify-google-extension/commit/66bb36e8d697560aaa37e58ae373bcbbbcf3b42b))
- img/app.png ([46e9611](https://github.com/somaz94/qrify-google-extension/commit/46e96110d8b1a2bb44419cd092cc94ae1ad65693))
- img/app.png ([40cd13d](https://github.com/somaz94/qrify-google-extension/commit/40cd13d29cccfe04366684997b795462b661dc3b))

### Documentation

- point the store link at QRify instead of Dev Toolkit ([42ce949](https://github.com/somaz94/qrify-google-extension/commit/42ce949673d54c1361e761fef0f364af20242c3e))
- README.md ([162e6ac](https://github.com/somaz94/qrify-google-extension/commit/162e6ac547ef674edf079cffe2f3c8e86b9b65a7))
- README.md ([9343f7d](https://github.com/somaz94/qrify-google-extension/commit/9343f7d02b633f159c2ac5cbe51e03414de96252))
- README.md ([c51175a](https://github.com/somaz94/qrify-google-extension/commit/c51175a90533280b59214d8a21cc076a934896e0))
- README.md ([fa97643](https://github.com/somaz94/qrify-google-extension/commit/fa97643491e0a8099a867f81f8c02366f1e4372a))
- README.md ([f6a5cff](https://github.com/somaz94/qrify-google-extension/commit/f6a5cffd882304b7714724ffd423e36de5d3f012))

### Continuous Integration

- add test, release and repository automation workflows ([fdae127](https://github.com/somaz94/qrify-google-extension/commit/fdae1274427c2d89e7876ddb9dba191ff9cf1b44))
- trim redundant comments in gitlab-mirror workflow ([ac0599d](https://github.com/somaz94/qrify-google-extension/commit/ac0599d0a3e943ce5a12460cba47e1600b335f08))
- retry mirror pushes on transient remote failures ([efbcaf4](https://github.com/somaz94/qrify-google-extension/commit/efbcaf494382583dcf1f9cf2d8cfe8f198041154))
- remove DCO workflow ([e1dedbe](https://github.com/somaz94/qrify-google-extension/commit/e1dedbe0029a14ae88368ab2fa192ab383dc4bfb))
- adopt semantic-pr, labels, lock-threads, PR size, and auto-assign reusables ([701d9b7](https://github.com/somaz94/qrify-google-extension/commit/701d9b74ba9289f404905a93024922f547bb44e8))
- add PR welcome workflow stub ([8a45c09](https://github.com/somaz94/qrify-google-extension/commit/8a45c093ffb6ab3f3718967e867c7906c863e824))
- add DCO check via shared reusable workflow ([0ab32d5](https://github.com/somaz94/qrify-google-extension/commit/0ab32d581246146fab2aed4db10db8566795c5f1))
- add concurrency guards to recurring workflows ([79ca135](https://github.com/somaz94/qrify-google-extension/commit/79ca135c36af6a88978fcd6601a9104c45b63d66))
- migrate gitlab-mirror workflow to multi-git-mirror action ([70bcdbd](https://github.com/somaz94/qrify-google-extension/commit/70bcdbd5d5b96f7c6815fc2cf146afbcb31c7c5e))

### Chores

- bump version to 1.1.0 ([30b64a4](https://github.com/somaz94/qrify-google-extension/commit/30b64a45f52316eeca54e498be45b69cf4f71b65))
- credit somaz94 as the author ([f825485](https://github.com/somaz94/qrify-google-extension/commit/f82548532c8f851b423cf397bc71abc2faab26fb))
- add icon ([0c8fc73](https://github.com/somaz94/qrify-google-extension/commit/0c8fc73219cac81ebcbbd3c899e157410e317183))
- add app png ([38c0c09](https://github.com/somaz94/qrify-google-extension/commit/38c0c09c254a0678ea47b4060e69a6b45e2491d0))
- update code ([21c8e25](https://github.com/somaz94/qrify-google-extension/commit/21c8e2582e24e824cf99a3271f73fbae9b985fd5))

### Add

- gitlab-mirror.yml ([5701e6e](https://github.com/somaz94/qrify-google-extension/commit/5701e6ecc5a565f73105b1a430eba2a91aad9a86))

### Contributors

- somaz

<br/>


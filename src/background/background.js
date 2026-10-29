// Service Worker for potential future features
chrome.runtime.onInstalled.addListener(() => {
  console.log('QRify extension installed');
});

// Optional: Add context menu for right-click QR code generation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generateQR',
    title: chrome.i18n.getMessage('menuSelection'),
    contexts: ['selection']
  });

  // 이미지용 메뉴
  chrome.contextMenus.create({
    id: 'generateQRFromImage',
    title: chrome.i18n.getMessage('menuImage'),
    contexts: ['image']
  });

  // 링크용 메뉴
  chrome.contextMenus.create({
    id: 'generateQRFromLink',
    title: chrome.i18n.getMessage('menuLink'),
    contexts: ['link']
  });
});

chrome.storage.local.get(['qrHistory'], function(result) {
  let history = result.qrHistory || [];
  // 최근 10개만 저장
  if (history.length > 10) {
    history = history.slice(-10);
  }
  chrome.storage.local.set({ qrHistory: history });
});

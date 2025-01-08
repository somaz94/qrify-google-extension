// Service Worker for potential future features
chrome.runtime.onInstalled.addListener(() => {
  console.log('QRify extension installed');
});

// Optional: Add context menu for right-click QR code generation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateQR",
    title: "텍스트로 QR코드 생성",
    contexts: ["selection"]
  });

  // 이미지용 메뉴
  chrome.contextMenus.create({
    id: "generateQRFromImage",
    title: "이미지 URL로 QR코드 생성",
    contexts: ["image"]
  });

  // 링크용 메뉴
  chrome.contextMenus.create({
    id: "generateQRFromLink",
    title: "링크로 QR코드 생성",
    contexts: ["link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generateQR") {
    // Handle selected text
    const selectedText = info.selectionText;
    // You can implement additional functionality here
  }
});

chrome.storage.local.get(['qrHistory'], function(result) {
  let history = result.qrHistory || [];
  // 최근 10개만 저장
  if (history.length > 10) {
    history = history.slice(-10);
  }
  chrome.storage.local.set({ qrHistory: history });
});

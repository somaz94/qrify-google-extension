import { MENUS, popupUrl, textFromClick } from '../lib/menus.js';

// Chrome keeps the menus across an update, so creating them again without removeAll fails on a duplicate id.
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.contextMenus.removeAll();
  for (const { id, contexts, title } of MENUS) chrome.contextMenus.create({ id, contexts, title: chrome.i18n.getMessage(title) });
});

// chrome.action.openPopup needs Chrome 127 or later; a tab works everywhere and needs no permission.
chrome.contextMenus.onClicked.addListener((info) => {
  const text = textFromClick(info);
  if (text) chrome.tabs.create({ url: popupUrl(chrome.runtime.getURL('src/popup/popup.html'), text) });
});

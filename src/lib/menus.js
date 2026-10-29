/** The right-click entries; `text` picks what the clicked item turns into a QR code. */
export const MENUS = [
  { id: 'generateQR', contexts: ['selection'], title: 'menuSelection', text: (info) => info.selectionText },
  { id: 'generateQRFromImage', contexts: ['image'], title: 'menuImage', text: (info) => info.srcUrl },
  { id: 'generateQRFromLink', contexts: ['link'], title: 'menuLink', text: (info) => info.linkUrl },
];

/** The text a menu click should encode, or `null` when there is none. */
export function textFromClick(info) {
  const text = MENUS.find((menu) => menu.id === info.menuItemId)?.text(info)?.trim();
  return text || null;
}

/** The popup page with `text` queued, for opening in a tab. */
export const popupUrl = (popup, text) => `${popup}?${new URLSearchParams({ text })}`;

/** The text queued by `popupUrl`, from the page's `location.search`. */
export const queuedText = (search) => new URLSearchParams(search).get('text')?.trim() || null;

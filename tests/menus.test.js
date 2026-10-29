import { describe, test, expect } from '@jest/globals';
import { MENUS, popupUrl, queuedText, textFromClick } from '../src/lib/menus.js';

describe('menus', () => {
  test('one entry each for selected text, images and links', () => {
    expect(MENUS.map((menu) => menu.contexts)).toEqual([['selection'], ['image'], ['link']]);
  });

  test('textFromClick takes what the clicked menu is about', () => {
    expect(textFromClick({ menuItemId: 'generateQR', selectionText: '  hello  ' })).toBe('hello');
    expect(textFromClick({ menuItemId: 'generateQRFromImage', srcUrl: 'https://example.com/a.png' })).toBe('https://example.com/a.png');
    expect(textFromClick({ menuItemId: 'generateQRFromLink', linkUrl: 'https://example.com/' })).toBe('https://example.com/');
  });

  test('textFromClick returns null for an unknown menu or nothing to encode', () => {
    expect(textFromClick({ menuItemId: 'other', selectionText: 'x' })).toBeNull();
    expect(textFromClick({ menuItemId: 'generateQR', selectionText: '   ' })).toBeNull();
    expect(textFromClick({ menuItemId: 'generateQRFromLink' })).toBeNull();
  });

  test('popupUrl queues text that queuedText reads back intact', () => {
    const text = 'a & b = "c" ?d #e 한글';
    const url = new URL(popupUrl('chrome-extension://id/src/popup/popup.html', text));
    expect(url.pathname).toBe('/src/popup/popup.html');
    expect(queuedText(url.search)).toBe(text);
  });

  test('queuedText returns null without queued text', () => {
    expect(queuedText('')).toBeNull();
    expect(queuedText('?text=%20')).toBeNull();
  });
});

import { describe, test, expect } from '@jest/globals';
import { applyTranslations, t } from '../src/i18n.js';

function fakeElement(attributes = {}, dataset = {}) {
  return {
    attributes: { ...attributes },
    dataset,
    textContent: '',
    getAttribute(name) { return this.attributes[name]; },
    setAttribute(name, value) { this.attributes[name] = value; },
  };
}

describe('i18n', () => {
  test('t returns the English message and falls back to the key', () => {
    expect(t('download')).toBe('Download');
    expect(t('noSuchKey')).toBe('noSuchKey');
  });

  test('applyTranslations fills text, attributes and the page language', () => {
    const text = fakeElement({}, { i18n: 'generate' });
    const field = fakeElement({ 'data-i18n-placeholder': 'textPlaceholder' });
    const root = {
      querySelectorAll: (selector) => ({ '[data-i18n]': [text], '[data-i18n-placeholder]': [field] })[selector] ?? [],
    };
    globalThis.document = { documentElement: {} };
    try {
      applyTranslations(root);
      expect(text.textContent).toBe('Generate QR code');
      expect(field.attributes.placeholder).toBe('Enter text or a URL');
      expect(globalThis.document.documentElement.lang).toBe('en');
    } finally {
      delete globalThis.document;
    }
  });

  test('applyTranslations defaults to the whole document', () => {
    const text = fakeElement({}, { i18n: 'download' });
    globalThis.document = {
      documentElement: {},
      querySelectorAll: (selector) => (selector === '[data-i18n]' ? [text] : []),
    };
    try {
      applyTranslations();
      expect(text.textContent).toBe('Download');
    } finally {
      delete globalThis.document;
    }
  });
});

import { describe, test, expect } from '@jest/globals';
import { createThemer, migrateTheme, nextTheme, resolveTheme, THEME_KEY, themeIcon, themeTitle, THEMES } from '../src/lib/theme.js';
import { fakeStorage, memoryStorage } from './helpers/storage.js';

const fakeDocument = () => {
  const attributes = {};
  return { attributes, documentElement: { setAttribute: (name, value) => { attributes[name] = value; } } };
};

function fakeMedia(matches) {
  const listeners = [];
  return {
    matches,
    addEventListener: (type, listener) => listeners.push(listener),
    flip(next) {
      this.matches = next;
      for (const listener of listeners) listener();
    },
  };
}

describe('theme', () => {
  test('cycles system, light, dark', () => {
    expect(THEMES.map(nextTheme)).toEqual(['light', 'dark', 'auto']);
  });

  test('every setting has an icon and a title', () => {
    for (const setting of THEMES) {
      expect(themeIcon(setting)).toBeTruthy();
      expect(themeTitle(setting)).toMatch(/^theme[A-Z]/);
    }
  });

  test('auto follows the system', () => {
    expect(resolveTheme('auto', true)).toBe('dark');
    expect(resolveTheme('auto', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  test('starts on auto, or on the stored setting', () => {
    const doc = fakeDocument();
    expect(createThemer(doc, { storage: memoryStorage(), media: fakeMedia(true) }).current()).toBe('auto');
    expect(doc.attributes['data-theme']).toBe('dark');
    expect(createThemer(fakeDocument(), { storage: memoryStorage({ [THEME_KEY]: 'light' }) }).current()).toBe('light');
  });

  test('ignores an unknown stored setting', () => {
    expect(createThemer(fakeDocument(), { storage: memoryStorage({ [THEME_KEY]: 'neon' }) }).current()).toBe('auto');
  });

  test('repaints when the system changes while on auto, and not otherwise', () => {
    const doc = fakeDocument();
    const media = fakeMedia(false);
    const themer = createThemer(doc, { storage: memoryStorage(), media });
    media.flip(true);
    expect(doc.attributes['data-theme']).toBe('dark');
    themer.toggle();
    media.flip(true);
    expect(doc.attributes['data-theme']).toBe('light');
  });

  test('toggle stores the next setting', () => {
    const storage = memoryStorage();
    const themer = createThemer(fakeDocument(), { storage });
    expect(themer.toggle()).toBe('light');
    expect(storage.data[THEME_KEY]).toBe('light');
  });

  test('refresh picks up a setting stored meanwhile', () => {
    const storage = memoryStorage();
    const doc = fakeDocument();
    const themer = createThemer(doc, { storage, media: fakeMedia(false) });
    storage.setItem(THEME_KEY, 'dark');
    expect(themer.refresh()).toBe('dark');
    expect(doc.attributes['data-theme']).toBe('dark');
  });

  test('works without matchMedia', () => {
    const doc = fakeDocument();
    createThemer(doc, { storage: memoryStorage(), media: undefined });
    expect(doc.attributes['data-theme']).toBe('light');
  });
});

describe('migrateTheme', () => {
  test('moves a 1.1 setting out of chrome.storage once', async () => {
    const chromeStorage = fakeStorage({ [THEME_KEY]: 'dark' });
    const storage = memoryStorage();
    expect(await migrateTheme(chromeStorage, storage)).toBe(true);
    expect(storage.data[THEME_KEY]).toBe('dark');
    expect(chromeStorage.data).toEqual({});
    expect(await migrateTheme(chromeStorage, storage)).toBe(false);
  });

  test('leaves a newer setting alone', async () => {
    const chromeStorage = fakeStorage({ [THEME_KEY]: 'dark' });
    const storage = memoryStorage({ [THEME_KEY]: 'auto' });
    expect(await migrateTheme(chromeStorage, storage)).toBe(false);
    expect(storage.data[THEME_KEY]).toBe('auto');
  });

  test('moves nothing when there is nothing valid to move', async () => {
    expect(await migrateTheme(fakeStorage(), memoryStorage())).toBe(false);
    expect(await migrateTheme(fakeStorage({ [THEME_KEY]: 'sepia' }), memoryStorage())).toBe(false);
  });
});

describe('defaults', () => {
  test('use the page localStorage and matchMedia when there are any', async () => {
    globalThis.localStorage = memoryStorage({ [THEME_KEY]: 'auto' });
    globalThis.matchMedia = () => fakeMedia(true);
    try {
      const doc = fakeDocument();
      expect(createThemer(doc).current()).toBe('auto');
      expect(doc.attributes['data-theme']).toBe('dark');
      expect(await migrateTheme(fakeStorage({ [THEME_KEY]: 'light' }))).toBe(false);
      delete globalThis.matchMedia;
      const plain = fakeDocument();
      createThemer(plain);
      expect(plain.attributes['data-theme']).toBe('light');
    } finally {
      delete globalThis.localStorage;
      delete globalThis.matchMedia;
    }
  });
});

import { describe, test, expect } from '@jest/globals';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MENUS } from '../src/lib/menus.js';
import { THEME_TITLES } from '../src/lib/theme.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const catalog = (language) => JSON.parse(read(`_locales/${language}/messages.json`));
const LANGUAGES = readdirSync(join(ROOT, '_locales'));
const en = catalog('en');
const placeholders = (message) => (message.match(/\$[1-9]/g) ?? []).sort();

function sources(dir) {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(join(ROOT, path)).isDirectory()) return name === 'vendor' ? [] : sources(path);
    return ['.js', '.html'].includes(extname(name)) ? [read(path)] : [];
  });
}

const REFERENCE = /data-i18n(?:-[a-z-]+)?="(\w+)"|\b(?:t|getMessage)\(\s*'(\w+)'/g;
const referenced = new Set([
  ...sources('src').flatMap((text) => [...text.matchAll(REFERENCE)].map((match) => match[1] ?? match[2])),
  ...[...read('manifest.json').matchAll(/__MSG_(\w+)__/g)].map((match) => match[1]),
  ...Object.values(THEME_TITLES),
  ...MENUS.map((menu) => menu.title),
]);

describe('locales', () => {
  test('the manifest defaults to English and English and Korean are both there', () => {
    expect(JSON.parse(read('manifest.json')).default_locale).toBe('en');
    expect(LANGUAGES.sort()).toEqual(['en', 'ko']);
  });

  test.each(LANGUAGES)('%s has exactly the English keys, each a valid Chrome message name', (language) => {
    const keys = Object.keys(catalog(language));
    expect(keys.sort()).toEqual(Object.keys(en).sort());
    expect(keys.filter((key) => !/^[A-Za-z0-9_]+$/.test(key))).toEqual([]);
  });

  test.each(Object.keys(en))('%s is filled in and keeps its placeholders in every language', (key) => {
    for (const language of LANGUAGES) {
      const { message } = catalog(language)[key];
      expect(message.trim()).not.toBe('');
      expect(placeholders(message)).toEqual(placeholders(en[key].message));
      // Chrome reads any other `$` as the start of a named placeholder.
      expect(message.replace(/\$(\$|[1-9])/g, '')).not.toContain('$');
    }
  });

  test('every key the code or the manifest names exists', () => {
    expect([...referenced].filter((key) => !(key in en))).toEqual([]);
  });

  test('every key is used', () => {
    expect(Object.keys(en).filter((key) => !referenced.has(key))).toEqual([]);
  });
});

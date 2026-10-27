// Run with `node --test 'tests/*.test.mjs'`; uses only Node's built-in test runner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const LANGUAGES = readdirSync(join(ROOT, '_locales'));
const catalog = (language) => JSON.parse(readFileSync(join(ROOT, '_locales', language, 'messages.json'), 'utf8'));
const en = catalog('en');
const placeholders = (text) => (text.match(/\$\d/g) ?? []).sort();

function sources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'lib' ? [] : sources(path);
    return /\.(js|html)$/.test(name) ? [readFileSync(path, 'utf8')] : [];
  });
}

const referenced = new Set();
for (const text of [...sources(join(ROOT, 'src')), JSON.stringify(manifest)]) {
  for (const pattern of [/data-i18n(?:-[a-z-]+)?="(\w+)"/g, /\bt\('(\w+)'/g, /getMessage\("(\w+)"/g, /__MSG_(\w+)__/g]) {
    for (const match of text.matchAll(pattern)) referenced.add(match[1]);
  }
}
// Picked at runtime by a ternary, so the patterns above cannot see them.
for (const key of ['themeToDark', 'themeToLight']) referenced.add(key);

test('the manifest defaults to English', () => {
  assert.equal(manifest.default_locale, 'en');
  assert.deepEqual(LANGUAGES.sort(), ['en', 'ko']);
});

test('every language has exactly the English keys, with the same placeholders and no empty message', () => {
  for (const language of LANGUAGES) {
    const messages = catalog(language);
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(en).sort(), language);
    assert.deepEqual(Object.keys(messages).filter((key) => !/^[A-Za-z0-9_]+$/.test(key)), [], 'Chrome message names');
    for (const [key, { message }] of Object.entries(messages)) {
      assert.ok(message.trim(), `${language}.${key} is empty`);
      assert.deepEqual(placeholders(message), placeholders(en[key].message), `${language}.${key}`);
      // Chrome reads any other `$` as the start of a named placeholder.
      assert.ok(!message.replace(/\$(\$|[1-9])/g, '').includes('$'), `${language}.${key} has a stray $`);
    }
  }
});

test('every key the code uses exists, and every key is used', () => {
  assert.deepEqual([...referenced].filter((key) => !(key in en)), []);
  assert.deepEqual(Object.keys(en).filter((key) => !referenced.has(key)), []);
});

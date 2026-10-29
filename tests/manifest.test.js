import { describe, test, expect } from '@jest/globals';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const manifest = JSON.parse(read('manifest.json'));
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));

describe('manifest', () => {
  test('version matches package.json and package-lock.json', () => {
    expect(pkg.version).toBe(manifest.version);
    expect(lock.version).toBe(manifest.version);
    expect(lock.packages[''].version).toBe(manifest.version);
  });

  test('description fits the Chrome Web Store limit in every language', () => {
    const [, key] = manifest.description.match(/^__MSG_(\w+)__$/);
    for (const locale of readdirSync(join(ROOT, '_locales'))) {
      const { message } = JSON.parse(read(`_locales/${locale}/messages.json`))[key];
      expect({ locale, fits: [...message].length <= 132 }).toEqual({ locale, fits: true });
    }
  });

  // A new permission re-prompts every existing user and lengthens the store review.
  test('asks for exactly the permissions it already has', () => {
    expect(manifest.permissions).toEqual(['activeTab', 'contextMenus', 'storage']);
    expect(manifest.host_permissions).toBeUndefined();
  });

  test('loads no remote code', () => {
    expect(manifest.content_security_policy.extension_pages).toBe(`script-src 'self'; object-src 'self'`);
  });

  test('every referenced file exists', () => {
    const files = [
      manifest.action.default_popup,
      manifest.background?.service_worker,
      ...Object.values(manifest.icons),
      ...Object.values(manifest.action.default_icon),
    ].filter(Boolean);
    for (const file of files) expect({ file, exists: existsSync(join(ROOT, file)) }).toEqual({ file, exists: true });
  });

  test('both packaging paths ship _locales', () => {
    expect(read('Makefile')).toMatch(/zip -r \$\(PACKAGE\) manifest\.json _locales\//);
    expect(read('.github/workflows/release.yml')).toMatch(/manifest\.json \\\n\s+_locales\/ \\/);
  });
});

import { describe, test, expect } from '@jest/globals';
import { loadTheme, nextTheme, saveTheme, THEME_ICONS, THEME_KEY, THEME_TITLES } from '../src/lib/theme.js';
import { fakeStorage } from './helpers/storage.js';

describe('theme', () => {
  test('nextTheme flips between light and dark', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
    expect(nextTheme(null)).toBe('dark');
  });

  test('the toggle offers the other theme', () => {
    expect(THEME_TITLES).toEqual({ light: 'themeToDark', dark: 'themeToLight' });
    expect(Object.keys(THEME_ICONS)).toEqual(['light', 'dark']);
  });

  test('loadTheme defaults to light and ignores unknown values', async () => {
    expect(await loadTheme(fakeStorage({ [THEME_KEY]: 'dark' }))).toBe('dark');
    expect(await loadTheme(fakeStorage())).toBe('light');
    expect(await loadTheme(fakeStorage({ [THEME_KEY]: 'sepia' }))).toBe('light');
  });

  test('saveTheme stores under the theme key', async () => {
    const storage = fakeStorage();
    await saveTheme(storage, 'dark');
    expect(storage.data[THEME_KEY]).toBe('dark');
  });
});

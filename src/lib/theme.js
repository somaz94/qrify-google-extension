export const THEMES = Object.freeze(['auto', 'light', 'dark']);
// Read by src/theme-early.js too, which cannot import this module.
export const THEME_KEY = 'theme';

const ICONS = { auto: '🌓', light: '☀️', dark: '🌙' };
export const THEME_TITLES = Object.freeze({ auto: 'themeAuto', light: 'themeLight', dark: 'themeDark' });

export const nextTheme = (setting) => THEMES[(THEMES.indexOf(setting) + 1) % THEMES.length];
export const themeIcon = (setting) => ICONS[setting];
/** The message key that names `setting` on the toggle. */
export const themeTitle = (setting) => THEME_TITLES[setting];

/** 'light' or 'dark' for a setting; 'auto' follows the system. */
export function resolveTheme(setting, prefersDark) {
  if (setting === 'light' || setting === 'dark') return setting;
  return prefersDark ? 'dark' : 'light';
}

/** Keeps the page in the stored theme setting, following the system while it is 'auto'. */
export function createThemer(doc, {
  storage = globalThis.localStorage,
  media = globalThis.matchMedia?.('(prefers-color-scheme: dark)'),
} = {}) {
  const read = () => (THEMES.includes(storage.getItem(THEME_KEY)) ? storage.getItem(THEME_KEY) : 'auto');
  let setting = read();
  const paint = () => doc.documentElement.setAttribute('data-theme', resolveTheme(setting, media?.matches));
  media?.addEventListener('change', paint);
  paint();
  return {
    current: () => setting,
    toggle() {
      setting = nextTheme(setting);
      storage.setItem(THEME_KEY, setting);
      paint();
      return setting;
    },
    /** Picks up a setting written to `storage` by someone else. */
    refresh() {
      setting = read();
      paint();
      return setting;
    },
  };
}

/**
 * Moves a light or dark setting that QRify 1.1 kept in `chromeStorage` into `storage`, where theme-early.js can
 * read it before the page paints. Returns whether it moved one.
 */
export async function migrateTheme(chromeStorage, storage = globalThis.localStorage) {
  if (storage.getItem(THEME_KEY) !== null) return false;
  const { [THEME_KEY]: legacy } = await chromeStorage.get([THEME_KEY]);
  if (legacy !== 'light' && legacy !== 'dark') return false;
  storage.setItem(THEME_KEY, legacy);
  await chromeStorage.remove(THEME_KEY);
  return true;
}

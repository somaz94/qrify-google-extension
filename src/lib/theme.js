export const THEME_KEY = 'theme';
/** The toggle shows where a click goes, so each theme maps to the other one's icon and title. */
export const THEME_ICONS = { light: '🌙', dark: '☀️' };
export const THEME_TITLES = { light: 'themeToDark', dark: 'themeToLight' };

export const nextTheme = (theme) => (theme === 'dark' ? 'light' : 'dark');

export async function loadTheme(storage) {
  const { [THEME_KEY]: theme } = await storage.get([THEME_KEY]);
  return theme === 'dark' ? 'dark' : 'light';
}

export function saveTheme(storage, theme) {
  return storage.set({ [THEME_KEY]: theme });
}

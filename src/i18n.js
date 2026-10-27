const ATTRIBUTES = [
  ['data-i18n-placeholder', 'placeholder'],
  ['data-i18n-title', 'title'],
  ['data-i18n-aria-label', 'aria-label'],
];

/** The message for `key` in the browser's language (from `_locales`), or the key itself when it is missing. */
export function t(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

/** Fills `data-i18n` text and `data-i18n-*` attributes under `root`, and tags the page with the language shown. */
export function applyTranslations(root = document) {
  for (const element of root.querySelectorAll('[data-i18n]')) element.textContent = t(element.dataset.i18n);
  for (const [source, target] of ATTRIBUTES) {
    for (const element of root.querySelectorAll(`[${source}]`)) element.setAttribute(target, t(element.getAttribute(source)));
  }
  // `htmlLang` comes from the catalog Chrome picked, which is the default one for an unsupported UI language.
  document.documentElement.lang = t('htmlLang');
}

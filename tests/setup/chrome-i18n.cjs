// The code reads its messages through chrome.i18n, which Jest lacks; serve the English catalog as Chrome would.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const messages = JSON.parse(readFileSync(join(__dirname, '..', '..', '_locales', 'en', 'messages.json'), 'utf8'));

globalThis.chrome = {
  i18n: {
    getMessage(key, substitutions = []) {
      const entry = messages[key];
      if (!entry) return '';
      const values = [].concat(substitutions);
      return entry.message.replace(/\$(\$|[1-9])/g, (_, n) => (n === '$' ? '$' : String(values[n - 1] ?? '')));
    },
    getUILanguage: () => 'en',
  },
};

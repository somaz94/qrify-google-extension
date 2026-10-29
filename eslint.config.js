import js from '@eslint/js';

const browser = {
  window: 'readonly',
  document: 'readonly',
  location: 'readonly',
  navigator: 'readonly',
  console: 'readonly',
  alert: 'readonly',
  fetch: 'readonly',
  File: 'readonly',
  setTimeout: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  chrome: 'readonly',
  matchMedia: 'readonly',
  // Set by the vendored qrcode.min.js, a classic script loaded before the modules.
  QRCode: 'readonly',
};

export default [
  { ignores: ['coverage/', 'dist/', 'node_modules/', 'src/**/*.min.js'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'tests/**/*.js', '*.config.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: browser },
    rules: {
      semi: ['warn', 'always'],
      quotes: ['warn', 'single', { allowTemplateLiterals: true }],
    },
  },
  {
    files: ['hack/**/*.mjs', 'tests/e2e/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly', Buffer: 'readonly', WebSocket: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly' },
    },
    rules: {
      semi: ['warn', 'always'],
      quotes: ['warn', 'single', { allowTemplateLiterals: true }],
    },
  },
  {
    files: ['tests/setup/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { require: 'readonly', __dirname: 'readonly', globalThis: 'readonly' } },
  },
];

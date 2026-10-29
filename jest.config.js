export default {
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup/chrome-i18n.cjs'],
  collectCoverageFrom: [
    'src/**/*.js',
    // DOM and chrome API glue; covered by the end-to-end test instead.
    '!src/popup/**',
    '!src/background/**',
    // A classic script that runs before the modules; the logic it mirrors is src/lib/theme.js.
    '!src/theme-early.js',
    // Third-party code, tested upstream.
    '!src/vendor/**',
  ],
  coverageThreshold: {
    global: { statements: 90, branches: 90, functions: 90, lines: 90 },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
};

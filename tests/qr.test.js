import { describe, test, expect } from '@jest/globals';
import { qrOptions, QUIET_MODULES, quietZone } from '../src/lib/qr.js';

describe('qrOptions', () => {
  test('makes a square code at the picked size, colors and the highest error correction', () => {
    const levels = { L: 1, M: 0, Q: 3, H: 2 };
    expect(qrOptions({ text: 'https://example.com', size: '256', dark: '#112233', light: '#ffffff' }, levels)).toEqual({
      text: 'https://example.com',
      width: 256,
      height: 256,
      colorDark: '#112233',
      colorLight: '#ffffff',
      correctLevel: 2,
    });
  });
});

describe('quietZone', () => {
  test('is four modules wide, rounded up to whole pixels', () => {
    expect(QUIET_MODULES).toBe(4);
    expect(quietZone(128, 29)).toBe(18);
    expect(quietZone(256, 32)).toBe(32);
  });
});

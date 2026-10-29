import { describe, test, expect } from '@jest/globals';
import { canShareImage } from '../src/lib/share.js';

describe('canShareImage', () => {
  test('asks the browser about a PNG file', () => {
    const asked = [];
    const nav = { canShare: (data) => { asked.push(data.files.map((file) => [file.name, file.type])); return true; } };
    expect(canShareImage(nav, File)).toBe(true);
    expect(asked).toEqual([[['qrcode.png', 'image/png']]]);
  });

  test('is false without canShare, without File, or when canShare refuses or throws', () => {
    expect(canShareImage({}, File)).toBe(false);
    expect(canShareImage({ canShare: () => true }, null)).toBe(false);
    expect(canShareImage({ canShare: () => false }, File)).toBe(false);
    expect(canShareImage({ canShare: () => { throw new TypeError('nope'); } }, File)).toBe(false);
    expect(canShareImage(undefined, File)).toBe(false);
  });

  test('defaults to the page navigator', () => {
    globalThis.navigator ??= {};
    const saved = globalThis.navigator.canShare;
    globalThis.navigator.canShare = () => true;
    try {
      expect(canShareImage()).toBe(true);
    } finally {
      globalThis.navigator.canShare = saved;
    }
  });
});

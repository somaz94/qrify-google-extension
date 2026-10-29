import { describe, test, expect } from '@jest/globals';
import { encode, layout, paint, QUIET_MODULES } from '../src/lib/qr.js';
import qrcode from '../src/vendor/qrcode.js';

describe('encode', () => {
  test('picks the smallest version at the highest error correction', () => {
    // 19 bytes need version 3 at level H, 29 modules a side.
    const modules = encode('https://example.com', qrcode);
    expect(modules).toHaveLength(29);
    expect(modules.every((row) => row.length === 29)).toBe(true);
    // The top-left finder pattern starts with a dark module.
    expect(modules[0][0]).toBe(true);
  });

  test('encodes Korean the old library rejected, and emoji', () => {
    // qrcodejs miscounted these UTF-8 lengths and threw "code length overflow"; the end-to-end test decodes them.
    for (const text of ['3번 게이트에서 10시 30분에 만나요', '😀 emoji']) {
      expect({ text, modules: encode(text, qrcode)?.length >= 21 }).toEqual({ text, modules: true });
    }
  });

  test('returns null for a text too long for any QR code', () => {
    expect(encode('x'.repeat(5000), qrcode)).toBeNull();
  });

  test('passes on any other error', () => {
    const broken = () => ({ addData() {}, make() { throw new Error('boom'); } });
    expect(() => encode('a', broken)).toThrow('boom');
  });
});

describe('layout', () => {
  test('uses whole-pixel modules and a four-module margin', () => {
    expect(QUIET_MODULES).toBe(4);
    expect(layout(128, 29)).toEqual({ module: 4, margin: 16, total: 148 });
    expect(layout(256, 29)).toEqual({ module: 8, margin: 32, total: 296 });
  });

  test('never shrinks a module below one pixel', () => {
    expect(layout(64, 177)).toEqual({ module: 1, margin: 4, total: 185 });
  });
});

describe('paint', () => {
  test('fills the background, then each dark module inside the margin', () => {
    const calls = [];
    const context = {
      set fillStyle(color) { calls.push(['color', color]); },
      fillRect: (...rect) => calls.push(rect),
    };
    paint(context, [[true, false], [false, true]], { module: 3, margin: 12, total: 30 }, { dark: '#000', light: '#fff' });
    expect(calls).toEqual([['color', '#fff'], [0, 0, 30, 30], ['color', '#000'], [12, 12, 3, 3], [15, 15, 3, 3]]);
  });
});

import { describe, test, expect } from '@jest/globals';
import { DEFAULT_STYLE, loadStyle, saveStyle, SIZES, STYLE_KEY, validStyle } from '../src/lib/style.js';
import { fakeStorage } from './helpers/storage.js';

describe('style', () => {
  test('the sizes match the popup options', () => {
    expect(SIZES).toEqual(['64', '128', '256', '512']);
  });

  test('validStyle keeps valid fields and defaults the rest', () => {
    expect(validStyle({ qrColor: '#1A237E', bgColor: '#fff8e1', size: '256' })).toEqual({ qrColor: '#1A237E', bgColor: '#fff8e1', size: '256' });
    expect(validStyle({ qrColor: 'red', bgColor: '#fff', size: '300' })).toEqual(DEFAULT_STYLE);
    expect(validStyle(undefined)).toEqual(DEFAULT_STYLE);
  });

  test('loadStyle reads the stored style, or the default', async () => {
    expect(await loadStyle(fakeStorage({ [STYLE_KEY]: { qrColor: '#112233', bgColor: '#ffffff', size: '64' } }))).toEqual({ qrColor: '#112233', bgColor: '#ffffff', size: '64' });
    expect(await loadStyle(fakeStorage())).toEqual(DEFAULT_STYLE);
  });

  test('saveStyle stores a valid style only', async () => {
    const storage = fakeStorage();
    await saveStyle(storage, { qrColor: '#112233', bgColor: 'nope', size: '512', extra: 1 });
    expect(storage.data[STYLE_KEY]).toEqual({ qrColor: '#112233', bgColor: '#ffffff', size: '512' });
  });
});

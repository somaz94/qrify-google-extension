import { describe, test, expect } from '@jest/globals';
import { addEntry, HISTORY_KEY, HISTORY_LIMIT, loadHistory, newestFirst, saveHistory } from '../src/lib/history.js';
import { fakeStorage } from './helpers/storage.js';

const entry = (text) => ({ text });

describe('history', () => {
  test('addEntry appends and keeps only the newest entries', () => {
    const full = Array.from({ length: HISTORY_LIMIT }, (_, i) => entry(`t${i}`));
    const history = addEntry(full, entry('new'));
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history.at(0)).toEqual(entry('t1'));
    expect(history.at(-1)).toEqual(entry('new'));
    expect(full).toHaveLength(HISTORY_LIMIT);
  });

  test('newestFirst reverses without touching the stored order', () => {
    const history = [entry('a'), entry('b')];
    expect(newestFirst(history)).toEqual([entry('b'), entry('a')]);
    expect(history).toEqual([entry('a'), entry('b')]);
  });

  test('loadHistory returns the stored list, or an empty one for nothing or junk', async () => {
    expect(await loadHistory(fakeStorage({ [HISTORY_KEY]: [entry('a')] }))).toEqual([entry('a')]);
    expect(await loadHistory(fakeStorage())).toEqual([]);
    expect(await loadHistory(fakeStorage({ [HISTORY_KEY]: 'junk' }))).toEqual([]);
  });

  test('saveHistory stores under the history key', async () => {
    const storage = fakeStorage();
    await saveHistory(storage, [entry('a')]);
    expect(storage.data[HISTORY_KEY]).toEqual([entry('a')]);
  });
});

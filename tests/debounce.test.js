import { describe, test, expect, jest } from '@jest/globals';
import { debounce } from '../src/lib/debounce.js';

describe('debounce', () => {
  test('runs once with the last arguments after the wait', () => {
    jest.useFakeTimers();
    try {
      const calls = [];
      const run = debounce((value) => calls.push(value), 300);
      run('a');
      jest.advanceTimersByTime(200);
      run('b');
      jest.advanceTimersByTime(299);
      expect(calls).toEqual([]);
      jest.advanceTimersByTime(1);
      expect(calls).toEqual(['b']);
    } finally {
      jest.useRealTimers();
    }
  });

  test('cancel drops the pending call', () => {
    jest.useFakeTimers();
    try {
      const calls = [];
      const run = debounce(() => calls.push(1), 100);
      run();
      run.cancel();
      jest.advanceTimersByTime(200);
      expect(calls).toEqual([]);
    } finally {
      jest.useRealTimers();
    }
  });
});

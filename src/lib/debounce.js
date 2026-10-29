/** `fn` delayed until `wait` ms pass without another call; `cancel()` drops a pending call. */
export function debounce(fn, wait, timers = globalThis) {
  let timer;
  const debounced = (...args) => {
    timers.clearTimeout(timer);
    timer = timers.setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => timers.clearTimeout(timer);
  return debounced;
}

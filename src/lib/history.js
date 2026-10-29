export const HISTORY_KEY = 'qrHistory';
export const HISTORY_LIMIT = 10;

/** The history with `entry` as the newest, replacing an entry for the same text, capped at `HISTORY_LIMIT`. */
export function addEntry(history, entry) {
  return [...history.filter((item) => item.text !== entry.text), entry].slice(-HISTORY_LIMIT);
}

export function removeEntry(history, text) {
  return history.filter((item) => item.text !== text);
}

export function newestFirst(history) {
  return [...history].reverse();
}

export async function loadHistory(storage) {
  const { [HISTORY_KEY]: history } = await storage.get([HISTORY_KEY]);
  return Array.isArray(history) ? history : [];
}

export function saveHistory(storage, history) {
  return storage.set({ [HISTORY_KEY]: history });
}

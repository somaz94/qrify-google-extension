export const HISTORY_KEY = 'qrHistory';
export const HISTORY_LIMIT = 10;

/** The history with `entry` appended, keeping the newest `HISTORY_LIMIT` entries. */
export function addEntry(history, entry) {
  return [...history, entry].slice(-HISTORY_LIMIT);
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

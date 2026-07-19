import { useCallback, useEffect, useState } from 'react';

const KEY = 'clbhouz.recent-searches';
const MAX = 8;

export type RecentItem = { id: string; query: string; ts: number };

function read(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, MAX);
  } catch {
    /* storage unavailable - recents disabled */
    return [];
  }
}

function write(items: RecentItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* storage unavailable - recents disabled */
  }
}

export function useRecentSearchesV2() {
  const [items, setItems] = useState<RecentItem[]>(() => read());

  const refresh = useCallback(() => setItems(read()), []);

  const save = useCallback((query: string) => {
    const q = (query ?? '').trim();
    if (!q) return;
    const cur = read().filter(
      (i) => i.query.toLowerCase() !== q.toLowerCase(),
    );
    const next: RecentItem[] = [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, query: q, ts: Date.now() },
      ...cur,
    ].slice(0, MAX);
    write(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  return { items, save, clear, refresh };
}

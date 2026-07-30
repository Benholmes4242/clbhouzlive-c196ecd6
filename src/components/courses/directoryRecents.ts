/**
 * Recent directory lookups — stores the COURSE, not the query string.
 * Patterned on src/features/search-v2/hooks/useRecentSearchesV2.ts.
 */
import { useCallback, useEffect, useState } from 'react';

const KEY = 'clbhouz.directory-recents';
const MAX = 5;

export type DirectoryRecent = { id: string; name: string; location: string; ts: number };

function read(): DirectoryRecent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((i) => i && typeof i.id === 'string' && typeof i.name === 'string')
      .slice(0, MAX);
  } catch {
    return [];
  }
}

function write(items: DirectoryRecent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* storage unavailable — recents disabled */
  }
}

export function useDirectoryRecents() {
  const [items, setItems] = useState<DirectoryRecent[]>(() => read());

  const refresh = useCallback(() => setItems(read()), []);

  const save = useCallback((entry: Omit<DirectoryRecent, 'ts'>) => {
    if (!entry?.id) return;
    const next: DirectoryRecent[] = [
      { ...entry, ts: Date.now() },
      ...read().filter((i) => i.id !== entry.id),
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

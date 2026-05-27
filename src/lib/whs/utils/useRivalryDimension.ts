/**
 * Per-rivalry scoring-dimension preference.
 * Persisted as a JSON map in localStorage under `hcp-rivalry-dimension-map`,
 * keyed by rivalId (rival_user_id or rival_friend_row_id). Falls back to
 * 'gross' when a key has no stored value.
 *
 * Used by both the Rivalries section cards and the deep-view page so the
 * user's per-rival choice sticks across surfaces and reloads.
 */
import { useCallback, useEffect, useState } from 'react';

export type RivalryDimension = 'stableford' | 'gross';
const STORAGE_KEY = 'hcp-rivalry-dimension-map';
const CHANGE_EVENT = 'hcp-rivalry-dimension-change';

type DimensionMap = Record<string, RivalryDimension>;

function readMap(): DimensionMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as DimensionMap) : {};
  } catch {
    return {};
  }
}

function readOne(key: string | null | undefined): RivalryDimension {
  if (!key) return 'gross';
  const v = readMap()[key];
  return v === 'stableford' ? 'stableford' : 'gross';
}

export function useRivalryDimension(
  key: string | null | undefined,
): [RivalryDimension, (d: RivalryDimension) => void] {
  const [value, setValue] = useState<RivalryDimension>(() => readOne(key));

  useEffect(() => {
    setValue(readOne(key));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string }>).detail;
      // Only re-read when the change affects our key (or unknown origin)
      if (!detail?.key || detail.key === key) {
        setValue(readOne(key));
      }
    };
    const onStorage = () => setValue(readOne(key));
    window.addEventListener(CHANGE_EVENT, onChange as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [key]);

  const update = useCallback(
    (d: RivalryDimension) => {
      setValue(d);
      if (!key) return;
      try {
        const next = { ...readMap(), [key]: d };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
      } catch {
        /* noop */
      }
    },
    [key],
  );

  return [value, update];
}

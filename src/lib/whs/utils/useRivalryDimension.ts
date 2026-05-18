/**
 * Shared scoring-dimension preference for Rivalries UI.
 * Persisted in localStorage under `hcp-rivalry-dimension`.
 * Used by both the Rivalries section cards and the deep-view page so
 * the user's choice sticks across surfaces.
 */
import { useCallback, useEffect, useState } from 'react';

export type RivalryDimension = 'stableford' | 'gross';
export const RIVALRY_DIMENSION_KEY = 'hcp-rivalry-dimension';
const RIVALRY_DIMENSION_EVENT = 'hcp-rivalry-dimension-change';

function read(): RivalryDimension {
  if (typeof window === 'undefined') return 'stableford';
  const v = window.localStorage.getItem(RIVALRY_DIMENSION_KEY);
  return v === 'gross' ? 'gross' : 'stableford';
}

export function useRivalryDimension(): [RivalryDimension, (d: RivalryDimension) => void] {
  const [value, setValue] = useState<RivalryDimension>(read);

  useEffect(() => {
    const onChange = () => setValue(read());
    window.addEventListener(RIVALRY_DIMENSION_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(RIVALRY_DIMENSION_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const update = useCallback((d: RivalryDimension) => {
    setValue(d);
    try {
      window.localStorage.setItem(RIVALRY_DIMENSION_KEY, d);
      window.dispatchEvent(new Event(RIVALRY_DIMENSION_EVENT));
    } catch {
      /* noop */
    }
  }, []);

  return [value, update];
}

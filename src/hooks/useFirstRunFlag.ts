import { useCallback, useEffect, useState } from 'react';

export function useFirstRunFlag(key: string) {
  const storageKey = `clbhouz:firstRun:${key}`;
  const [hasSeen, setHasSeen] = useState<boolean>(true);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    setHasSeen(raw === '1');
  }, [storageKey]);

  const markSeen = useCallback(() => {
    localStorage.setItem(storageKey, '1');
    setHasSeen(true);
  }, [storageKey]);

  const reset = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasSeen(false);
  }, [storageKey]);

  return { hasSeen, markSeen, reset };
}

import { useState, useEffect } from 'react';

export function useFirstRunFlag(key: string) {
  const storageKey = `first-run-${key}`;
  const [isFirstRun, setIsFirstRun] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    setIsFirstRun(!seen);
  }, [storageKey]);

  const markAsSeen = () => {
    localStorage.setItem(storageKey, 'true');
    setIsFirstRun(false);
  };

  return { isFirstRun, markAsSeen };
}

import { useEffect, useState } from 'react';

/**
 * Forces a component re-render every minute to keep time-based displays fresh.
 */
export function useMinuteTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}

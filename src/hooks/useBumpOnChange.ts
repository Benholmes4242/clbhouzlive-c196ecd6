import { useEffect, useRef, useState } from 'react';

export function useBumpOnChange<T>(value: T, duration = 450) {
  const prev = useRef<T>(value);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      setBump(true);
      const t = setTimeout(() => setBump(false), duration);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value, duration]);

  return bump; // true while animating
}

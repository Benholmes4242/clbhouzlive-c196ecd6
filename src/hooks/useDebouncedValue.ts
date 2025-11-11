import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, ms = 180) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

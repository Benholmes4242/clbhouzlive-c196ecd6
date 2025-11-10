import { useEffect, useRef, useState } from 'react';

type Options<T> = {
  key: string;          // include userId + route + formId e.g. `${userId}/admin/courses/new`
  initial: T;
  debounceMs?: number;  // default 300
  enabled?: boolean;    // default true
};

export function useFormDraft<T>({ key, initial, debounceMs = 300, enabled = true }: Options<T>) {
  const storageKey = `draft:${key}`;
  const [value, setValue] = useState<T>(() => {
    if (!enabled) return initial;
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try { 
        sessionStorage.setItem(storageKey, JSON.stringify(value)); 
      } catch {}
    }, debounceMs);
    return () => { 
      if (timer.current) window.clearTimeout(timer.current); 
    };
  }, [value, storageKey, debounceMs, enabled]);

  const clear = () => {
    try { 
      sessionStorage.removeItem(storageKey); 
    } catch {}
  };

  return { value, setValue, clear };
}

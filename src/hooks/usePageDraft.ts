import { useEffect, useMemo, useRef, useState } from "react";

type DraftOptions<T> = {
  key: string;                 // unique key (user + route + entity)
  initial: T;                  // initial empty form shape
  throttleMs?: number;         // default 400ms
};

export function usePageDraft<T extends object>({ key, initial, throttleMs = 400 }: DraftOptions<T>) {
  const [value, setValue] = useState<T>(initial);
  const loadedOnce = useRef(false);
  const timer = useRef<number | null>(null);

  // Load once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setValue((v) => ({ ...v, ...parsed }));
      } else {
        setValue(initial);
      }
    } catch {
      setValue(initial);
    }
    loadedOnce.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Throttled save
  const save = useMemo(
    () => (next: Partial<T>) => {
      setValue((prev) => {
        const merged = { ...prev, ...next };
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          try {
            localStorage.setItem(key, JSON.stringify(merged));
          } catch {}
        }, throttleMs) as unknown as number;
        return merged;
      });
    },
    [key, throttleMs]
  );

  // Save on tab hide just in case
  useEffect(() => {
    const onHide = () => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    };
    document.addEventListener("visibilitychange", onHide, { passive: true });
    window.addEventListener("beforeunload", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide as any);
      window.removeEventListener("beforeunload", onHide as any);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [key, value]);

  const clear = () => {
    try {
      localStorage.removeItem(key);
    } catch {}
  };

  return { value, setValue, save, clear, loadedOnce: loadedOnce.current };
}

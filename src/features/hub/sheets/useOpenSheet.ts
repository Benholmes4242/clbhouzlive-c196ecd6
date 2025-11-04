import { useSearchParams } from 'react-router-dom';

export function useOpenSheet() {
  const [qs, setQs] = useSearchParams();
  return (key: string, extra?: Record<string, string | number | boolean>) => {
    qs.set('sheet', key);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        qs.set(k, String(v));
      }
    }
    setQs(qs, { replace: false });
    try {
      console.log('[openSheet] ->', key, Object.fromEntries(qs.entries()));
    } catch {}
  };
}

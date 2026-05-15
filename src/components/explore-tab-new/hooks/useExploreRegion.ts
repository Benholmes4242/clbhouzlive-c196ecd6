import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * URL-backed Explore region filter (?region=<slug>). `null` means "All regions".
 * Mirrors the API of useExploreMood — replaces history entries so chip taps
 * don't pollute the back stack.
 */
export function useExploreRegion() {
  const [params, setParams] = useSearchParams();

  const raw = params.get('region');
  const region: string | null = raw && raw.length > 0 ? raw : null;

  const setRegion = useCallback((next: string | null) => {
    const newParams = new URLSearchParams(params);
    if (!next) {
      newParams.delete('region');
    } else {
      newParams.set('region', next);
    }
    setParams(newParams, { replace: true });
  }, [params, setParams]);

  return { region, setRegion };
}

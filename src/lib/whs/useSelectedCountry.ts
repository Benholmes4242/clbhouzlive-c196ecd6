import { useCallback, useEffect, useState } from 'react';
import { type WhsCountry, getCountryById } from './whsCountries';

const STORAGE_KEY = 'clbhouz_selected_whs_country';

export function useSelectedCountry() {
  const [countryId, setCountryIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setCountryId = useCallback((id: string | null) => {
    setCountryIdState(id);
    try {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be disabled — selection just won't persist.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCountryIdState(e.newValue);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const country: WhsCountry | null = getCountryById(countryId);

  return {
    country,
    countryId,
    setCountryId,
    clear: () => setCountryId(null),
  };
}

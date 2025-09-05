import { useState, useEffect } from 'react';

type SectionState<T> = {
  loading: boolean;
  data: T[];
};

const MIN_SKELETON_MS = 500;

export function useSectionLoader<T>(fetcher: () => Promise<T[]>) {
  const [state, setState] = useState<SectionState<T>>({ loading: true, data: [] });

  useEffect(() => {
    let mounted = true;
    const start = performance.now();

    (async () => {
      setState(s => ({ ...s, loading: true }));
      try {
        const data = await fetcher();
        const elapsed = performance.now() - start;
        const delay = Math.max(0, MIN_SKELETON_MS - elapsed);

        setTimeout(() => {
          if (!mounted) return;
          setState({ loading: false, data });
        }, delay);
      } catch (error) {
        console.error('Section loader error:', error);
        setTimeout(() => {
          if (!mounted) return;
          setState({ loading: false, data: [] });
        }, MIN_SKELETON_MS);
      }
    })();

    return () => { mounted = false; };
  }, [fetcher]);

  const hasData = !state.loading && state.data.length > 0;
  const isEmpty = !state.loading && state.data.length === 0;

  return { ...state, hasData, isEmpty };
}
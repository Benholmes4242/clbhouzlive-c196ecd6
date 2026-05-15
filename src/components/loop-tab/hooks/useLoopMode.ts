/**
 * URL-backed Friends feed mode (?mode=). 'latest' is default and absent from URL.
 */
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { LoopMode } from '../types';

const VALID: readonly LoopMode[] = ['latest', 'popular', 'live_now'];
const DEFAULT_MODE: LoopMode = 'latest';

export function useLoopMode() {
  const [params, setParams] = useSearchParams();

  const raw = params.get('mode');
  const mode: LoopMode = raw && (VALID as readonly string[]).includes(raw)
    ? (raw as LoopMode)
    : DEFAULT_MODE;

  const setMode = useCallback((next: LoopMode) => {
    const newParams = new URLSearchParams(params);
    if (next === DEFAULT_MODE) {
      newParams.delete('mode');
    } else {
      newParams.set('mode', next);
    }
    setParams(newParams, { replace: true });
  }, [params, setParams]);

  return { mode, setMode };
}

/**
 * URL-backed Clubhouse Friends mode (`?mode=`).
 * 'all' is the default and is omitted from the URL.
 *
 * Phase 3: replaces `useLoopMode`. Backward-compatible: `?mode=latest` (the
 * old Loop default) is normalised to 'all'; `?mode=popular` is treated as 'all'
 * since Clubhouse no longer exposes a Popular variant.
 */
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export type FriendsFeedMode = 'all' | 'live_now';

const VALID: readonly FriendsFeedMode[] = ['all', 'live_now'];
const DEFAULT_MODE: FriendsFeedMode = 'all';

export function useFriendsFeedMode() {
  const [params, setParams] = useSearchParams();

  const raw = params.get('mode');
  const mode: FriendsFeedMode =
    raw === 'live_now'
      ? 'live_now'
      : raw && (VALID as readonly string[]).includes(raw)
        ? (raw as FriendsFeedMode)
        : DEFAULT_MODE;

  const setMode = useCallback(
    (next: FriendsFeedMode) => {
      const newParams = new URLSearchParams(params);
      if (next === DEFAULT_MODE) {
        newParams.delete('mode');
      } else {
        newParams.set('mode', next);
      }
      setParams(newParams, { replace: true });
    },
    [params, setParams]
  );

  return { mode, setMode };
}

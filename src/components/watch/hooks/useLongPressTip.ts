import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { safeLocalStorage } from '@/utils/safeLocalStorage';

const LS_KEY = 'clbhouz:watch-longpress-tip-seen';

/**
 * Tracks whether the user has seen the one-shot "Long-press for more options"
 * tooltip. Backed by user_profiles.has_seen_watch_longpress_tip with
 * localStorage as a logged-out / offline fallback.
 */
export function useLongPressTip() {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const [hasSeen, setHasSeen] = useState<boolean>(true); // optimistic: hide until we confirm not-seen

  useEffect(() => {
    if (!userId) {
      setHasSeen(safeLocalStorage.get(LS_KEY) === '1');
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await (supabase
        .from('user_profiles')
        .select('has_seen_watch_longpress_tip')
        .eq('id', userId)
        .maybeSingle() as any);

      if (cancelled) return;

      const dbSeen = !!(data as any)?.has_seen_watch_longpress_tip;
      const lsSeen = safeLocalStorage.get(LS_KEY) === '1';
      setHasSeen(dbSeen || lsSeen);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const dismiss = useCallback(async () => {
    setHasSeen(true);
    safeLocalStorage.set(LS_KEY, '1');
    if (!userId) return;
    await (supabase.from('user_profiles') as any)
      .update({ has_seen_watch_longpress_tip: true })
      .eq('id', userId);
  }, [userId]);

  return { hasSeen, dismiss };
}

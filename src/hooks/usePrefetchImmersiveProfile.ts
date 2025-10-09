import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

async function prefetchUserBundle(userId: string) {
  // parallel fetches
  const profile = supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();
  const media = supabase.from('posts')
    .select('id, created_at, post_media(id, media_url, media_type, width, height, duration_seconds)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  const follows = supabase.from('user_follows')
    .select('following_id')
    .eq('follower_id', userId)
    .limit(1);

  await Promise.all([profile, media, follows]); // rely on internal client cache
}

export function usePrefetchImmersiveProfile() {
  const inflight = useRef<Set<string>>(new Set());

  const prefetch = useCallback((userId: string) => {
    if (!userId || inflight.current.has(userId)) return;
    inflight.current.add(userId);
    prefetchUserBundle(userId).finally(() => {
      // keep it in cache; allow another prefetch after some minutes if needed
      setTimeout(() => inflight.current.delete(userId), 5 * 60 * 1000);
    });
  }, []);

  return { prefetch };
}


import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Phase 2 Perf: Specific column selects for prefetch
const PROFILE_PREFETCH_SELECT = `
  id,
  username,
  display_name,
  profile_photo_url,
  bio,
  is_verified_golfer,
  is_creator
`;

// Phase 2 Perf: Specific column selects for prefetch
async function prefetchUserBundle(userId: string) {
  // parallel fetches with specific columns
  const profile = supabase
    .from('user_profiles')
    .select(PROFILE_PREFETCH_SELECT)
    .eq('id', userId)
    .maybeSingle();
    
  const media = supabase
    .from('posts')
    .select('id, created_at, badges, post_media(id, media_url, media_type, width, height, duration_seconds, studio_edits, filter_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
    
  const follows = supabase
    .from('user_follows')
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


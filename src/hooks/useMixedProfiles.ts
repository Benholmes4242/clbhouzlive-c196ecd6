import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { NotInterested } from '@/stores/notInterested';

export type MixedProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  has_recent_post?: boolean;
  latest_post_at?: string | null;
  is_known?: boolean; // Following or follower
};

type MixConfig = {
  known: number; // 0-1 ratio
  suggested: number; // 0-1 ratio
};

export function useMixedProfiles({
  limit = 20,
  mix = { known: 0.6, suggested: 0.4 }
}: {
  limit?: number;
  mix?: MixConfig;
} = {}) {
  const { user } = useSupabaseSession();
  const [data, setData] = useState<MixedProfile[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        NotInterested.clearExpired();
        const mutedIds = JSON.parse(localStorage.getItem('muted_creator_ids') || '[]');

        // 1) Get known profiles (following + followers)
        let knownIds = new Set<string>();
        
        if (user) {
          const [following, followers] = await Promise.all([
            supabase.from('user_follows').select('following_id').eq('follower_id', user.id),
            supabase.from('user_follows').select('follower_id').eq('following_id', user.id),
          ]);
          
          (following?.data ?? []).forEach(r => knownIds.add(r.following_id));
          (followers?.data ?? []).forEach(r => knownIds.add(r.follower_id));
        }

        // 2) Fetch known profiles with activity
        const targetKnown = Math.ceil(limit * mix.known);
        const targetSuggested = Math.ceil(limit * mix.suggested);
        
        let knownProfiles: MixedProfile[] = [];
        
        if (knownIds.size > 0 && targetKnown > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, profile_photo_url')
            .in('id', [...knownIds])
            .eq('is_public', true)
            .not('profile_photo_url', 'is', null)
            .not('display_name', 'is', null)
            .limit(targetKnown);

          if (profiles) {
            knownProfiles = await Promise.all(
              profiles.map(async (profile) => {
                const { data: posts } = await supabase
                  .from('posts')
                  .select('created_at')
                  .eq('user_id', profile.id)
                  .order('created_at', { ascending: false })
                  .limit(1);

                const latestPostAt = posts?.[0]?.created_at || null;
                const hasRecentPost = latestPostAt
                  ? (new Date().getTime() - new Date(latestPostAt).getTime()) < 24 * 60 * 60 * 1000
                  : false;

                return {
                  id: profile.id,
                  username: profile.username,
                  display_name: profile.display_name,
                  profile_photo_url: profile.profile_photo_url,
                  has_recent_post: hasRecentPost,
                  latest_post_at: latestPostAt,
                  is_known: true
                };
              })
            );
          }
        }

        // 3) Fetch suggested profiles (exclude known + self + muted)
        const excludeIds = [...knownIds, ...(user ? [user.id] : []), ...mutedIds];
        
        let suggestedQuery = supabase
          .from('user_profiles')
          .select('id, username, display_name, profile_photo_url')
          .eq('is_public', true)
          .not('profile_photo_url', 'is', null)
          .not('display_name', 'is', null);

        if (excludeIds.length > 0) {
          suggestedQuery = suggestedQuery.not('id', 'in', `(${excludeIds.join(',')})`);
        }

        const { data: suggestedRaw } = await suggestedQuery
          .order('created_at', { ascending: false })
          .limit(targetSuggested);

        let suggestedProfiles: MixedProfile[] = [];
        
        if (suggestedRaw) {
          suggestedProfiles = await Promise.all(
            suggestedRaw.map(async (profile) => {
              const { data: posts } = await supabase
                .from('posts')
                .select('created_at')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(1);

              const latestPostAt = posts?.[0]?.created_at || null;
              const hasRecentPost = latestPostAt
                ? (new Date().getTime() - new Date(latestPostAt).getTime()) < 24 * 60 * 60 * 1000
                : false;

              return {
                id: profile.id,
                username: profile.username,
                display_name: profile.display_name,
                profile_photo_url: profile.profile_photo_url,
                has_recent_post: hasRecentPost,
                latest_post_at: latestPostAt,
                is_known: false
              };
            })
          );
        }

        // 4) Interleave: known, suggested, known, suggested...
        const interleaved: MixedProfile[] = [];
        const k = [...knownProfiles];
        const s = [...suggestedProfiles];

        while (interleaved.length < limit && (k.length || s.length)) {
          if (k.length) interleaved.push(k.shift()!);
          if (s.length && interleaved.length < limit) interleaved.push(s.shift()!);
        }

        // 5) Filter out "not interested"
        const filtered = interleaved.filter(profile => !NotInterested.isHidden(profile.id));

        if (!mounted) return;
        setData(filtered);
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setData([]);
        }
      }

      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [limit, mix.known, mix.suggested, user?.id]);

  return { data, isLoading, error };
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { NotInterested } from '@/stores/notInterested';

export type RecommendedCreator = {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  has_recent_post?: boolean;
  latest_post_at?: string | null;
};

export function useRecommendedCreators(limit = 24) {
  const { user } = useSupabaseSession();
  const [data, setData] = useState<RecommendedCreator[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // Get muted creator IDs from localStorage
        const mutedIds = JSON.parse(localStorage.getItem('muted_creator_ids') || '[]');
        
        // Clean up expired "not interested" entries
        NotInterested.clearExpired();

        // Fetch public profiles with profile photos and display names
        let query = supabase
          .from('user_profiles')
          .select('id, username, display_name, profile_photo_url')
          .eq('is_public', true)
          .not('profile_photo_url', 'is', null)
          .not('display_name', 'is', null);

        // Exclude already followed users if logged in
        if (user) {
          const { data: following } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', user.id);

          if (following && following.length > 0) {
            const followingIds = following.map(f => f.following_id);
            query = query.not('id', 'in', `(${followingIds.join(',')})`);
          }

          // Exclude current user
          query = query.neq('id', user.id);
        }

        // Exclude muted creators
        if (mutedIds.length > 0) {
          query = query.not('id', 'in', `(${mutedIds.join(',')})`);
        }

        const { data: profiles, error: fetchError } = await query
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!mounted) return;

        if (fetchError) {
          setError(fetchError.message);
          setData([]);
        } else {
          // Fetch latest post timestamps for each profile
          const profilesWithActivity = await Promise.all(
            (profiles ?? []).map(async (profile) => {
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
                latest_post_at: latestPostAt
              };
            })
          );

          // Filter out "not interested" creators
          const filteredProfiles = profilesWithActivity.filter(
            profile => !NotInterested.isHidden(profile.id)
          );

          setData(filteredProfiles);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setData([]);
        }
      }
      
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [limit, user?.id]);

  return { data, isLoading, error };
}

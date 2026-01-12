import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExploreContentItem } from '@/components/explore/types';
import { isValidImageUrl } from './urlValidation';
import { buildVisibilityFilter } from '@/utils/visibilityFilter';

/**
 * useUnifiedFollowingFeed - Returns a single chronological feed
 * 
 * Phase 4 requirements:
 * - One feed, one scroll
 * - Chronological-first
 * - Videos, photos, moments interleaved naturally by timestamp
 * - No discovery injection
 * 
 * Phase D: Now includes business follows + polymorphic creator hydration
 */
export function useUnifiedFollowingFeed(pageSize = 20) {
  const [items, setItems] = useState<ExploreContentItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);

  const load = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const nextOffset = reset ? 0 : offset;

      // Get followed user ids (personal follows)
      const { data: userFollowing, error: fErr } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (fErr) throw fErr;
      const followedUserIds = (userFollowing ?? []).map(f => f.following_id);
      
      // Get followed business ids
      const { data: businessFollowing, error: bfErr } = await supabase
        .from('business_follows')
        .select('business_id')
        .eq('follower_id', user.id);
        
      if (bfErr) throw bfErr;
      const followedBusinessIds = (businessFollowing ?? []).map(f => f.business_id);
      
      setFollowingCount(followedUserIds.length + followedBusinessIds.length);
      
      if (followedUserIds.length === 0 && followedBusinessIds.length === 0) {
        setItems([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Build query filters for polymorphic following
      // Posts from: personal actors we follow OR business actors we follow
      const orFilters: string[] = [];
      if (followedUserIds.length > 0) {
        orFilters.push(`and(or(actor_type.eq.personal,actor_type.is.null),user_id.in.(${followedUserIds.join(',')}))`);
      }
      if (followedBusinessIds.length > 0) {
        orFilters.push(`and(actor_type.eq.business,actor_id.in.(${followedBusinessIds.join(',')}))`);
      }

      // Build visibility filter
      const visibilityFilter = buildVisibilityFilter(user.id);
      
      // Fetch ALL posts (videos + photos) in one query, ordered chronologically
      const { data: posts, error: pErr } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, actor_type, actor_id, categories, badges,
          post_media (id, media_type, media_url, duration_seconds, width, height, filter_id, studio_edits)
        `)
        .or(orFilters.join(','))
        .or(visibilityFilter)
        .eq('status', 'published') // Only show published posts
        .order('created_at', { ascending: false })
        .range(nextOffset, nextOffset + pageSize - 1);

      if (pErr) throw pErr;

      // Split posts by actor type for hydration
      const personalPosts = (posts ?? []).filter(p => !p.actor_type || p.actor_type === 'personal');
      const businessPosts = (posts ?? []).filter(p => p.actor_type === 'business');
      
      // Get unique user IDs for personal posts
      const userIds = [...new Set(personalPosts.map(post => post.user_id))];
      
      // Get unique business IDs for business posts
      const businessIds = [...new Set(businessPosts.map(post => post.actor_id).filter(Boolean))] as string[];
      
      // Fetch user profiles
      const { data: profiles } = userIds.length > 0
        ? await supabase
            .from('user_profiles')
            .select('id, display_name, username, profile_photo_url')
            .in('id', userIds)
        : { data: [] };
        
      // Fetch business accounts
      const { data: businessAccounts } = businessIds.length > 0
        ? await supabase
            .from('business_accounts')
            .select('id, name, logo_url, is_verified, category, location')
            .in('id', businessIds)
        : { data: [] };

      const mapPost = (post: any): ExploreContentItem | null => {
        const m = post.post_media?.[0];
        if (!m) return null;
        
        const kind = m.media_type === 'video' ? 'video' : 'image';
        
        const isValid =
          (kind === 'image' && isValidImageUrl(m.media_url)) ||
          (kind === 'video' && !!m.media_url);
          
        if (!isValid) return null;

        const isBusinessPost = post.actor_type === 'business';
        const userProfile = !isBusinessPost ? profiles?.find(p => p.id === post.user_id) : null;
        const businessAccount = isBusinessPost && post.actor_id 
          ? businessAccounts?.find(b => b.id === post.actor_id) 
          : null;
        
        // Build polymorphic creator
        const creator = isBusinessPost && businessAccount
          ? {
              type: 'business' as const,
              id: businessAccount.id,
              name: businessAccount.name || 'Business',
              avatarUrl: businessAccount.logo_url || undefined,
              verified: businessAccount.is_verified || false,
              subtitle: businessAccount.location || businessAccount.category || undefined,
            }
          : {
              type: 'personal' as const,
              id: post.user_id,
              name: userProfile?.display_name || userProfile?.username || 'User',
              username: userProfile?.username || undefined,
              avatarUrl: userProfile?.profile_photo_url || undefined,
            };
        
        // Legacy user object for backward compatibility
        const user = isBusinessPost && businessAccount
          ? {
              id: businessAccount.id,
              name: businessAccount.name || 'Business',
              avatar: businessAccount.logo_url || '',
              verified: businessAccount.is_verified || false,
            }
          : {
              id: post.user_id,
              name: userProfile?.display_name || userProfile?.username || 'User',
              username: userProfile?.username || undefined,
              avatar: userProfile?.profile_photo_url || undefined,
            };
        
        // Business object for business posts
        const business = isBusinessPost && businessAccount
          ? {
              id: businessAccount.id,
              name: businessAccount.name,
              logoUrl: businessAccount.logo_url,
              isVerified: businessAccount.is_verified,
              category: businessAccount.category,
              location: businessAccount.location,
            }
          : undefined;
        
        return {
          id: post.id,
          type: kind,
          src: m.media_url,
          duration: m.duration_seconds ? `${m.duration_seconds}s` : undefined,
          durationSeconds: m.duration_seconds ?? undefined,
          createdAt: post.created_at,
          actorType: (post.actor_type || 'personal') as 'personal' | 'business',
          actorId: post.actor_id || post.user_id,
          creator,
          user,
          business,
          categories: post.categories || [],
          badges: post.badges || [],
          title: post.content || '',
          likes: 0, // De-emphasized per Phase 4
          comments: 0,
          shares: 0,
          isFollowing: true,
        };
      };

      const newItems = (posts ?? [])
        .map(mapPost)
        .filter(Boolean) as ExploreContentItem[];

      setItems(prev => reset ? newItems : [...prev, ...newItems]);
      setHasMore((posts ?? []).length === pageSize);
      setOffset(nextOffset + pageSize);
      setLoading(false);
    } catch (error) {
      console.error('Error loading unified following feed:', error);
      setLoading(false);
    }
  }, [offset, pageSize]);

  useEffect(() => {
    load(true);
  }, []); // Initial load

  return {
    items,
    loading,
    hasMore,
    followingCount,
    loadMore: () => load(false),
    reset: () => load(true),
  };
}

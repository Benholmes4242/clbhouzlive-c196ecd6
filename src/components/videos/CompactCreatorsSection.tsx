import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Check, UserPlus } from 'lucide-react';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useFollowStatus } from '@/hooks/useFollowStatus';

interface Creator {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

interface CompactCreatorsSectionProps {
  onCreatorClick?: (creatorId: string) => void;
  onViewAll?: () => void;
  className?: string;
}

/**
 * CompactCreatorsSection - Redesigned compact creator cards
 * 
 * Features:
 * - 60% height reduction from original
 * - Avatar + name + follow button only
 * - Horizontal scroll carousel
 * - Quick follow action
 */
export const CompactCreatorsSection: React.FC<CompactCreatorsSectionProps> = ({
  onCreatorClick,
  onViewAll,
  className,
}) => {
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser();
  const [optimisticFollows, setOptimisticFollows] = useState<Set<string>>(new Set());
  const [optimisticUnfollows, setOptimisticUnfollows] = useState<Set<string>>(new Set());

  // Fetch suggested creators - users with most video posts
  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['suggested-creators'],
    queryFn: async () => {
      // Get users who have posted videos, ordered by post count
      const { data, error } = await supabase
        .from('posts')
        .select(`
          user_id,
          user_profiles!posts_user_id_fkey (
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .not('post_media', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Count videos per user and dedupe
      const userVideoCounts = new Map<string, { creator: Creator; count: number }>();
      
      data?.forEach((post: any) => {
        if (!post.user_profiles) return;
        const userId = post.user_id;
        const existing = userVideoCounts.get(userId);
        
        if (existing) {
          existing.count++;
        } else {
          userVideoCounts.set(userId, {
            creator: {
              id: userId,
              name: `${post.user_profiles.first_name || ''} ${post.user_profiles.last_name || ''}`.trim() || 'Golfer',
              username: post.user_profiles.username,
              avatarUrl: post.user_profiles.avatar_url,
            },
            count: 1,
          });
        }
      });

      // Sort by video count and return top 8
      return Array.from(userVideoCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map(u => u.creator);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Use follow status hook with creator IDs
  const creatorIds = creators.map(c => c.id);
  const { followingIds } = useFollowStatus(creatorIds);

  const checkIsFollowing = (creatorId: string): boolean => {
    if (optimisticUnfollows.has(creatorId)) return false;
    if (optimisticFollows.has(creatorId)) return true;
    return followingIds.has(creatorId);
  };

  const handleFollowClick = async (e: React.MouseEvent, creatorId: string) => {
    e.stopPropagation();
    
    const currentlyFollowing = checkIsFollowing(creatorId);
    
    // Optimistic update
    if (currentlyFollowing) {
      setOptimisticFollows(prev => {
        const next = new Set(prev);
        next.delete(creatorId);
        return next;
      });
      await unfollowUser(creatorId);
    } else {
      setOptimisticFollows(prev => new Set([...prev, creatorId]));
      await followUser(creatorId);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <section className={cn("mb-6", className)}>
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
              <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-14 bg-muted rounded animate-pulse" />
              <div className="h-7 w-16 bg-muted rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // No creators to show
  if (creators.length === 0) {
    return null;
  }

  return (
    <section className={cn("mb-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-bold text-foreground">Creators for you</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>See all</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-2">
        {creators.map((creator) => {
          const following = checkIsFollowing(creator.id);
          
          return (
            <div
              key={creator.id}
              className="flex-shrink-0 flex flex-col items-center gap-2 w-20 cursor-pointer"
              onClick={() => onCreatorClick?.(creator.id)}
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-border hover:ring-primary/50 transition-all">
                  <GolferAvatar
                    name={creator.name}
                    photoUrl={creator.avatarUrl}
                    size={64}
                  />
                </div>
                {creator.isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-1">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="text-xs font-medium text-foreground text-center line-clamp-1 w-full">
                {creator.name}
              </p>

              {/* Follow button */}
              <button
                onClick={(e) => handleFollowClick(e, creator.id)}
                disabled={followLoading}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  following
                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {following ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CompactCreatorsSection;

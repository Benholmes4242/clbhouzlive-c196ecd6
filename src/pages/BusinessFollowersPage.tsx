import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessFollowersCount } from '@/hooks/useBusinessFollow';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useFollowAsActor } from '@/hooks/useFollowAsActor';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Search, Users, Check, X } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Input } from '@/components/ui/input';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

const PAGE_SIZE = 50;

interface FollowerProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  is_verified_golfer: boolean;
  home_club_name?: string | null;
}

/* ─── Follow-back button per row ─── */
function FollowBackButton({ followerId, businessId }: { followerId: string; businessId: string }) {
  const { activeActor } = useActiveActor();
  const { followUser, unfollowUser, isFollowingUser: isFollowPending, isUnfollowingUser: isUnfollowPending } = useFollowAsActor();
  const queryClient = useQueryClient();

  // Check if already following via business_outbound_follows
  const { data: isFollowing = false } = useQuery({
    queryKey: ['business-outbound-follow-status', businessId, followerId],
    enabled: !!businessId && !!followerId,
    queryFn: async () => {
      if (activeActor?.type === 'business' && activeActor?.id === businessId) {
        const { data } = await supabase
          .from('business_outbound_follows')
          .select('id')
          .eq('follower_business_id', businessId)
          .eq('following_type', 'personal')
          .eq('following_id', followerId)
          .maybeSingle();
        return !!data;
      }
      // Personal actor fallback — check user_follows
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', businessId)
        .eq('following_id', followerId)
        .maybeSingle();
      return !!data;
    },
    staleTime: 60_000,
  });

  const busy = isFollowPending || isUnfollowPending;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    try {
      if (isFollowing) {
        await unfollowUser(followerId);
      } else {
        await followUser(followerId);
      }
      queryClient.invalidateQueries({ queryKey: ['business-outbound-follow-status', businessId, followerId] });
    } catch {
      // handled by hook
    }
  };

  if (isFollowing) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border bg-muted text-muted-foreground text-[13px] font-medium active:scale-[0.97] transition-transform disabled:opacity-50"
      >
        <Check className="w-3.5 h-3.5" />
        Following
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={busy}
      className="inline-flex items-center h-9 px-4 rounded-lg border border-[hsl(38,92%,50%)]/40 bg-[hsl(38,92%,50%)]/10 text-[hsl(35,80%,43%)] text-[13px] font-medium active:scale-[0.97] transition-transform disabled:opacity-50"
    >
      Follow back
    </button>
  );
}

/* ─── Loading skeleton ─── */
function FollowersSkeleton() {
  return (
    <div className="px-4 pt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-4">
          <div className="w-14 h-14 rounded-sq-md bg-muted animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-32 h-4 bg-muted rounded animate-pulse" />
            <div className="w-24 h-3 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-24 h-9 bg-muted rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function BusinessFollowersPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim().toLowerCase(), 200);

  useHideBottomNav();
  useHideHeader();

  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const { data: business, isLoading: bizLoading } = useBusinessProfile(idOrSlug);
  const { data: followersCount = 0 } = useBusinessFollowersCount(business?.id);
  const { data: membership } = useBusinessMembership(business?.id);

  const isOwner = !!membership && ['owner', 'admin'].includes(membership.role);
  const isActingAsBusiness = activeActor?.type === 'business' && activeActor?.id === business?.id;

  // Infinite query for followers
  const {
    data,
    isLoading: followersLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['business-followers-list', business?.id],
    enabled: !!business?.id,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('business_follows')
        .select(`
          id,
          follower:user_profiles!business_follows_follower_id_fkey (
            id,
            display_name,
            username,
            profile_photo_url,
            is_verified_golfer,
            home_club_name
          )
        `)
        .eq('business_id', business?.id ?? '')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return (data || [])
        .map((row: any) => row.follower as FollowerProfile)
        .filter(Boolean);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    staleTime: 60_000,
  });

  const allFollowers = data?.pages.flat() ?? [];
  const filtered = debouncedSearch
    ? allFollowers.filter(
        (f) =>
          f.display_name?.toLowerCase().includes(debouncedSearch) ||
          f.username?.toLowerCase().includes(debouncedSearch)
      )
    : allFollowers;

  // Intersection observer sentinel for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (bizLoading) return <GenericPageSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}
      >
        <div className="flex items-center px-4 h-14">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-foreground active:scale-[0.97] transition-transform"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-[16px] font-semibold text-foreground">
              Followers{' '}
              {followersCount > 0 && (
                <span className="font-normal text-muted-foreground">{followersCount}</span>
              )}
            </h1>
          </div>
          <div className="w-11" />
        </div>

        {/* Search bar */}
        {allFollowers.length > 0 && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search followers..."
                className="pl-10 h-11 rounded-xl border-border bg-muted/50 focus-visible:ring-[hsl(38,92%,50%)]/40"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {followersLoading ? (
        <FollowersSkeleton />
      ) : allFollowers.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-[16px] font-semibold text-foreground mb-1">No followers yet</p>
          <p className="text-[14px] text-muted-foreground max-w-[260px]">
            When people follow {business?.name || 'this business'}, they'll appear here.
          </p>
        </div>
      ) : filtered.length === 0 && debouncedSearch ? (
        /* Search empty state */
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="text-[15px] font-semibold text-foreground mb-1">
            No results for "{search}"
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-[14px] font-medium text-[hsl(35,80%,43%)] mt-2 active:opacity-70"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          {/* Follower rows */}
          <div>
            {filtered.map((follower, idx) => (
              <React.Fragment key={follower.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${follower.username || follower.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-4 active:bg-muted/50 transition-colors text-left"
                >
                  <div
                    className="flex-shrink-0"
                    style={{ border: '0.5px solid hsl(var(--border))', borderRadius: '34%', lineHeight: 0 }}
                  >
                    <SquircleAvatar
                      src={follower.profile_photo_url}
                      alt={follower.display_name || follower.username || ''}
                      size={56}
                      hideRing
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[15px] font-semibold text-foreground truncate">
                        {follower.display_name || follower.username}
                      </span>
                      {follower.is_verified_golfer && <VerifiedBadge size="sm" />}
                    </div>
                    {follower.username && (
                      <p className="text-[13px] text-muted-foreground truncate">@{follower.username}</p>
                    )}
                    {follower.home_club_name && (
                      <p className="text-[12px] text-muted-foreground/70 truncate mt-0.5">
                        {follower.home_club_name}
                      </p>
                    )}
                  </div>

                  {/* Follow-back button — only for owner, not for self */}
                  {isOwner && isActingAsBusiness && follower.id !== user?.id && business?.id && (
                    <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                      <FollowBackButton followerId={follower.id} businessId={business.id} />
                    </div>
                  )}
                </button>

                {/* Inset divider */}
                {idx < filtered.length - 1 && (
                  <div className="ml-[72px] border-b border-border/50" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          {hasNextPage && <div ref={sentinelRef} className="h-px" />}

          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 rounded-full border-2 border-[hsl(38,92%,50%)] border-t-transparent animate-spin" />
            </div>
          )}

          {/* Footer count */}
          {!debouncedSearch && (
            <p className="text-[13px] text-muted-foreground text-center py-6">
              Showing {allFollowers.length} of {followersCount} followers
            </p>
          )}
        </>
      )}
    </div>
  );
}

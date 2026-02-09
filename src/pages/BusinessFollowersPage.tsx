import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessFollowersCount } from '@/hooks/useBusinessFollow';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';

interface FollowerProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  is_verified_golfer: boolean;
}

export default function BusinessFollowersPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { data: business, isLoading: bizLoading } = useBusinessProfile(idOrSlug);
  const { data: followersCount = 0 } = useBusinessFollowersCount(business?.id);

  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: ['business-followers-list', business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_follows')
        .select(`
          id,
          follower:user_profiles!business_follows_follower_id_fkey (
            id,
            display_name,
            username,
            profile_photo_url,
            is_verified_golfer
          )
        `)
        .eq('business_id', business!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || [])
        .map((row: any) => row.follower as FollowerProfile)
        .filter(Boolean);
    },
    staleTime: 60_000,
  });

  if (bizLoading) return <GenericPageSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 min-h-[56px]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center active:opacity-70 transition-opacity"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              Followers
              <span className="text-muted-foreground font-normal ml-1.5">{followersCount}</span>
            </h1>
            {business?.name && (
              <p className="text-sm text-muted-foreground truncate">{business.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border">
        {followersLoading ? (
          <div className="px-4 py-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-muted rounded" />
                  <div className="w-24 h-3 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : followers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <p className="text-lg font-semibold text-foreground mb-1">No followers yet</p>
            <p className="text-sm text-muted-foreground">
              When people follow {business?.name || 'this business'}, they'll appear here.
            </p>
          </div>
        ) : (
          followers.map((follower) => (
            <button
              key={follower.id}
              type="button"
              onClick={() => navigate(`/profile/${follower.username || follower.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition-colors text-left"
            >
              <SquircleAvatar
                src={follower.profile_photo_url}
                alt={follower.display_name || follower.username || ''}
                size={48}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {follower.display_name || follower.username}
                  </span>
                  {follower.is_verified_golfer && <VerifiedBadge size="sm" />}
                </div>
                {follower.username && (
                  <p className="text-xs text-muted-foreground truncate">@{follower.username}</p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

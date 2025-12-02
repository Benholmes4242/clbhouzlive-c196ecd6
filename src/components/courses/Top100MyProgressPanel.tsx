import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Top100HeroSection } from './Top100HeroSection';
import { Top100MilestonesCarousel } from './Top100MilestonesCarousel';
import { Top100RegionProgressGrid } from './Top100RegionProgressGrid';
import { Top100RecentRoundsFeed } from './Top100RecentRoundsFeed';
import ProfileBadgeStrip from '@/components/profile/ProfileBadgeStrip';
import { useTop100FriendsSnapshot } from '@/hooks/useTop100FriendsSnapshot';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Top100FriendsActivityCard from '@/components/top100/Top100FriendsActivityCard';

interface Top100MyProgressPanelProps {
  userId?: string | null;
}

const Top100MyProgressPanel: React.FC<Top100MyProgressPanelProps> = ({ userId }) => {
  const { session } = useSupabaseSession();
  const effectiveUserId = userId ?? session?.user?.id ?? null;
  const { data, isLoading } = useTop100ProgressForUser(effectiveUserId);
  const { data: profile } = useUserProfile(effectiveUserId);
  const { data: friendsSnapshot } = useTop100FriendsSnapshot();
  const navigate = useNavigate();
  const isOwnProfile = !userId || userId === session?.user?.id;
  const { toast } = useToast();
  const prevTotalRef = useRef<number | null>(null);

  // Milestone "Share to Clubhouse" logic - MUST be before early returns
  useEffect(() => {
    if (!data || !isOwnProfile) return;

    const current = data.totalTop100Played;
    const prev = prevTotalRef.current ?? 0;

    const thresholds = [5, 10, 20, 50, 100, 200, 300, 400];
    const justHit = thresholds.find((t) => prev < t && current >= t);

    if (justHit) {
      const club = data.club_tier_name;
      toast({
        title: club 
          ? `You've just unlocked ${club} (${justHit} Top 100 courses). Share to Clubhouse?`
          : `Top 100 milestone unlocked – ${justHit} Club 🎉`,
        description: 'Share your journey with the Clubhouse community?',
        action: (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/create-moment')}
          >
            Share to Clubhouse
          </Button>
        ),
      });
    }

    prevTotalRef.current = current;
  }, [data?.totalTop100Played, data?.club_tier_name, isOwnProfile, toast, navigate]);

  // Calculate badge props for ProfileBadgeStrip
  const badgeProps = React.useMemo(() => {
    if (!data) return null;
    
    const totalPlayed = data.totalTop100Played;
    const gbIList = data.lists.find(l => l.listSlug === 'gb-i');
    const europeList = data.lists.find(l => l.listSlug === 'europe');
    const usaList = data.lists.find(l => l.listSlug === 'usa');
    const globalList = data.lists.find(l => l.listSlug === 'global');

    return {
      coursesPlayed: totalPlayed,
      totalXP: 0, // XP not tracked in Top 100 context
      britainIrelandCompleted: gbIList?.played || 0,
      europeCompleted: europeList?.played || 0,
      usaCompleted: usaList?.played || 0,
      worldwideCompleted: globalList?.played || 0,
    };
  }, [data]);

  if (!effectiveUserId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sign in to track your Top 100 progress</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const lastPlayedDate = data.recent_rounds[0]?.played_at || null;

  // Avatar URL - prioritize profile photo over session metadata
  const avatarUrl = 
    profile?.profile_photo_url ?? 
    session?.user?.user_metadata?.avatar_url ?? 
    null;

  const displayName = 
    profile?.display_name ?? 
    session?.user?.user_metadata?.full_name ?? 
    null;

  // Friends comparison logic
  const myCount = data?.totalTop100Played ?? 0;
  const friends = friendsSnapshot?.friends ?? [];

  const topFriends = friends
    .slice()
    .sort((a, b) => b.total_top100_played - a.total_top100_played)
    .slice(0, 3);

  let friendMessage: string | null = null;

  if (friendsSnapshot?.me && friends.length > 0) {
    const bestFriend = topFriends[0];

    if (bestFriend && bestFriend.total_top100_played > myCount) {
      const diff = bestFriend.total_top100_played - myCount;
      friendMessage = `${bestFriend.display_name} is ahead by ${diff} course${diff === 1 ? '' : 's'}.`;
    } else {
      friendMessage = "You're leading your friends – keep your edge.";
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="text-center space-y-3 px-4">
        <h1 className="text-3xl font-bold text-foreground">
          {isOwnProfile ? 'Your Top 100 Journey' : 'Top 100 Journey'}
        </h1>
        <p className="text-muted-foreground">
          {isOwnProfile 
            ? 'Track your elite pilgrimage across the world\'s greatest courses'
            : 'See how far they\'ve come across the world\'s greatest courses'}
        </p>
      </div>

      {/* Hero Section with Big Ring */}
      <div className="mt-6 px-4">
        <Top100HeroSection
          avatarUrl={avatarUrl}
          displayName={displayName}
          totalPlayed={data.totalTop100Played}
          regionsCount={data.regions_count}
          clubRing={data.club_ring || 'none'}
          clubLabel={data.club_label || null}
          clubTierName={data.club_tier_name || null}
          lastPlayedDate={lastPlayedDate}
          isOwnProfile={isOwnProfile}
        />
      </div>

          {/* Next Milestone Callout */}
          {data?.next_milestone && (
            <div className="flex justify-center px-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-card/60 px-3 py-1 text-xs text-muted-foreground border border-border/40">
                <span>Next milestone:</span>
                <span className="font-medium text-foreground">
                  {data.next_milestone.remaining} more{' '}
                  {data.next_milestone.remaining === 1 ? 'course' : 'courses'} to{' '}
                  {data.next_milestone.tierName}
                </span>
              </div>
            </div>
          )}

          {/* Friends Chasing the Top 100 - Redesigned to match Friends Activity Card */}
          {isOwnProfile && friendsSnapshot && friendsSnapshot.friends.length > 0 && (
            <div className="px-4">
              <Top100FriendsActivityCard
                friends={topFriends}
                friendMessage={friendMessage}
                onViewLeaderboard={() => navigate('/top100?tab=leaderboard&view=players')}
              />
            </div>
          )}

          {/* Milestones Carousel */}
          <div className="px-4">
            <Top100MilestonesCarousel
              totalPlayed={data.totalTop100Played}
              onMilestoneClick={() => {
                // Already on My Progress, could open a modal in future
              }}
            />
          </div>

          {/* Region Progress Grid */}
          <div className="px-4">
            <Top100RegionProgressGrid
              lists={data.lists}
              onListClick={(slug) => navigate(`/top100/${slug}`)}
            />
          </div>

        {/* Recent Top 100 Rounds - Full-width breakout */}
        <div className="-mx-4 sm:mx-0">
          <Top100RecentRoundsFeed
            rounds={data.recent_rounds}
            isOwnProfile={isOwnProfile}
          />
        </div>
    </div>
  );
};

export default Top100MyProgressPanel;

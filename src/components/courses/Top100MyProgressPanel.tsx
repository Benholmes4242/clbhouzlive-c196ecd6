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

// Tier colors for next milestone chip
const TIER_COLORS: Record<string, string> = {
  none: '#94a3b8',
  rookie: '#D9C7A3',
  fairway: '#8BBF5A',
  founders: '#2E5930',
  heritage: '#C8A44B',
  century: '#B7BCC6',
  elite: '#D9A441',
  legendary: '#5A3E8C',
  grandslam: '#0C0F14',
};

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

  // Calculate next milestone progress percentage - MUST be before early returns
  const nextMilestoneProgress = React.useMemo(() => {
    if (!data?.next_milestone) return 0;
    const thresholds = [5, 10, 20, 50, 100, 200, 300, 400];
    const currentThreshold = thresholds.find(t => t > (data?.totalTop100Played ?? 0)) || 400;
    const prevThreshold = thresholds[thresholds.indexOf(currentThreshold) - 1] || 0;
    const range = currentThreshold - prevThreshold;
    const progress = (data?.totalTop100Played ?? 0) - prevThreshold;
    return Math.min(100, Math.round((progress / range) * 100));
  }, [data?.next_milestone, data?.totalTop100Played]);

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
  const realFriends = friendsSnapshot?.friends ?? [];

  // Mock users for testing expanded view (remove in production)
  const mockFriends = [
    { friend_id: 'mock-1', display_name: 'James Morrison', profile_photo_url: null, home_club: 'Royal Birkdale', total_top100_played: 47 },
    { friend_id: 'mock-2', display_name: 'Sarah Thompson', profile_photo_url: null, home_club: 'Sunningdale', total_top100_played: 38 },
    { friend_id: 'mock-3', display_name: 'Michael Chen', profile_photo_url: null, home_club: 'Pebble Beach', total_top100_played: 31 },
    { friend_id: 'mock-4', display_name: 'Emma Williams', profile_photo_url: null, home_club: 'St Andrews', total_top100_played: 28 },
    { friend_id: 'mock-5', display_name: 'David Park', profile_photo_url: null, home_club: 'Royal County Down', total_top100_played: 24 },
    { friend_id: 'mock-6', display_name: 'Lucy Anderson', profile_photo_url: null, home_club: 'Muirfield', total_top100_played: 19 },
    { friend_id: 'mock-7', display_name: 'Tom Richards', profile_photo_url: null, home_club: 'Carnoustie', total_top100_played: 15 },
    { friend_id: 'mock-8', display_name: 'Sophie Martin', profile_photo_url: null, home_club: 'Turnberry', total_top100_played: 12 },
    { friend_id: 'mock-9', display_name: 'Alex Johnson', profile_photo_url: null, home_club: 'Royal Portrush', total_top100_played: 9 },
    { friend_id: 'mock-10', display_name: 'Rachel Davies', profile_photo_url: null, home_club: 'Wentworth', total_top100_played: 6 },
  ];

  // Combine real friends with mock friends for testing
  const friends = [...realFriends, ...mockFriends];

  const topFriends = friends
    .slice()
    .sort((a, b) => b.total_top100_played - a.total_top100_played)
    .slice(0, 10);

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

  // Dynamic title based on profile ownership
  const possessive = displayName?.endsWith('s')
    ? `${displayName}'`
    : `${displayName}'s`;
  const mainTitle = isOwnProfile
    ? "Your Top 100 Journey"
    : `${possessive} Top 100 Journey`;

  return (
    <div className="w-full max-w-full space-y-5 pb-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          {mainTitle}
        </h1>
        <p className="text-muted-foreground">
          Track your elite pilgrimage across the world's greatest courses
        </p>
      </div>

      {/* Hero Section with Big Ring */}
      <div className="mt-4">
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

      {/* Next Milestone Callout - Apple-style chip */}
      {data?.next_milestone && (() => {
        const nextTierColor = TIER_COLORS[data.next_milestone.tierId] || TIER_COLORS.none;
        return (
          <div className="flex justify-center">
            <div className="w-full max-w-sm bg-card border border-border/60 rounded-full py-2.5 px-4 flex flex-col">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-accent flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <span className="text-sm">
                  Next milestone:{' '}
                  <span className="font-semibold">
                    {data.next_milestone.remaining} more {data.next_milestone.remaining === 1 ? 'course' : 'courses'} to{' '}
                  </span>
                  <span className="font-semibold" style={{ color: nextTierColor }}>
                    {data.next_milestone.tierName}
                  </span>
                </span>
              </div>
              {/* Micro progress bar */}
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${nextMilestoneProgress}%`, backgroundColor: nextTierColor }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Friends Chasing the Top 100 - Redesigned to match Friends Activity Card */}
      {isOwnProfile && friendsSnapshot && friendsSnapshot.friends.length > 0 && (
        <Top100FriendsActivityCard
          friends={topFriends}
          friendMessage={friendMessage}
          onViewLeaderboard={() => navigate('/top100?tab=leaderboard&view=players')}
        />
      )}

      {/* Milestones Carousel */}
      <Top100MilestonesCarousel
        totalPlayed={data.totalTop100Played}
        onMilestoneClick={() => {
          // Already on My Progress, could open a modal in future
        }}
      />

      {/* Region Progress Grid */}
      <Top100RegionProgressGrid
        lists={data.lists}
        onListClick={(slug) => navigate(`/top100/${slug}`)}
        isOwnProfile={isOwnProfile}
        displayName={displayName}
      />

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

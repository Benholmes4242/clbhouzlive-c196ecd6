import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Top100ProgressHero } from '@/components/top100/Top100ProgressHero';
import { Top100MilestonesCarousel } from '@/components/courses/Top100MilestonesCarousel';
import { Top100NearAchievements } from '@/components/top100/Top100NearAchievements';
import { Top100YearSummary } from '@/components/top100/Top100YearSummary';


import { Top100RegionProgressGrid } from './Top100RegionProgressGrid';
import { Top100RecentRoundsFeed } from './Top100RecentRoundsFeed';
import { useTop100FriendsSnapshot } from '@/hooks/useTop100FriendsSnapshot';
import Top100FriendsActivityCard from '@/components/top100/Top100FriendsActivityCard';
import { buildYearSummary } from '@/lib/top100ProgressSelectors';

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
  const prevTotalRef = useRef<number | null>(null);

  // Milestone tracking - keeping ref update for future use, toast disabled
  useEffect(() => {
    if (!data || !isOwnProfile) return;
    prevTotalRef.current = data.totalTop100Played;
  }, [data?.totalTop100Played, isOwnProfile]);

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

  // Friends comparison logic - real data only
  const myCount = data?.totalTop100Played ?? 0;
  const friends = friendsSnapshot?.friends ?? [];

  // Filter to only friends who have played at least 1 Top 100 course, sort by total_top100_played DESC
  const topFriends = friends
    .filter(f => (f.total_top100_played ?? 0) > 0)
    .sort((a, b) => (b.total_top100_played ?? 0) - (a.total_top100_played ?? 0))
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

  // Derive Group B insights
  const yearSummary = buildYearSummary(data.recent_rounds);

  return (
    <div className="w-full max-w-full space-y-5 pb-6 px-5">

      {/* Progress Hero Strip */}
      <div className="mt-4">
        <Top100ProgressHero
          displayName={displayName}
          avatarUrl={avatarUrl}
          tierId={data.club_ring || 'none'}
          tierLabel={data.club_tier_name || null}
          totalTop100Played={data.totalTop100Played}
          regionsCount={data.regions_count}
          lastRoundAt={lastPlayedDate}
          isOwnProfile={isOwnProfile}
        />
      </div>

      {/* B1: This year so far strip */}
      <Top100YearSummary summary={yearSummary} regionsCount={data.regions_count} />

      {/* Next Achievement Callout - centered text, no icon */}
      {data?.next_milestone && (() => {
        const nextTierColor = TIER_COLORS[data.next_milestone.tierId] || TIER_COLORS.none;
        return (
          <div className="flex justify-center">
            <div className="w-full max-w-sm bg-card border border-border/60 rounded-full py-2.5 px-4 flex flex-col gap-2">
              <p className="text-xs sm:text-sm font-medium text-center text-foreground whitespace-nowrap">
                Next achievement:{' '}
                <span className="font-semibold">
                  {data.next_milestone.remaining} more to{' '}
                </span>
                <span className="font-semibold" style={{ color: nextTierColor }}>
                  {data.next_milestone.tierName}
                </span>
              </p>
              {/* Micro progress bar */}
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${nextMilestoneProgress}%`, backgroundColor: nextTierColor }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Friends Chasing the Top 100 - Only show if there are friends with Top 100 courses played */}
      {isOwnProfile && topFriends.length > 0 && (
        <Top100FriendsActivityCard
          friends={topFriends}
          friendMessage={friendMessage}
          onViewLeaderboard={() => navigate('/top100?tab=leaderboard&view=players')}
        />
      )}

      {/* Achievements Carousel */}
      <Top100MilestonesCarousel totalPlayed={data.totalTop100Played} />

      {/* Badges You're Close To */}
      <Top100NearAchievements totalTop100Played={data.totalTop100Played} />

      {/* Region Progress Grid */}
      <Top100RegionProgressGrid
        lists={data.lists}
        onListClick={(slug) => navigate(`/top100/${slug}`)}
        isOwnProfile={isOwnProfile}
        displayName={displayName}
      />

      {/* Recent Top 100 Rounds - Full-width breakout */}
      <div className="-mx-5 sm:mx-0">
        <Top100RecentRoundsFeed
          rounds={data.recent_rounds}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </div>
  );
};

export default Top100MyProgressPanel;

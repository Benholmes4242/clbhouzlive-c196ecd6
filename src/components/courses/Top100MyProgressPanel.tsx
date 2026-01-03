import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Top100ProgressHero } from '@/components/top100/Top100ProgressHero';
import { Top100MilestonesCarousel } from '@/components/courses/Top100MilestonesCarousel';
import { Top100YearSummary } from '@/components/top100/Top100YearSummary';
import { Top100ListCompletionsRow } from '@/components/top100/Top100ListCompletionsRow';
import { Top100ClosestBadgeCard } from '@/components/top100/Top100ClosestBadgeCard';
import { Top100RecentRoundsCarousel } from '@/components/top100/Top100RecentRoundsCarousel';
import { UnifiedAchievementSheet, type AchievementData } from '@/components/top100/UnifiedAchievementSheet';
import {
  Top100ProgressHeroSkeleton,
  Top100YearSummarySkeleton,
  Top100MilestonesCarouselSkeleton,
  Top100RegionProgressSkeleton,
  Top100RecentRoundsSkeleton,
  Top100ClosestBadgeSkeleton,
  Top100TimelineSkeleton,
  Top100StreakSkeleton,
} from '@/components/top100/Top100ProgressSkeletons';
import type { Top100ListId } from '@/config/top100ListMilestones';
import { MILESTONE_THEMES } from '@/lib/globalAchievementMilestoneSystem';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

import { Top100RegionProgressGrid } from '@/components/top100/Top100RegionProgressGrid';
import { useTop100FriendsSnapshot } from '@/hooks/useTop100FriendsSnapshot';
import Top100FriendsActivityCard from '@/components/top100/Top100FriendsActivityCard';
import { buildYearSummary } from '@/lib/top100ProgressSelectors';
import { Top100ProgressTimeline } from '@/components/top100/Top100ProgressTimeline';
import { Top100LoggingStreak } from '@/components/top100/Top100LoggingStreak';

// Tier colors for next milestone chip - derived from global MILESTONE_THEMES
const TIER_COLORS: Record<string, string> = {
  none: '#94a3b8',
  rookie: MILESTONE_THEMES[5].bgDark,
  fairway: MILESTONE_THEMES[10].bgDark,
  founders: MILESTONE_THEMES[20].bgDark,
  heritage: MILESTONE_THEMES[50].bgDark,
  century: MILESTONE_THEMES[100].bgDark,
  elite: MILESTONE_THEMES[200].bgDark,
  legendary: MILESTONE_THEMES[300].bgDark,
  grandslam: MILESTONE_THEMES[400].bgDark,
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

  // Unified achievement sheet state - single controller for both milestone and regional
  const [achievementSheetData, setAchievementSheetData] = useState<AchievementData | null>(null);
  const [isAchievementSheetOpen, setIsAchievementSheetOpen] = useState(false);

  // Open milestone achievement sheet
  const openMilestoneSheet = useCallback((threshold: number) => {
    setAchievementSheetData({
      type: 'milestone',
      threshold,
      totalPlayed: data?.totalTop100Played ?? 0,
    });
    setIsAchievementSheetOpen(true);
  }, [data?.totalTop100Played]);

  // Open regional achievement sheet
  const openRegionalSheet = useCallback((slug: string, played: number, total: number) => {
    setAchievementSheetData({
      type: 'regional',
      listSlug: slug as 'global' | 'gb-i' | 'usa' | 'europe',
      played,
      total,
    });
    setIsAchievementSheetOpen(true);
  }, []);

  const closeAchievementSheet = useCallback(() => {
    setIsAchievementSheetOpen(false);
  }, []);

  // Milestone tracking - keeping ref update for future use
  useEffect(() => {
    if (!data || !isOwnProfile) return;
    prevTotalRef.current = data.totalTop100Played;
  }, [data?.totalTop100Played, isOwnProfile]);

  // Calculate next milestone progress percentage
  const nextMilestoneProgress = React.useMemo(() => {
    if (!data?.next_milestone) return 0;
    const thresholds = [5, 10, 20, 50, 100, 200, 300, 400];
    const currentThreshold = thresholds.find(t => t > (data?.totalTop100Played ?? 0)) || 400;
    const prevThreshold = thresholds[thresholds.indexOf(currentThreshold) - 1] || 0;
    const range = currentThreshold - prevThreshold;
    const progress = (data?.totalTop100Played ?? 0) - prevThreshold;
    return Math.min(100, Math.round((progress / range) * 100));
  }, [data?.next_milestone, data?.totalTop100Played]);

  // Derive year summary from year-scoped data (not recent_rounds)
  // MUST be called before any early returns to satisfy React hooks rules
  const yearSummary = useMemo(() => buildYearSummary(data?.year_rounds ?? []), [data?.year_rounds]);
  
  // Count regions active this year (for Year Summary)
  // MUST be called before any early returns to satisfy React hooks rules
  const yearRounds = data?.year_rounds ?? [];
  const yearRegionsCount = useMemo(() => {
    const regions = new Set<string>();
    for (const round of yearRounds) {
      for (const slug of round.list_slugs ?? []) {
        regions.add(slug);
      }
    }
    return regions.size;
  }, [yearRounds]);

  // ===== EARLY RETURNS AFTER ALL HOOKS =====
  
  if (!effectiveUserId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sign in to track your Top 100 progress</p>
      </div>
    );
  }

  // Skeleton loading state (G2)
  if (isLoading) {
    return (
      <div className="w-full max-w-full pb-8">
        <Top100ProgressHeroSkeleton />
        <Top100YearSummarySkeleton />
        <div className="mb-4">
          <Top100TimelineSkeleton />
        </div>
        <div className="mb-6">
          <Top100StreakSkeleton />
        </div>
        <Top100MilestonesCarouselSkeleton />
        <div className="mt-6">
          <Top100RegionProgressSkeleton />
        </div>
        <div className="mt-6">
          <Top100ClosestBadgeSkeleton />
        </div>
        <div className="mt-6">
          <Top100RecentRoundsSkeleton />
        </div>
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

  // Filter to only friends who have played at least 1 Top 100 course
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

  // yearSummary and yearRegionsCount are now computed before early returns (lines ~108-122)

  // Build completed lists stats
  const statsByList: Partial<Record<Top100ListId, { playedCount: number; totalCount: number }>> = {};
  for (const list of data.lists) {
    const slug = list.listSlug as Top100ListId;
    if (slug) {
      statsByList[slug] = {
        playedCount: list.played,
        totalCount: list.total,
      };
    }
  }

  return (
    <div className="w-full max-w-full pb-8">
      {/* ============================================
          SECTION 1: PAGE HEADER & HERO CONTEXT
          ============================================ */}
      
      {/* 1.1 Hero: User Identity & Total Progress (A2, A3) */}
      <div className="pt-4 pb-6">
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

      {/* 1.2 Supporting Stats Row with icons (A4) - use year-scoped regions count */}
      <div className="mb-5">
        <Top100YearSummary summary={yearSummary} regionsCount={yearRegionsCount} />
      </div>

      {/* ============================================
          SECTION 1.5: PROGRESS TIMELINE & STREAK (H, I)
          ============================================ */}
      
      {/* H) Progress Timeline - year-scoped data */}
      <div className="mb-5">
        <Top100ProgressTimeline
          rounds={data.year_rounds ?? []}
          year={new Date().getFullYear()}
          onViewAll={() => navigate('/rounds?filter=top100')}
        />
      </div>

      {/* I) Logging Streak Module - uses all_rounds_for_streak (last 18 months) */}
      <div className="mb-5">
        <Top100LoggingStreak
          rounds={data.all_rounds_for_streak ?? data.recent_rounds}
          onLogRound={() => navigate('/courses?action=log')}
        />
      </div>

      {/* ============================================
          SECTION 2: ACHIEVEMENTS (CELEBRATION LAYER)
          ============================================ */}
      
      {/* 2.1 Milestone Achievements - Snap Carousel (C1, C2, C3) */}
      <div className="mb-4">
        <Top100MilestonesCarousel 
          totalPlayed={data.totalTop100Played} 
          onMilestoneClick={(milestone) => openMilestoneSheet(milestone.threshold)}
        />
      </div>

      {/* 2.2 Next achievement line - interactive (C4) */}
      {data?.next_milestone && (() => {
        const nextTierColor = TIER_COLORS[data.next_milestone.tierId] || TIER_COLORS.none;
        return (
          <div className="flex justify-center mb-4 mt-2">
              <button
              type="button"
              onClick={() => openMilestoneSheet(data.next_milestone!.threshold)}
              className="w-full max-w-sm bg-card border border-border/60 rounded-full py-2 px-4 flex flex-col gap-1.5 hover:bg-muted/50 active:scale-[0.98] transition-all"
            >
              {/* Tightened copy (item 6) */}
              <p className="text-xs sm:text-sm font-medium text-center text-foreground whitespace-nowrap">
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
            </button>
          </div>
        );
      })()}

      {/* ============================================
          SECTION 3: SOCIAL CONTEXT (SECONDARY)
          ============================================ */}
      
      {/* 3.1 Friends Chasing the Top 100 */}
      {isOwnProfile && topFriends.length > 0 && (
        <div className="mb-6 opacity-95">
          <Top100FriendsActivityCard
            friends={topFriends}
            friendMessage={friendMessage}
            onViewLeaderboard={() => navigate('/top100?tab=leaderboard&view=players')}
          />
        </div>
      )}

      {/* ============================================
          SECTION 4: JOURNEY BY REGION (D1-D4)
          ============================================ */}
      
      <div className="mb-6">
        <Top100RegionProgressGrid
          lists={data.lists}
          isOwnProfile={isOwnProfile}
          displayName={displayName}
        />
      </div>

      {/* ============================================
          SECTION 5: COMPLETIONS & CLOSEST BADGE (E1, E2)
          ============================================ */}
      
      {/* 5.1 Top 100 List Completions */}
      <div className="mb-4">
        <Top100ListCompletionsRow 
          lists={data.lists} 
          onCardClick={openRegionalSheet}
        />
      </div>

      {/* 5.2 Closest Badge - Merged module (E1) */}
      <div className="mb-4">
        <Top100ClosestBadgeCard 
          totalTop100Played={data.totalTop100Played} 
          onOpenDetail={(milestone) => openMilestoneSheet(milestone.threshold)}
        />
      </div>

      {/* ============================================
          SECTION 6: RECENT ACTIVITY (MEMORY LAYER)
          ============================================ */}
      
      {/* 6.1 Recent Top 100 Rounds - Swipe Carousel (F1-F3) - tighter spacing (item 10) */}
      <div className="-mx-4 sm:mx-0 mb-3">
        <Top100RecentRoundsCarousel
          rounds={data.recent_rounds}
          isOwnProfile={isOwnProfile}
          onAddRound={() => navigate('/courses?action=log')}
        />
      </div>

      {/* Unified Achievement Sheet - handles both milestone and regional */}
      <UnifiedAchievementSheet
        isOpen={isAchievementSheetOpen}
        onClose={closeAchievementSheet}
        data={achievementSheetData}
      />

      {/* Scroll to top FAB */}
      <ScrollToTopGlass />
    </div>
  );
};

export default Top100MyProgressPanel;

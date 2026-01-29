import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100ProgressForUser, type Top100RecentRound } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Top100ProgressHero } from '@/components/top100/Top100ProgressHero';
import { Top100MilestonesCarousel } from '@/components/courses/Top100MilestonesCarousel';
import { Top100YearSummary } from '@/components/top100/Top100YearSummary';
import { Top100RecentRoundsCarousel } from '@/components/top100/Top100RecentRoundsCarousel';
import { UnifiedAchievementSheet, type AchievementData } from '@/components/top100/UnifiedAchievementSheet';
import {
  Top100ProgressHeroSkeleton,
  Top100YearSummarySkeleton,
  Top100MilestonesCarouselSkeleton,
  Top100RecentRoundsSkeleton,
  Top100TimelineSkeleton,
  Top100StreakSkeleton,
} from '@/components/top100/Top100ProgressSkeletons';
import { MILESTONE_THEMES } from '@/lib/globalAchievementMilestoneSystem';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

import { useTop100FriendsSnapshot } from '@/hooks/useTop100FriendsSnapshot';
import Top100FriendsActivityCard from '@/components/top100/Top100FriendsActivityCard';
import { buildYearSummary } from '@/lib/top100ProgressSelectors';
import { Top100ProgressTimeline } from '@/components/top100/Top100ProgressTimeline';
import { Top100LoggingStreak } from '@/components/top100/Top100LoggingStreak';
import { MilestoneLadder } from '@/components/quest/MilestoneLadder';
import { type RegionProgress } from '@/components/quest/RegionalJourneySummary';

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

// Stable empty array constant - module level to avoid new reference each render
const EMPTY_ROUNDS: Top100RecentRound[] = [];

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

  // Scroll to top on mount (required behavior - always start at top)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);
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

  const yearRounds = data?.year_rounds ?? EMPTY_ROUNDS;

  // Derive year summary from year-scoped data (not recent_rounds)
  // MUST be called before any early returns to satisfy React hooks rules
  const yearSummary = useMemo(() => buildYearSummary(yearRounds), [yearRounds]);
  
  // Count regions active this year (for Year Summary)
  // MUST be called before any early returns to satisfy React hooks rules
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

  // Skeleton loading state (G2) - with smooth fade-in transition
  if (isLoading) {
    return (
      <div className="w-full max-w-full pb-8 animate-fade-in">
        <Top100ProgressHeroSkeleton />
        <Top100YearSummarySkeleton />
        <div className="px-4 mb-4">
          <Top100TimelineSkeleton />
        </div>
        <div className="px-4 mb-6">
          <Top100StreakSkeleton />
        </div>
        <Top100MilestonesCarouselSkeleton />
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

  // Map Top100ProgressForUser list data to RegionProgress format for Journey Map
  const regionProgress: RegionProgress[] = useMemo(() => {
    if (!data?.lists) return [];
    
    const slugToRegion: Record<string, { name: string; shortName: string }> = {
      'gb-i': { name: 'GB&I Top 100', shortName: 'GB&I' },
      'europe': { name: 'Europe Top 100', shortName: 'EUR' },
      'usa': { name: 'USA Top 100', shortName: 'USA' },
      'global': { name: 'Global Top 100', shortName: 'WLD' },
    };
    
    const orderedSlugs = ['gb-i', 'europe', 'usa', 'global'];
    
    return orderedSlugs
      .map(slug => {
        const list = data.lists.find(l => l.listSlug === slug);
        const region = slugToRegion[slug];
        if (!list || !region) return null;
        
        return {
          id: slug,
          name: region.name,
          shortName: region.shortName,
          played: list.played,
          total: list.total,
        };
      })
      .filter((r): r is RegionProgress => r !== null);
  }, [data?.lists]);

  return (
    <div className="w-full max-w-full pb-24 animate-fade-in">
      {/* ============================================
          SECTION A: HERO / IDENTITY - section band, no card
          Background: bg-slate-50, pt-8 pb-10
          ============================================ */}
      <section className="bg-slate-50 pt-8 pb-10">
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
        
        {/* B) Stats Row - KEEP as card, p-5, gap-6 - mt-6 from hero */}
        <div className="mt-6 px-4">
          <Top100YearSummary summary={yearSummary} regionsCount={yearRegionsCount} />
        </div>
      </section>

      {/* ============================================
          SECTION C: MOMENTUM (2026 Progress + Streak)
          Combined section - bg-white, px-4 py-6
          ============================================ */}
      <section className="bg-white px-4 py-6 border-t border-slate-200/60">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
          Momentum
        </h3>
        <div className="space-y-4">
          {/* H) Progress Timeline */}
          <Top100ProgressTimeline
            rounds={data.year_rounds ?? []}
            year={new Date().getFullYear()}
            onViewAll={() => navigate('/rounds?filter=top100')}
          />

          {/* I) Logging Streak */}
          <Top100LoggingStreak
            rounds={data.all_rounds_for_streak ?? data.recent_rounds}
            onLogRound={() => navigate('/courses?action=log')}
            isOwnProfile={isOwnProfile}
            firstName={displayName?.split(' ')[0]}
          />
        </div>
      </section>

      {/* ============================================
          SECTION D: ACHIEVEMENTS (CELEBRATION LAYER)
          Divider above, mt-10
          ============================================ */}
      <section className="mt-10 border-t border-slate-200/60 pt-6">
        {/* D.1 Milestone Achievements Carousel */}
        <div className="mb-5">
          <Top100MilestonesCarousel 
            totalPlayed={data.totalTop100Played} 
            onMilestoneClick={(milestone) => openMilestoneSheet(milestone.threshold)}
          />
        </div>

        {/* D.2 Next achievement line - interactive */}
        {data?.next_milestone && (() => {
          const nextTierColor = TIER_COLORS[data.next_milestone.tierId] || TIER_COLORS.none;
          return (
            <div className="flex justify-center mb-4 mt-5 px-4">
              <button
                type="button"
                onClick={() => openMilestoneSheet(data.next_milestone!.threshold)}
                className="w-full max-w-sm bg-white border border-slate-200/60 rounded-full py-2 px-4 flex flex-col gap-1.5 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                <p className="text-xs sm:text-sm font-medium text-center text-foreground whitespace-nowrap">
                  <span className="font-semibold">
                    {data.next_milestone.remaining} more to{' '}
                  </span>
                  <span className="font-semibold" style={{ color: nextTierColor }}>
                    {data.next_milestone.tierName}
                  </span>
                </p>
                {/* Micro progress bar */}
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${nextMilestoneProgress}%`, backgroundColor: nextTierColor }}
                  />
                </div>
              </button>
            </div>
          );
        })()}
      </section>

      {/* ============================================
          SECTION 3: SOCIAL CONTEXT (SECONDARY)
          ============================================ */}
      {isOwnProfile && topFriends.length > 0 && (
        <div className="mt-8 px-4 opacity-95">
          <Top100FriendsActivityCard
            friends={topFriends}
            friendMessage={friendMessage}
            onViewLeaderboard={() => navigate('/top100?tab=leaderboard&view=players')}
          />
        </div>
      )}

      {/* ============================================
          SECTION E: JOURNEY MAP (Quest-style)
          Badge ladder with regional mastery track
          ============================================ */}
      <section className="mt-10 px-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 mb-4">Journey Map</h2>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/60">
          <MilestoneLadder
            totalPlayed={data.totalTop100Played}
            onMilestoneClick={(milestone) => {
              if (milestone.type === 'list_completion' && milestone.regionSlug) {
                openRegionalSheet(
                  milestone.regionSlug,
                  milestone.played ?? 0,
                  milestone.total ?? 100
                );
              } else {
                openMilestoneSheet(milestone.threshold);
              }
            }}
            regionCompletions={regionProgress.map(r => ({
              slug: r.id as 'gb-i' | 'europe' | 'usa' | 'global',
              name: r.name,
              played: r.played,
              total: r.total,
            }))}
          />
        </div>
      </section>

      {/* ============================================
          SECTION H: RECENT TOP 100 ROUNDS
          Divider above, pt-8
          ============================================ */}
      <section className="border-t border-slate-200/60 pt-8 -mx-4 sm:mx-0">
        <Top100RecentRoundsCarousel
          rounds={data.recent_rounds}
          isOwnProfile={isOwnProfile}
          onAddRound={() => navigate('/courses?action=log')}
        />
      </section>

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

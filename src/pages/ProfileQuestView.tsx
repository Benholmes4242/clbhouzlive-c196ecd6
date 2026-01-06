/**
 * ProfileQuestView - Unified Quest Page (Phase 3: Cinematic Mode)
 * 
 * Trophy Room aesthetic with:
 * 1. Trophy Room Hero (animated, tier chip, Continue Journey CTA)
 * 2. Trophy Case (2-row grid with Milestones/Regions toggle)
 * 3. Next target (forward momentum)
 * 4. Journey Map = Milestone ladder (5→400 Club) + Mastery Track chapter
 * 5. Journey Summary = Regional list progress (GB&I / Europe / USA / Worldwide)
 * 6. Recently Added (grounded in real activity)
 * 7. Badge Detail Sheet (tap any badge for cinematic detail)
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import '@/styles/quest-theme.css';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuestCourses } from '@/hooks/useQuestCourses';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useQuestRewards } from '@/hooks/useQuestRewards';
import { useQuestOnboarding } from '@/hooks/useQuestOnboarding';
import { RegionListSheet } from '@/components/profile-v2/RegionListSheet';
import { MilestoneUnlockSheet } from '@/components/profile-v2/MilestoneUnlockSheet';
import { QuestIntroOverlay } from '@/components/profile-v2/QuestIntroOverlay';
import { QuestFirstCourseSheet } from '@/components/profile-v2/QuestFirstCourseSheet';

// Phase 3 Cinematic components
import { TrophyRoomHero } from '@/components/quest/TrophyRoomHero';
import { TrophyCase } from '@/components/quest/TrophyCase';
import { UnifiedAchievementSheet, type AchievementData } from '@/components/top100/UnifiedAchievementSheet';

// Existing Quest components
import { NextTargetCard } from '@/components/profile-v2/NextTargetCard';
import { MilestoneLadder } from '@/components/quest/MilestoneLadder';
import { RegionalJourneySummary, RegionProgress } from '@/components/quest/RegionalJourneySummary';
import { RecentlyAddedSection } from '@/components/quest/RecentlyAddedSection';
import { MomentumCard } from '@/components/quest/MomentumCard';
import { LeaderboardCard } from '@/components/quest/LeaderboardCard';
import { CLUB_STEPS } from '@/lib/top100Club';

// Milestone club type for sheet
interface MilestoneClub {
  id: string;
  name: string;
  threshold: number;
  description: string;
  isUnlocked: boolean;
  remaining?: number;
}

const ProfileQuestView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { recentlyPlayed, isLoading: questLoading } = useQuestCourses();
  
  // Ref for scrolling to journey map
  const journeyMapRef = useRef<HTMLDivElement>(null);
  
  // Use the SAME hook as Top 100 list page for ALL progress data (single source of truth)
  const { data: progressData, isLoading: progressLoading } = useTop100ProgressForUser(user?.id);
  const isLoading = questLoading || progressLoading;
  
  const totalPlayed = progressData?.totalTop100Played ?? 0;
  
  // Map Top100ProgressForUser list data to RegionProgress format for Journey Summary
  const regionProgress: RegionProgress[] = useMemo(() => {
    if (!progressData?.lists) return [];
    
    const slugToRegion: Record<string, { name: string; shortName: string }> = {
      'gb-i': { name: 'GB & Ireland', shortName: 'GB&I' },
      'europe': { name: 'Continental Europe', shortName: 'EUR' },
      'usa': { name: 'USA', shortName: 'USA' },
      'global': { name: 'Worldwide', shortName: 'WLD' },
    };
    
    // Order: GB&I, Europe, USA, Worldwide
    const orderedSlugs = ['gb-i', 'europe', 'usa', 'global'];
    
    return orderedSlugs
      .map(slug => {
        const list = progressData.lists.find(l => l.listSlug === slug);
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
  }, [progressData?.lists]);

  const [selectedRegion, setSelectedRegion] = useState<RegionProgress | null>(null);
  
  // Badge detail sheet state - now uses UnifiedAchievementSheet format
  const [achievementData, setAchievementData] = useState<AchievementData | null>(null);

  // Get quest rewards for profile evolution
  const rewards = useQuestRewards(totalPlayed, 0);

  // Quest onboarding state
  const onboarding = useQuestOnboarding(totalPlayed);
  const [showJourneyHint, setShowJourneyHint] = useState(false);

  // Show journey hint after intro is dismissed
  useEffect(() => {
    if (onboarding.introSeen && onboarding.shouldShowJourneyHint) {
      const timer = setTimeout(() => setShowJourneyHint(true), 800);
      return () => clearTimeout(timer);
    }
  }, [onboarding.introSeen, onboarding.shouldShowJourneyHint]);

  // Auto-fade journey hint
  useEffect(() => {
    if (showJourneyHint) {
      const timer = setTimeout(() => {
        setShowJourneyHint(false);
        onboarding.markJourneyHintSeen();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showJourneyHint, onboarding]);

  // Build milestone clubs for sheet display
  const milestoneClubs: MilestoneClub[] = useMemo(() => {
    return CLUB_STEPS.map((step) => ({
      id: `${step.threshold}-club`,
      name: `${step.threshold} Club`,
      threshold: step.threshold,
      description: `Play ${step.threshold} Top 100 courses`,
      isUnlocked: totalPlayed >= step.threshold,
      remaining: totalPlayed < step.threshold ? step.threshold - totalPlayed : undefined,
    }));
  }, [totalPlayed]);

  // Next milestone for target card
  const nextMilestone = milestoneClubs.find((c) => !c.isUnlocked);

  // Suggested region (lowest completion)
  const suggestedRegion = useMemo(() => {
    const inProgress = regionProgress.filter((c) => c.played < c.total);
    if (inProgress.length === 0) return undefined;
    const lowest = inProgress.reduce((prev, curr) =>
      (curr.played / curr.total) < (prev.played / prev.total) ? curr : prev
    );
    return lowest.name;
  }, [regionProgress]);

  // Transform recently played for component (up to 10, sorted by date descending)
  const recentCourses = recentlyPlayed
    .slice(0, 10)
    .map(course => ({
      id: course.id,
      name: course.name,
      region: course.region,
      dateAdded: course.dateAdded,
    }));

  // Handle milestone click from ladder (includes both milestones and regional from Mastery Track)
  const handleMilestoneClick = (milestone: { threshold: number; name: string; isUnlocked: boolean; type?: string; regionSlug?: string; played?: number; total?: number }) => {
    // Check if this is a regional achievement from Mastery Track
    if (milestone.type === 'list_completion' && milestone.regionSlug) {
      setAchievementData({
        type: 'regional',
        listSlug: milestone.regionSlug as 'gb-i' | 'europe' | 'usa' | 'global',
        played: milestone.played ?? 0,
        total: milestone.total ?? 100,
      });
    } else {
      // Regular milestone
      setAchievementData({
        type: 'milestone',
        threshold: milestone.threshold,
        totalPlayed,
      });
    }
  };

  // Handle badge click from trophy case
  const handleBadgeClick = (badge: { type: 'milestone' | 'region'; id: string; threshold?: number }) => {
    if (badge.type === 'milestone' && badge.threshold) {
      setAchievementData({
        type: 'milestone',
        threshold: badge.threshold,
        totalPlayed,
      });
    } else if (badge.type === 'region') {
      const region = regionProgress.find(r => r.id === badge.id);
      if (region) {
        setAchievementData({
          type: 'regional',
          listSlug: badge.id as 'gb-i' | 'europe' | 'usa' | 'global',
          played: region.played,
          total: region.total,
        });
      }
    }
  };

  // Continue Journey scroll handler
  const handleContinueJourney = () => {
    journeyMapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-slate-50">
      {/* Header - Back CTA top left, centered title + subtitle */}
      <div className="relative safe-top px-4 pt-4">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 transition-all hover:opacity-70 hover:-translate-x-0.5 mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back</span>
        </button>

        {/* Centered title + subtitle with premium typography */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold tracking-tight mb-1.5 text-slate-900" style={{ letterSpacing: '-0.02em' }}>
            Top 100 Journey
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Your journey across the world's greatest courses
          </p>
        </div>
      </div>

      {/* Content with consistent vertical rhythm */}
      <div className="relative pb-32">
        {/* Section 1: Trophy Room Hero - NO CARD, section band */}
        <div className="px-4 py-6">
          <TrophyRoomHero
            totalPlayed={totalPlayed}
            target={100}
            hasPremiumAccent={rewards.hasPremiumAccent}
            onContinueJourney={handleContinueJourney}
            regionProgress={regionProgress}
          />
        </div>

        {/* Section 2: Trophy Case - NO CARD, section band with divider */}
        <div className="border-t border-slate-200/60 px-4 py-5">
          <TrophyCase
            totalPlayed={totalPlayed}
            regionProgress={regionProgress}
            onBadgeClick={handleBadgeClick}
          />
        </div>

        {/* Section 3: Next Target Card - KEEP CARD */}
        <div className="px-4 py-5 border-t border-slate-200/60">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 px-1">Next Target</h2>
          <NextTargetCard
            totalPlayed={totalPlayed}
            nextMilestone={nextMilestone ? { name: nextMilestone.name, threshold: nextMilestone.threshold } : undefined}
            suggestedRegion={suggestedRegion}
            suggestedFocus={nextMilestone?.name}
            onShare={() => {/* Share placeholder */}}
            showHint={onboarding.shouldShowTargetHint}
            onHintDismiss={onboarding.markTargetHintSeen}
          />
        </div>

        {/* Section 4: Journey Map - KEEP CARD */}
        <div className="px-4 py-5 border-t border-slate-200/60" ref={journeyMapRef}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 px-1">Journey Map</h2>
          {showJourneyHint && (
            <p className="text-xs px-1 mb-2 text-slate-400 transition-opacity duration-500">
              Your journey unfolds here
            </p>
          )}
          <MilestoneLadder
            totalPlayed={totalPlayed}
            onMilestoneClick={handleMilestoneClick}
            regionCompletions={regionProgress.map(r => ({
              slug: r.id as 'gb-i' | 'europe' | 'usa' | 'global',
              name: r.name,
              played: r.played,
              total: r.total,
            }))}
          />
        </div>

        {/* Section 5: Regional Progress - NO CARD, section band */}
        <div className="px-4 py-5 border-t border-slate-200/60">
          <RegionalJourneySummary regions={regionProgress} />
        </div>

        {/* Section 6: Momentum - NO CARD, section band */}
        <div className="px-4 py-5 border-t border-slate-200/60">
          <MomentumCard recentlyPlayed={recentCourses} />
        </div>

        {/* Section 7: Leaderboard - KEEP CARD */}
        <div className="px-4 py-5 border-t border-slate-200/60">
          <LeaderboardCard userId={user?.id} />
        </div>

        {/* Section 8: Recently Added - NO CARD, section band */}
        <div className="px-4 py-5 border-t border-slate-200/60">
          <RecentlyAddedSection
            courses={recentCourses}
            hasGoldTrim={rewards.hasGoldTrim}
          />
        </div>
      </div>

      {/* Region List Sheet */}
      <RegionListSheet
        region={selectedRegion ? {
          id: selectedRegion.id,
          name: selectedRegion.name,
          shortName: selectedRegion.shortName,
          played: selectedRegion.played,
          total: selectedRegion.total,
        } : null}
        onClose={() => setSelectedRegion(null)}
      />

      <UnifiedAchievementSheet
        isOpen={!!achievementData}
        onClose={() => setAchievementData(null)}
        data={achievementData}
      />

      {/* Milestone Unlock Sheet */}
      <MilestoneUnlockSheet totalPlayed={totalPlayed} />

      {/* Quest Intro Overlay */}
      {onboarding.shouldShowIntro && (
        <QuestIntroOverlay
          onBegin={onboarding.markIntroSeen}
          onSkip={onboarding.markIntroSeen}
        />
      )}

      {/* First Course Celebration Sheet */}
      <QuestFirstCourseSheet
        open={onboarding.shouldShowFirstCourse}
        onClose={onboarding.markFirstCourseSeen}
      />
    </PageRoot>
  );
};

export default ProfileQuestView;

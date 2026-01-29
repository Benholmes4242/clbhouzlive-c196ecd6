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

import '@/styles/quest-theme.css';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuestCourses } from '@/hooks/useQuestCourses';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useQuestRewards } from '@/hooks/useQuestRewards';
import { useQuestOnboarding } from '@/hooks/useQuestOnboarding';
import { RegionListSheet } from '@/components/profile-v2/RegionListSheet';
import { MilestoneUnlockSheet } from '@/components/profile-v2/MilestoneUnlockSheet';

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
import { QuestPageSkeleton } from '@/components/quest/QuestPageSkeleton';
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

interface ProfileQuestViewProps {
  /** User ID of the profile being viewed (defaults to current user) */
  profileUserId?: string;
  /** First name of the profile user (for contextual taglines) */
  profileFirstName?: string;
  /** Whether viewing own profile (defaults to true) */
  isOwnProfile?: boolean;
}

const ProfileQuestView: React.FC<ProfileQuestViewProps> = ({
  profileUserId,
  profileFirstName,
  isOwnProfile = true,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { recentlyPlayed, isLoading: questLoading } = useQuestCourses();
  
  // Determine target user: use profileUserId if provided, otherwise fall back to current user
  const targetUserId = profileUserId || user?.id;
  
  // Ref for scrolling to journey map
  const journeyMapRef = useRef<HTMLDivElement>(null);
  
  // Scroll to top on mount - immediate, no animation
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);
  
  // Use the SAME hook as Top 100 list page for ALL progress data (single source of truth)
  const { data: progressData, isLoading: progressLoading } = useTop100ProgressForUser(targetUserId);
  const isLoading = questLoading || progressLoading;
  
  const totalPlayed = progressData?.totalTop100Played ?? 0;
  
  // Map Top100ProgressForUser list data to RegionProgress format for Journey Summary
  const regionProgress: RegionProgress[] = useMemo(() => {
    if (!progressData?.lists) return [];
    
    const slugToRegion: Record<string, { name: string; shortName: string }> = {
      'gb-i': { name: 'GB&I Top 100', shortName: 'GB&I' },
      'europe': { name: 'Europe Top 100', shortName: 'EUR' },
      'usa': { name: 'USA Top 100', shortName: 'USA' },
      'global': { name: 'Global Top 100', shortName: 'WLD' },
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
    return <QuestPageSkeleton />;
  }

  return (
    <PageRoot className="min-h-screen bg-[#F8FAFC]">
      {/* Content - reduced section spacing (16px gaps instead of 24px) */}
      <div className="relative pb-8 pt-4">
        {/* Section 1: Trophy Room Hero */}
        <section className="px-4 pt-4 mb-6">
          <TrophyRoomHero
            totalPlayed={totalPlayed}
            target={100}
            hasPremiumAccent={rewards.hasPremiumAccent}
            onContinueJourney={handleContinueJourney}
            regionProgress={regionProgress}
          />
        </section>

        {/* Section 2: Trophy Case */}
        <section className="px-4 mb-6">
          <TrophyCase
            totalPlayed={totalPlayed}
            regionProgress={regionProgress}
            onBadgeClick={handleBadgeClick}
          />
        </section>

        {/* Section 3: Next Target */}
        <section className="px-4 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Next Target</h2>
          <div className="bg-white rounded-2xl p-3 border border-slate-200/60">
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
        </section>

        {/* Section 4: Journey Map */}
        <section className="px-4 mb-8" ref={journeyMapRef}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Journey Map</h2>
          {showJourneyHint && (
            <p className="text-xs mb-2 text-slate-400 transition-opacity duration-500">
              Your journey unfolds here
            </p>
          )}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/60">
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
        </section>

        {/* Section 5: Regional Progress */}
        <section className="px-4 mb-8">
          <RegionalJourneySummary regions={regionProgress} />
        </section>

        {/* Section 6: Momentum */}
        <section className="px-4 mb-8">
          <MomentumCard recentlyPlayed={recentCourses} />
        </section>

        {/* Section 7: Leaderboard */}
        <section className="px-4 mb-8">
          <LeaderboardCard userId={targetUserId} />
        </section>

        {/* Section 8: Recently Added */}
        <section className="px-4 pb-8">
          <RecentlyAddedSection
            courses={recentCourses}
            hasGoldTrim={rewards.hasGoldTrim}
          />
        </section>
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
        firstName={profileFirstName}
        isOwnProfile={isOwnProfile}
      />

      {/* Milestone Unlock Sheet */}
      <MilestoneUnlockSheet totalPlayed={totalPlayed} />


      {/* First Course Celebration Sheet */}
      <QuestFirstCourseSheet
        open={onboarding.shouldShowFirstCourse}
        onClose={onboarding.markFirstCourseSeen}
      />
    </PageRoot>
  );
};

export default ProfileQuestView;

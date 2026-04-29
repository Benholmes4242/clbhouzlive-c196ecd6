/**
 * ProfileQuestView - Unified Quest Page (Phase 3: Cinematic Mode)
 * 
 * Trophy Room aesthetic with:
 * 1. Trophy Room Hero (animated, tier chip, Continue Journey CTA)
 * 2. Trophy Case (2-row grid with Milestones/Regions toggle)
 * 3. Journey Map = Milestone ladder (5→400 Club) + Mastery Track chapter
 * 4. Journey Summary = Regional list progress (GB&I / Europe / USA / Worldwide)
 * 5. Recently Added (grounded in real activity)
 * 6. Badge Detail Sheet (tap any badge for cinematic detail)
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import '@/styles/quest-theme.css';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useQuestCourses } from '@/hooks/useQuestCourses';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useQuestRewards } from '@/hooks/useQuestRewards';
import { useQuestOnboarding } from '@/hooks/useQuestOnboarding';

import { QuestFirstCourseSheet } from '@/components/profile-v2/QuestFirstCourseSheet';

// Phase 3 Cinematic components
import { TrophyRoomHero } from '@/components/quest/TrophyRoomHero';
import { TrophyCase } from '@/components/quest/TrophyCase';
import { UnifiedAchievementSheet, type AchievementData } from '@/components/top100/UnifiedAchievementSheet';

// Existing Quest components
import { MilestoneLadder } from '@/components/quest/MilestoneLadder';
import { type RegionProgress } from '@/components/quest/RegionalJourneySummary';
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
  /** Full display name (for header when viewing another user) */
  profileDisplayName?: string;
  /** Whether viewing own profile (defaults to true) */
  isOwnProfile?: boolean;
}

const ProfileQuestView: React.FC<ProfileQuestViewProps> = ({
  profileUserId,
  profileFirstName,
  profileDisplayName,
  isOwnProfile = true,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  useHideHeader();
  useHideBottomNav();
  const { recentlyPlayed, isLoading: questLoading } = useQuestCourses();
  
  // Determine target user: use profileUserId if provided, otherwise fall back to current user
  const targetUserId = profileUserId || user?.id;
  
  // Ref for scrolling to journey map
  const journeyMapRef = useRef<HTMLDivElement>(null);
  
  // Scroll to top on mount - immediate, no animation
  useEffect(() => {
    const shell = document.querySelector('.app-shell');
    if (shell) {
      shell.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
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

  // Badge detail sheet state - tap-to-explore (browse / peer mode)
  const [achievementData, setAchievementData] = useState<AchievementData | null>(null);

  // Celebrate-mode state — own profile only, auto-fires on first unlock
  const [celebrateData, setCelebrateData] = useState<AchievementData | null>(null);

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
    <PageRoot className="min-h-screen bg-background">
      {/* Always-on header with back button + centered title */}
      <header
        className="sticky top-0 z-50 flex items-center gap-3 px-4 min-h-14 backdrop-blur-lg"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: 'rgba(248,250,252,0.95)',
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(15,23,42,0.05)',
            border: '0.5px solid rgba(15,23,42,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 flex flex-col items-center min-w-0">
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: '#F7931E',
              letterSpacing: '0.16em',
              textTransform: 'uppercase' as const,
            }}
          >
            Trophy Case
          </span>
          <h1 className="text-[15px] font-semibold text-foreground truncate max-w-full">
            {isOwnProfile
              ? 'Your Journey'
              : profileDisplayName
              ? `${profileDisplayName}\u2019s Journey`
              : 'Journey'}
          </h1>
        </div>
        <div style={{ width: 36, height: 36, flexShrink: 0 }} />
      </header>
      {/* Content - generous spacing (24-32px gaps) for Apple-level polish */}
      <div className="relative pb-10 pt-4">
        {/* Section 1: Trophy Room Hero */}
        <section className="px-4 pt-4 mb-8">
          <TrophyRoomHero
            totalPlayed={totalPlayed}
            hasPremiumAccent={rewards.hasPremiumAccent}
            onContinueJourney={handleContinueJourney}
            regionProgress={regionProgress}
            isOwnProfile={isOwnProfile}
          />
        </section>

        {/* Section 2: Trophy Case */}
        <section className="px-4 mb-8">
          <TrophyCase
            totalPlayed={totalPlayed}
            regionProgress={regionProgress}
            onBadgeClick={handleBadgeClick}
          />
        </section>


        {/* Section 4: Journey Map - directly on page background */}
        <section className="px-4 mb-10" ref={journeyMapRef}>
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Journey Map · Top 100 courses</span>
            </div>
            <h2 className="text-[17px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>Milestone Ladder</h2>
          </div>
          {showJourneyHint && (
            <p className="text-sm mb-3 text-muted-foreground/60 transition-opacity duration-500">
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
        </section>

        {/* Section 6: Momentum — own profile only */}
        {isOwnProfile && (
          <section className="px-4 mb-10">
            <MomentumCard recentlyPlayed={recentCourses} suggestedRegion={suggestedRegion} />
          </section>
        )}

        {/* Section 7: Friends Leaderboard — own profile only */}
        {isOwnProfile && (
          <section className="px-4 mb-10">
            <div className="rounded-2xl p-4" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
              <LeaderboardCard userId={targetUserId} totalPlayed={totalPlayed} />
            </div>
          </section>
        )}

        {/* Section 8: Recently Added — own profile only */}
        {isOwnProfile && (
          <section className="px-4 pb-10">
            <RecentlyAddedSection
              courses={recentCourses}
              hasGoldTrim={rewards.hasGoldTrim}
            />
          </section>
        )}
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
      <MilestoneUnlockSheet totalPlayed={totalPlayed} isOwnProfile={isOwnProfile} firstName={profileFirstName} />


      {/* First Course Celebration Sheet */}
      <QuestFirstCourseSheet
        open={onboarding.shouldShowFirstCourse}
        onClose={onboarding.markFirstCourseSeen}
      />
    </PageRoot>
  );
};

export default ProfileQuestView;

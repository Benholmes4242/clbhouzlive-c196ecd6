/**
 * ProfileQuestView - Unified Quest Page
 * 
 * Single page with clean narrative:
 * 1. Overall progress (Top 100 courses played)
 * 2. Milestones earned (quick recognition)
 * 3. Next target (forward momentum)
 * 4. Journey Map = Milestone ladder only (5→400 Club)
 * 5. Journey Summary = Regional list progress (GB&I / Europe / USA / Worldwide)
 * 6. Recently Added (grounded in real activity)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';

import '@/styles/quest-theme.css';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuestCourses } from '@/hooks/useQuestCourses';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useQuestRewards } from '@/hooks/useQuestRewards';
import { useQuestOnboarding } from '@/hooks/useQuestOnboarding';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { RegionListSheet } from '@/components/profile-v2/RegionListSheet';
import { MilestoneUnlockSheet } from '@/components/profile-v2/MilestoneUnlockSheet';
import { QuestIntroOverlay } from '@/components/profile-v2/QuestIntroOverlay';
import { QuestFirstCourseSheet } from '@/components/profile-v2/QuestFirstCourseSheet';

// New modular Quest components
import { QuestHero } from '@/components/quest/QuestHero';
import { MilestonesEarnedRow } from '@/components/quest/MilestonesEarnedRow';
import { NextTargetCard } from '@/components/profile-v2/NextTargetCard';
import { MilestoneLadder } from '@/components/quest/MilestoneLadder';
import { RegionalJourneySummary, RegionProgress } from '@/components/quest/RegionalJourneySummary';
import { RecentlyAddedSection } from '@/components/quest/RecentlyAddedSection';
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
  const [selectedClub, setSelectedClub] = useState<MilestoneClub | null>(null);

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

  // Transform recently played for component
  const recentCourses = recentlyPlayed.map(course => ({
    id: course.id,
    name: course.name,
    region: course.region,
    dateAdded: course.dateAdded,
  }));

  // Handle milestone click
  const handleMilestoneClick = (milestone: { threshold: number; name: string; isUnlocked: boolean }) => {
    const club = milestoneClubs.find((c) => c.threshold === milestone.threshold);
    if (club) setSelectedClub(club);
  };

  // Handle region click
  const handleRegionClick = (region: RegionProgress) => {
    setSelectedRegion(region);
  };

  if (isLoading) {
    return (
      <PageRoot className="quest-theme-light min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--quest-accent-gold)', borderTopColor: 'transparent' }}
          />
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="quest-theme-light min-h-screen">
      {/* Premium background with depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: rewards.hasBackgroundTexture
            ? 'radial-gradient(ellipse at 50% 0%, rgba(210, 180, 97, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(110, 146, 119, 0.06) 0%, transparent 40%)'
            : 'radial-gradient(ellipse at 50% 0%, rgba(31, 36, 40, 0.02) 0%, transparent 50%)',
        }}
      />

      {/* Header - Back CTA top left, centered title + subtitle */}
      <div className="relative safe-top px-4 pt-4">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm transition-all hover:opacity-70 hover:-translate-x-0.5 mb-5"
          style={{ color: 'var(--quest-text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back</span>
        </button>

        {/* Centered title + subtitle with premium typography */}
        <div className="text-center mb-4">
          <h1
            className="text-3xl font-bold tracking-tight mb-1.5"
            style={{ 
              color: 'var(--quest-text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            The Quest
          </h1>
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--quest-text-tertiary)' }}
          >
            Your journey across the world's greatest courses
          </p>
        </div>
      </div>

      {/* Content with premium spacing */}
      <div className="relative px-4 pb-32 space-y-10">
        {/* Section 1: Hero - Overall Progress */}
        <QuestHero
          totalPlayed={totalPlayed}
          target={100}
          hasPremiumAccent={rewards.hasPremiumAccent}
        />

        {/* Section 2: Milestones Earned Row */}
        <section>
          <h2 className="quest-section-title mb-3 px-1">Milestones Earned</h2>
          <MilestonesEarnedRow totalPlayed={totalPlayed} />
        </section>

        {/* Section Divider */}
        <div className="quest-section-divider" />

        {/* Section 3: Next Target Card */}
        <section>
          <h2 className="quest-section-title mb-3 px-1">Next Target</h2>
          <NextTargetCard
            totalPlayed={totalPlayed}
            nextMilestone={nextMilestone ? { name: nextMilestone.name, threshold: nextMilestone.threshold } : undefined}
            suggestedRegion={suggestedRegion}
            suggestedFocus={nextMilestone?.name}
            onShare={() => {/* Share placeholder */}}
            showHint={onboarding.shouldShowTargetHint}
            onHintDismiss={onboarding.markTargetHintSeen}
          />
        </section>

        {/* Section Divider */}
        <div className="quest-section-divider" />

        {/* Section 4: Journey Map (Milestone Ladder with Mastery Track) */}
        <section>
          <h2 className="quest-section-title mb-3 px-1">Journey Map</h2>
          {showJourneyHint && (
            <p
              className="text-xs px-1 mb-2 transition-opacity duration-500"
              style={{ color: 'var(--quest-text-tertiary)' }}
            >
              Your journey unfolds here
            </p>
          )}
          <MilestoneLadder
            totalPlayed={totalPlayed}
            onMilestoneClick={handleMilestoneClick}
          />
        </section>

        {/* Section Divider */}
        <div className="quest-section-divider" />

        {/* Section 5: Journey Summary (Regional Lists) */}
        <RegionalJourneySummary
          regions={regionProgress}
          onRegionClick={handleRegionClick}
        />

        {/* Section 6: Recently Added */}
        <RecentlyAddedSection
          courses={recentCourses}
          hasGoldTrim={rewards.hasGoldTrim}
        />
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

      {/* Milestone Club Sheet - Light theme */}
      <Sheet open={!!selectedClub} onOpenChange={() => setSelectedClub(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t"
          style={{
            background: 'var(--quest-card)',
            borderColor: 'var(--quest-stroke)',
          }}
        >
          {selectedClub && (
            <>
              <SheetHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: selectedClub.isUnlocked 
                        ? 'rgba(210, 180, 97, 0.12)' 
                        : 'var(--quest-pill-inactive)',
                      border: selectedClub.isUnlocked 
                        ? '1px solid rgba(210, 180, 97, 0.3)' 
                        : '1px solid var(--quest-stroke)',
                      boxShadow: selectedClub.isUnlocked ? '0 0 20px rgba(210, 180, 97, 0.2)' : 'var(--quest-shadow-sm)',
                    }}
                  >
                    <Trophy
                      className="w-6 h-6"
                      style={{ color: selectedClub.isUnlocked ? 'var(--quest-accent-gold)' : 'var(--quest-text-tertiary)' }}
                    />
                  </div>
                </div>
                <SheetTitle style={{ color: 'var(--quest-text-primary)' }}>
                  {selectedClub.name}
                </SheetTitle>
              </SheetHeader>
              <div className="text-center space-y-4 pb-8">
                <p style={{ color: 'var(--quest-text-secondary)' }}>
                  {selectedClub.description}
                </p>
                
                {/* Progress */}
                <div className="px-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: 'var(--quest-text-tertiary)' }}>
                      Progress
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--quest-text-primary)' }}>
                      {totalPlayed} / {selectedClub.threshold}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--quest-track)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((totalPlayed / selectedClub.threshold) * 100, 100)}%`,
                        background: 'var(--quest-accent-gold)',
                      }}
                    />
                  </div>
                </div>

                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                  style={{
                    background: selectedClub.isUnlocked
                      ? 'rgba(210, 180, 97, 0.18)'
                      : 'var(--quest-chip-bg)',
                    border: selectedClub.isUnlocked
                      ? '1px solid rgba(210, 180, 97, 0.35)'
                      : '1px solid var(--quest-chip-stroke)',
                    color: selectedClub.isUnlocked
                      ? 'var(--quest-accent-gold)'
                      : 'var(--quest-text-secondary)',
                  }}
                >
                  {selectedClub.isUnlocked ? '✓ Unlocked' : `${selectedClub.remaining} more to unlock`}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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

/**
 * ProfileQuestView - Quest Page v2
 * 
 * Story × Passport × Mission
 * 
 * Structure:
 * 1. Narrative Hero (Story)
 * 2. Current Quest Focus (Mission)
 * 3. Journey Map (Progression Spine)
 * 4. Your Golf Passport (Regional Progress)
 * 5. Recent Memories (Journal)
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
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

// New Quest v2 components
import { NarrativeHero } from '@/components/quest/NarrativeHero';
import { CurrentFocusCard } from '@/components/quest/CurrentFocusCard';
import { MilestoneLadder } from '@/components/quest/MilestoneLadder';
import { GolfPassport, RegionProgress } from '@/components/quest/GolfPassport';
import { RecentMemories } from '@/components/quest/RecentMemories';
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
  const journeyMapRef = useRef<HTMLDivElement>(null);
  
  // Use the SAME hook as Top 100 list page for ALL progress data (single source of truth)
  const { data: progressData, isLoading: progressLoading } = useTop100ProgressForUser(user?.id);
  const isLoading = questLoading || progressLoading;
  
  // Use totalTop100Played from the single source of truth
  const totalPlayed = progressData?.totalTop100Played ?? 0;
  
  // Map Top100ProgressForUser list data to RegionProgress format
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

  // Handle Current Focus card click - scroll to Journey Map
  const handleFocusCardClick = () => {
    journeyMapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      {/* Background texture for unlocked rewards */}
      {rewards.hasBackgroundTexture && (
        <div
          className="fixed inset-0 pointer-events-none opacity-10"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(110, 146, 119, 0.15) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Back navigation */}
      <div className="safe-top px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm transition-colors hover:opacity-70 quest-animate-fade-up"
          style={{ color: 'var(--quest-text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-32 space-y-10">
        {/* Section 1: Narrative Hero */}
        <NarrativeHero
          totalPlayed={totalPlayed}
          target={100}
        />

        {/* Section 2: Current Quest Focus */}
        <CurrentFocusCard
          totalPlayed={totalPlayed}
          suggestedRegion={suggestedRegion}
          onCardClick={handleFocusCardClick}
        />

        {/* Section 3: Journey Map */}
        <div ref={journeyMapRef}>
          <MilestoneLadder
            totalPlayed={totalPlayed}
            onMilestoneClick={handleMilestoneClick}
          />
        </div>

        {/* Section 4: Your Golf Passport */}
        <GolfPassport
          regions={regionProgress}
          onRegionClick={handleRegionClick}
        />

        {/* Section 5: Recent Memories */}
        <RecentMemories
          courses={recentCourses}
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

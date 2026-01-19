/**
 * ProfileQuestView - Quest Page UI Rebuild
 * 
 * Premium consumer app aesthetic with:
 * 1. Compact Header with subtle divider
 * 2. Unified Progress Strip (badge + count + ring)
 * 3. Horizontal Trophy Strip (swipe rail)
 * 4. Compact Active Target (hero CTA)
 * 5. Compact Milestone Timeline (dense stepper)
 * 6. 2x2 Regional Grid
 * 7. Merged Stats Card (Momentum + Leaderboard)
 * 8. Dense Recently Added feed
 * 
 * 40% vertical spacing reduction throughout
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

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
import { UnifiedAchievementSheet, type AchievementData } from '@/components/top100/UnifiedAchievementSheet';
import { QuestPageSkeleton } from '@/components/quest/QuestPageSkeleton';
import { CLUB_STEPS } from '@/lib/top100Club';

// New compact components
import { CompactProgressHero } from '@/components/quest/CompactProgressHero';
import { HorizontalTrophyStrip } from '@/components/quest/HorizontalTrophyStrip';
import { CompactActiveTarget } from '@/components/quest/CompactActiveTarget';
import { CompactMilestoneTimeline } from '@/components/quest/CompactMilestoneTimeline';
import { CompactRegionalGrid } from '@/components/quest/CompactRegionalGrid';
import { MergedStatsCard } from '@/components/quest/MergedStatsCard';
import { CompactRecentActivity } from '@/components/quest/CompactRecentActivity';

// Types
interface RegionProgress {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

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
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);
  
  // Use the SAME hook as Top 100 list page for ALL progress data
  const { data: progressData, isLoading: progressLoading } = useTop100ProgressForUser(user?.id);
  const isLoading = questLoading || progressLoading;
  
  const totalPlayed = progressData?.totalTop100Played ?? 0;
  
  // Map data to RegionProgress format
  const regionProgress: RegionProgress[] = useMemo(() => {
    if (!progressData?.lists) return [];
    
    const slugToRegion: Record<string, { name: string; shortName: string }> = {
      'gb-i': { name: 'GB & Ireland', shortName: 'GB&I' },
      'europe': { name: 'Continental Europe', shortName: 'EUR' },
      'usa': { name: 'USA', shortName: 'USA' },
      'global': { name: 'Worldwide', shortName: 'WLD' },
    };
    
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
  const [achievementData, setAchievementData] = useState<AchievementData | null>(null);

  // Get quest rewards
  const rewards = useQuestRewards(totalPlayed, 0);

  // Quest onboarding state
  const onboarding = useQuestOnboarding(totalPlayed);

  // Build milestone clubs
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

  // Transform recently played
  const recentCourses = recentlyPlayed
    .slice(0, 10)
    .map(course => ({
      id: course.id,
      name: course.name,
      region: course.region,
      dateAdded: course.dateAdded,
    }));

  // Handle milestone click from timeline
  const handleMilestoneClick = (milestone: { threshold: number; name: string; isUnlocked: boolean }) => {
    setAchievementData({
      type: 'milestone',
      threshold: milestone.threshold,
      totalPlayed,
    });
  };

  // Handle badge click from trophy strip
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
      {/* Compact Header */}
      <motion.div 
        className="sticky top-0 z-50 bg-[#F8FAFC]/95 backdrop-blur-sm safe-top"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/80 transition-colors hover:bg-slate-200/80"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Top 100 Journey
              </h1>
              <p className="text-[11px] text-slate-500" style={{ opacity: 0.65 }}>
                The world's greatest courses
              </p>
            </div>
          </div>
        </div>
        {/* Subtle gradient fade divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </motion.div>

      {/* Content - reduced section spacing */}
      <div className="relative pb-8">
        {/* Section 1: Compact Progress Hero */}
        <section className="px-4 pt-4 mb-6">
          <CompactProgressHero
            totalPlayed={totalPlayed}
            target={100}
            onContinueJourney={handleContinueJourney}
          />
        </section>

        {/* Section 2: Horizontal Trophy Strip */}
        <section className="px-4 mb-5">
          <HorizontalTrophyStrip
            totalPlayed={totalPlayed}
            regionProgress={regionProgress}
            onBadgeClick={handleBadgeClick}
          />
        </section>

        {/* Section 3: Compact Active Target (Hero CTA) */}
        <section className="px-4 mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400 mb-2">
            Active Target
          </h2>
          <CompactActiveTarget
            totalPlayed={totalPlayed}
            nextMilestone={nextMilestone ? { name: nextMilestone.name, threshold: nextMilestone.threshold } : undefined}
            suggestedRegion={suggestedRegion}
          />
        </section>

        {/* Section 4: Journey Map (Compact Timeline) */}
        <section className="px-4 mb-5" ref={journeyMapRef}>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400 mb-2">
            Journey Map
          </h2>
          <div className="bg-white rounded-xl border border-slate-200/70 p-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <CompactMilestoneTimeline
              totalPlayed={totalPlayed}
              onMilestoneClick={handleMilestoneClick}
            />
          </div>
        </section>

        {/* Section 5: Regional Progress (2x2 Grid) */}
        <section className="px-4 mb-5">
          <CompactRegionalGrid regions={regionProgress} />
        </section>

        {/* Section 6: Merged Stats (Momentum + Leaderboard) */}
        <section className="px-4 mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400 mb-2">
            Stats
          </h2>
          <MergedStatsCard
            userId={user?.id}
            recentlyPlayed={recentCourses}
          />
        </section>

        {/* Section 7: Recently Added (Dense Feed) */}
        <section className="px-4">
          <CompactRecentActivity
            courses={recentCourses}
            maxItems={5}
          />
        </section>
      </div>

      {/* Sheets */}
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

      <MilestoneUnlockSheet totalPlayed={totalPlayed} />

      <QuestFirstCourseSheet
        open={onboarding.shouldShowFirstCourse}
        onClose={onboarding.markFirstCourseSeen}
      />
    </PageRoot>
  );
};

export default ProfileQuestView;

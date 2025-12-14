/**
 * ProfileQuestView - Fullscreen Top 100 Quest Experience
 * Phase 3: Journey Map with path nodes, smart guidance, and milestone unlocks
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, ChevronRight, Lock, Play, Circle } from 'lucide-react';

// Quest persistence keys
const QUEST_REPLAY_VIEWED_KEY = 'quest_last_replay_viewed';
const QUEST_REPLAY_BADGE_DAYS = 7; // Show badge if not viewed in X days

import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useTop100SeasonStats } from '@/hooks/useTop100SeasonStats';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { RegionListSheet } from '@/components/profile-v2/RegionListSheet';
import { JourneyMapPath, JourneyChapter } from '@/components/profile-v2/JourneyMapPath';
import { NextTargetCard } from '@/components/profile-v2/NextTargetCard';
import { MilestoneUnlockSheet } from '@/components/profile-v2/MilestoneUnlockSheet';
import { QuestIntroOverlay } from '@/components/profile-v2/QuestIntroOverlay';
import { QuestFirstCourseSheet } from '@/components/profile-v2/QuestFirstCourseSheet';
import { useQuestRewards } from '@/hooks/useQuestRewards';
import { useQuestOnboarding } from '@/hooks/useQuestOnboarding';

// Milestone club type
interface MilestoneClub {
  id: string;
  name: string;
  threshold: number;
  description: string;
  isUnlocked: boolean;
  remaining?: number;
}

// Recently played course
interface RecentCourse {
  id: string;
  name: string;
  region: string;
  dateAdded?: string;
}

// Recent course row
const RecentCourseRow: React.FC<{ course: RecentCourse }> = ({ course }) => (
  <div className="flex items-center gap-3 py-3 border-b" style={{ borderColor: 'var(--dgp-divider)' }}>
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: 'var(--dgp-glass-surface)' }}
    >
      <Trophy className="w-4 h-4" style={{ color: 'var(--dgp-accent-gold)' }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate" style={{ color: 'var(--dgp-text-primary)' }}>
        {course.name}
      </p>
      <p className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
        {course.region}
      </p>
    </div>
    {course.dateAdded && (
      <span className="text-xs flex-shrink-0" style={{ color: 'var(--dgp-text-muted)' }}>
        {course.dateAdded}
      </span>
    )}
  </div>
);

const ProfileQuestView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: overview } = useTop100Overview(user?.id);
  const { data: seasonStats } = useTop100SeasonStats({ userId: user?.id });

  const [selectedRegion, setSelectedRegion] = useState<JourneyChapter | null>(null);
  const [selectedClub, setSelectedClub] = useState<MilestoneClub | null>(null);

  const totalPlayed = overview?.total_rated ?? 0;

  // Check if replay badge should show (not viewed in X days)
  const showReplayBadge = useMemo(() => {
    if (totalPlayed < 5) return false;
    const lastViewed = localStorage.getItem(QUEST_REPLAY_VIEWED_KEY);
    if (!lastViewed) return true;
    const daysSinceViewed = (Date.now() - parseInt(lastViewed, 10)) / (1000 * 60 * 60 * 24);
    return daysSinceViewed >= QUEST_REPLAY_BADGE_DAYS;
  }, [totalPlayed]);

  // Mark replay as viewed when navigating to it
  const handleReplayClick = () => {
    localStorage.setItem(QUEST_REPLAY_VIEWED_KEY, Date.now().toString());
    navigate('/profile/quest/replay');
  };

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
  const chapters: JourneyChapter[] = useMemo(() => {
    const newByList = seasonStats?.new_by_list ?? {};
    const gbiPlayed = newByList['gbi'] ?? Math.floor(totalPlayed * 0.3);
    const eurPlayed = newByList['europe'] ?? Math.floor(totalPlayed * 0.2);
    const usaPlayed = newByList['usa'] ?? Math.floor(totalPlayed * 0.25);
    const worldPlayed = newByList['world'] ?? Math.floor(totalPlayed * 0.25);

    return [
      {
        id: 'gbi',
        name: 'GB & Ireland',
        shortName: 'GB&I',
        played: gbiPlayed,
        total: 100,
        status: gbiPlayed >= 100 ? 'completed' : gbiPlayed > 0 ? 'in-progress' : 'locked',
      },
      {
        id: 'europe',
        name: 'Continental Europe',
        shortName: 'EUR',
        played: eurPlayed,
        total: 100,
        status: eurPlayed >= 100 ? 'completed' : eurPlayed > 0 ? 'in-progress' : 'locked',
      },
      {
        id: 'usa',
        name: 'USA',
        shortName: 'USA',
        played: usaPlayed,
        total: 100,
        status: usaPlayed >= 100 ? 'completed' : usaPlayed > 0 ? 'in-progress' : 'locked',
      },
      {
        id: 'world',
        name: 'Worldwide',
        shortName: 'WLD',
        played: worldPlayed,
        total: 100,
        status: worldPlayed >= 100 ? 'completed' : worldPlayed > 0 ? 'in-progress' : 'locked',
      },
    ];
  }, [seasonStats, totalPlayed]);

  // Milestone clubs
  const milestoneClubs: MilestoneClub[] = useMemo(() => {
    const thresholds = [
      { id: '5-club', name: '5 Club', threshold: 5, description: 'Play 5 Top 100 courses' },
      { id: '10-club', name: '10 Club', threshold: 10, description: 'Play 10 Top 100 courses' },
      { id: '20-club', name: '20 Club', threshold: 20, description: 'Play 20 Top 100 courses' },
      { id: '50-club', name: '50 Club', threshold: 50, description: 'Play 50 Top 100 courses' },
      { id: '100-club', name: 'Century Club', threshold: 100, description: 'Play all 100 Top 100 courses' },
    ];
    return thresholds.map((t) => ({
      ...t,
      isUnlocked: totalPlayed >= t.threshold,
      remaining: totalPlayed < t.threshold ? t.threshold - totalPlayed : undefined,
    }));
  }, [totalPlayed]);

  // Milestone data for journey map
  const journeyMilestones = milestoneClubs.map((m) => ({
    threshold: m.threshold,
    name: m.name,
    isUnlocked: m.isUnlocked,
  }));

  // Next milestone
  const nextMilestone = milestoneClubs.find((c) => !c.isUnlocked);

  // Suggested region (lowest completion)
  const suggestedRegion = useMemo(() => {
    const inProgress = chapters.filter((c) => c.status === 'in-progress' || c.status === 'locked');
    if (inProgress.length === 0) return undefined;
    const lowest = inProgress.reduce((prev, curr) =>
      (curr.played / curr.total) < (prev.played / prev.total) ? curr : prev
    );
    return lowest.name;
  }, [chapters]);

  // Recently added (placeholder)
  const recentCourses: RecentCourse[] = useMemo(() => [
    { id: '1', name: 'Royal County Down', region: 'Northern Ireland', dateAdded: 'Dec 8' },
    { id: '2', name: 'Pebble Beach', region: 'USA', dateAdded: 'Nov 22' },
    { id: '3', name: 'St Andrews Old Course', region: 'Scotland', dateAdded: 'Oct 15' },
    { id: '4', name: 'Royal Melbourne West', region: 'Australia', dateAdded: 'Sep 3' },
    { id: '5', name: 'Muirfield', region: 'Scotland', dateAdded: 'Aug 18' },
  ], []);

  // Count completed regions
  const regionsCompleted = chapters.filter((c) => c.status === 'completed').length;

  return (
    <PageRoot className="dgp-page">
      {/* Background texture for unlocked rewards */}
      {rewards.hasBackgroundTexture && (
        <div
          className="fixed inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(110, 146, 119, 0.08) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-50 safe-top" style={{ background: 'rgba(11, 15, 13, 0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="dgp-nav-button"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1
              className="text-lg font-semibold"
              style={{ color: 'var(--dgp-text-primary)' }}
            >
              The Quest
            </h1>
          </div>
          {totalPlayed >= 5 && (
            <button
              onClick={handleReplayClick}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: 'var(--dgp-glass-surface)',
                border: '1px solid var(--dgp-glass-stroke)',
                color: 'var(--dgp-text-secondary)',
              }}
            >
              <Play className="w-3 h-3" />
              Replay
              {/* Whisper badge */}
              {showReplayBadge && (
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                  style={{ background: 'var(--dgp-accent-gold)' }}
                />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-32 space-y-8">
        {/* Quest Header */}
        <section className="text-center py-6">
          <div className="flex justify-center mb-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(200, 176, 106, 0.15)',
                border: '1px solid var(--dgp-accent-gold)',
                boxShadow: rewards.hasPremiumAccent ? 'var(--dgp-shadow-glow-gold)' : 'none',
              }}
            >
              <Trophy className="w-7 h-7" style={{ color: 'var(--dgp-accent-gold)' }} />
            </div>
          </div>
          <div className="flex items-baseline justify-center gap-2 mb-1">
            <span
              className="text-5xl font-bold"
              style={{ color: 'var(--dgp-text-primary)' }}
            >
              {totalPlayed}
            </span>
            <span
              className="text-2xl"
              style={{ color: 'var(--dgp-text-muted)' }}
            >
              / 100
            </span>
          </div>
          <p
            className="text-sm"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            Top 100 Courses Played
          </p>
        </section>

        {/* Next Target Card */}
        <NextTargetCard
          totalPlayed={totalPlayed}
          nextMilestone={nextMilestone ? { name: nextMilestone.name, threshold: nextMilestone.threshold } : undefined}
          suggestedRegion={suggestedRegion}
          suggestedFocus={nextMilestone?.name}
          onShare={() => {/* Share placeholder */}}
          showHint={onboarding.shouldShowTargetHint}
          onHintDismiss={onboarding.markTargetHintSeen}
        />

        {/* Journey Map */}
        <section>
          {/* Journey hint whisper */}
          {showJourneyHint && (
            <p
              className="text-xs mb-2 px-1 transition-opacity duration-500"
              style={{ color: 'var(--dgp-text-muted)' }}
            >
              Your journey unfolds here
            </p>
          )}
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-4 px-1"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            Journey Map
          </h2>
          <JourneyMapPath
            chapters={chapters}
            milestones={journeyMilestones}
            onChapterClick={(chapter) => setSelectedRegion(chapter)}
            onMilestoneClick={(m) => {
              const club = milestoneClubs.find((c) => c.threshold === m.threshold);
              if (club) setSelectedClub(club);
            }}
          />
        </section>

        {/* Recently Added */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--dgp-text-secondary)' }}
            >
              Recently Added
            </h2>
            <button
              onClick={() => navigate('/profile/quest/index')}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--dgp-accent-green)' }}
            >
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div
            className="dgp-glass rounded-xl p-4"
            style={{
              boxShadow: rewards.hasGoldTrim ? '0 0 20px rgba(200, 176, 106, 0.1)' : 'none',
              border: rewards.hasGoldTrim ? '1px solid rgba(200, 176, 106, 0.2)' : undefined,
            }}
          >
            {recentCourses.map((course) => (
              <RecentCourseRow key={course.id} course={course} />
            ))}
          </div>
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

      {/* Milestone Club Sheet */}
      <Sheet open={!!selectedClub} onOpenChange={() => setSelectedClub(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t"
          style={{
            background: 'var(--dgp-bg-surface)',
            borderColor: 'var(--dgp-glass-stroke)',
          }}
        >
          {selectedClub && (
            <>
              <SheetHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'var(--dgp-glass-surface)',
                      border: '1px solid var(--dgp-glass-stroke)',
                      boxShadow: selectedClub.isUnlocked ? 'var(--dgp-shadow-glow-gold)' : 'none',
                      opacity: selectedClub.isUnlocked ? 1 : 0.4,
                    }}
                  >
                    <Trophy
                      className="w-6 h-6"
                      style={{ color: 'var(--dgp-accent-gold)' }}
                    />
                  </div>
                </div>
                <SheetTitle style={{ color: 'var(--dgp-text-primary)' }}>
                  {selectedClub.name}
                </SheetTitle>
              </SheetHeader>
              <div className="text-center space-y-4 pb-8">
                <p style={{ color: 'var(--dgp-text-secondary)' }}>
                  {selectedClub.description}
                </p>
                
                {/* Progress */}
                <div className="px-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: 'var(--dgp-text-muted)' }}>
                      Progress
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--dgp-text-primary)' }}>
                      {totalPlayed} / {selectedClub.threshold}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--dgp-glass-surface)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((totalPlayed / selectedClub.threshold) * 100, 100)}%`,
                        background: 'var(--dgp-accent-gold)',
                      }}
                    />
                  </div>
                </div>

                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                  style={{
                    background: selectedClub.isUnlocked
                      ? 'rgba(200, 176, 106, 0.2)'
                      : 'var(--dgp-glass-surface)',
                    color: selectedClub.isUnlocked
                      ? 'var(--dgp-accent-gold)'
                      : 'var(--dgp-text-muted)',
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

      {/* First Course Celebration */}
      <QuestFirstCourseSheet
        open={onboarding.shouldShowFirstCourse}
        onClose={onboarding.markFirstCourseSeen}
      />
    </PageRoot>
  );
};

export default ProfileQuestView;

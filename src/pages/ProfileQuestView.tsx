/**
 * ProfileQuestView - Fullscreen Top 100 Quest Experience
 * Dark glass premium experience
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, MapPin, ChevronRight, Lock } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useTop100SeasonStats } from '@/hooks/useTop100SeasonStats';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { RegionListSheet } from '@/components/profile-v2/RegionListSheet';

// Region data type
interface RegionData {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

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

// Region progress card
const RegionCard: React.FC<{
  region: RegionData;
  onClick: () => void;
}> = ({ region, onClick }) => {
  const progressPercent = region.total > 0 ? (region.played / region.total) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="dgp-glass p-4 rounded-xl text-left transition-all hover:border-white/15 active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: 'var(--dgp-text-primary)' }}>
          {region.name}
        </span>
        <ChevronRight className="w-4 h-4" style={{ color: 'var(--dgp-text-muted)' }} />
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold" style={{ color: 'var(--dgp-text-primary)' }}>
          {region.played}
        </span>
        <span className="text-sm" style={{ color: 'var(--dgp-text-muted)' }}>
          / {region.total}
        </span>
      </div>
      {/* Progress bar */}
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: 'var(--dgp-glass-surface)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progressPercent}%`,
            background: 'var(--dgp-accent-gold)',
          }}
        />
      </div>
    </button>
  );
};

// Milestone club item
const MilestoneClubItem: React.FC<{
  club: MilestoneClub;
  onClick: () => void;
}> = ({ club, onClick }) => (
  <button
    onClick={onClick}
    className="flex-shrink-0 dgp-trophy"
    style={{ opacity: club.isUnlocked ? 1 : 0.4 }}
  >
    <div
      className="dgp-trophy-icon"
      style={{
        boxShadow: club.isUnlocked ? 'var(--dgp-shadow-glow-gold)' : 'none',
      }}
    >
      {club.isUnlocked ? (
        <Trophy className="w-5 h-5" style={{ color: 'var(--dgp-accent-gold)' }} />
      ) : (
        <Lock className="w-4 h-4" style={{ color: 'var(--dgp-text-muted)' }} />
      )}
    </div>
    <span className="dgp-trophy-label">{club.name}</span>
    {!club.isUnlocked && club.remaining !== undefined && (
      <span className="text-[10px]" style={{ color: 'var(--dgp-text-muted)' }}>
        {club.remaining} to go
      </span>
    )}
  </button>
);

// Recent course row
const RecentCourseRow: React.FC<{ course: RecentCourse }> = ({ course }) => (
  <div className="flex items-center gap-3 py-3 border-b" style={{ borderColor: 'var(--dgp-divider)' }}>
    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--dgp-accent-gold)' }} />
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

  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [selectedClub, setSelectedClub] = useState<MilestoneClub | null>(null);

  const totalPlayed = overview?.total_rated ?? 0;

  // Regions data (placeholder totals)
  const regions: RegionData[] = useMemo(() => {
    const newByList = seasonStats?.new_by_list ?? {};
    return [
      { id: 'gbi', name: 'GB & Ireland', shortName: 'GB&I', played: newByList['gbi'] ?? Math.floor(totalPlayed * 0.3), total: 100 },
      { id: 'europe', name: 'Continental Europe', shortName: 'EUR', played: newByList['europe'] ?? Math.floor(totalPlayed * 0.2), total: 100 },
      { id: 'usa', name: 'USA', shortName: 'USA', played: newByList['usa'] ?? Math.floor(totalPlayed * 0.25), total: 100 },
      { id: 'world', name: 'Worldwide', shortName: 'WLD', played: newByList['world'] ?? Math.floor(totalPlayed * 0.25), total: 100 },
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

  // Next milestone
  const nextMilestone = milestoneClubs.find((c) => !c.isUnlocked)?.name;

  // Recently added (placeholder)
  const recentCourses: RecentCourse[] = useMemo(() => [
    { id: '1', name: 'Royal County Down', region: 'Northern Ireland', dateAdded: 'Dec 8' },
    { id: '2', name: 'Pebble Beach', region: 'USA', dateAdded: 'Nov 22' },
    { id: '3', name: 'St Andrews Old Course', region: 'Scotland', dateAdded: 'Oct 15' },
    { id: '4', name: 'Royal Melbourne West', region: 'Australia', dateAdded: 'Sep 3' },
    { id: '5', name: 'Muirfield', region: 'Scotland', dateAdded: 'Aug 18' },
  ], []);

  return (
    <PageRoot className="dgp-page">
      {/* Header */}
      <div className="sticky top-0 z-50 safe-top">
        <div className="flex items-center gap-4 p-4">
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
      </div>

      {/* Content */}
      <div className="px-4 pb-32 space-y-8">
        {/* Quest Header */}
        <section className="text-center py-6">
          <div className="flex justify-center mb-3">
            <Trophy className="w-8 h-8" style={{ color: 'var(--dgp-accent-gold)' }} />
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

        {/* Region Progress Grid */}
        <section>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-4 px-1"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            Region Progress
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {regions.map((region) => (
              <RegionCard
                key={region.id}
                region={region}
                onClick={() => setSelectedRegion(region)}
              />
            ))}
          </div>
        </section>

        {/* Milestone Clubs Shelf */}
        <section>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-4 px-1"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            Milestone Clubs
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {milestoneClubs.map((club) => (
              <MilestoneClubItem
                key={club.id}
                club={club}
                onClick={() => setSelectedClub(club)}
              />
            ))}
          </div>
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
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--dgp-accent-green)' }}
            >
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="dgp-glass rounded-xl p-4">
            {recentCourses.map((course, i) => (
              <RecentCourseRow key={course.id} course={course} />
            ))}
          </div>
        </section>
      </div>

      {/* Region List Sheet */}
      <RegionListSheet
        region={selectedRegion}
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
    </PageRoot>
  );
};

export default ProfileQuestView;

/**
 * QuestReplayView - Cinematic annual/seasonal recap
 * Premium, calm, no confetti
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, MapPin, Share2, Calendar } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';
import { useQuestCourses } from '@/hooks/useQuestCourses';
import { formatRatingValue } from '@/utils/formatters';

// Milestone chip
const MilestoneChip: React.FC<{ name: string; unlocked: boolean }> = ({ name, unlocked }) => (
  <div
    className="px-3 py-1.5 rounded-full text-xs font-medium"
    style={{
      background: unlocked ? 'rgba(200, 176, 106, 0.2)' : 'var(--dgp-glass-surface)',
      color: unlocked ? 'var(--dgp-accent-gold)' : 'var(--dgp-text-muted)',
      border: '1px solid',
      borderColor: unlocked ? 'rgba(200, 176, 106, 0.3)' : 'var(--dgp-glass-stroke)',
    }}
  >
    {unlocked ? '✓ ' : ''}{name}
  </div>
);

// Course moment card
const MomentCard: React.FC<{
  name: string;
  region: string;
  date?: string;
  rating?: number;
}> = ({ name, region, date, rating }) => (
  <div
    className="dgp-glass rounded-xl p-4"
  >
    <div className="flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(200, 176, 106, 0.1)' }}
      >
        <MapPin className="w-5 h-5" style={{ color: 'var(--dgp-accent-gold)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: 'var(--dgp-text-primary)' }}
        >
          {name}
        </p>
        <p className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
          {region}
        </p>
      </div>
      {date && (
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--dgp-text-muted)' }}>
          {date}
        </span>
      )}
    </div>
    {rating && (
      <div className="mt-3 flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>Rating:</span>
        <span className="text-xs font-medium" style={{ color: 'var(--dgp-accent-gold)' }}>
          {formatRatingValue(rating)}
        </span>
      </div>
    )}
  </div>
);

const QuestReplayView: React.FC = () => {
  const navigate = useNavigate();
  const { courses, totalPlayed, regionProgress, recentlyPlayed, isLoading } = useQuestCourses();

  // Milestones earned
  const milestones = useMemo(() => {
    const thresholds = [
      { id: '5-club', name: '5 Club', threshold: 5 },
      { id: '10-club', name: '10 Club', threshold: 10 },
      { id: '20-club', name: '20 Club', threshold: 20 },
      { id: '50-club', name: '50 Club', threshold: 50 },
      { id: '100-club', name: 'Century Club', threshold: 100 },
    ];
    return thresholds.map(t => ({
      ...t,
      unlocked: totalPlayed >= t.threshold,
    }));
  }, [totalPlayed]);

  const unlockedMilestones = milestones.filter(m => m.unlocked);
  const completedRegions = regionProgress.filter(r => r.played >= r.total && r.total > 0);

  // Get most played courses (limited to 6)
  const moments = recentlyPlayed.slice(0, 6);

  const handleShare = () => {
    // Placeholder for share functionality
    if (navigator.share) {
      navigator.share({
        title: 'My Quest Replay',
        text: `I've played ${totalPlayed} Top 100 golf courses on The Quest!`,
      }).catch(() => {});
    }
  };

  if (isLoading) {
    return (
      <PageRoot className="dgp-page">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--dgp-accent-gold)', borderTopColor: 'transparent' }}
          />
        </div>
      </PageRoot>
    );
  }

  // Empty state
  if (totalPlayed < 5) {
    return (
      <PageRoot className="dgp-page">
        <div className="sticky top-0 z-50 safe-top" style={{ background: 'rgba(11, 15, 13, 0.9)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => navigate(-1)}
              className="dgp-nav-button"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--dgp-text-primary)' }}>
              Quest Replay
            </h1>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: 'var(--dgp-glass-surface)',
              border: '1px solid var(--dgp-glass-stroke)',
            }}
          >
            <Trophy className="w-8 h-8" style={{ color: 'var(--dgp-text-muted)' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--dgp-text-primary)' }}>
            Build Your Replay
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--dgp-text-muted)' }}>
            Play more Top 100 courses to unlock your Quest Replay. You need at least 5 courses to generate a replay.
          </p>
          <Button
            onClick={() => navigate('/profile/quest/index')}
            style={{
              background: 'var(--dgp-accent-green)',
              color: '#000',
            }}
          >
            Explore Courses
          </Button>
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="dgp-page">
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
            <h1 className="text-lg font-semibold" style={{ color: 'var(--dgp-text-primary)' }}>
              Quest Replay
            </h1>
          </div>
          <button
            onClick={handleShare}
            className="dgp-nav-button"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-32 space-y-8">
        {/* Hero */}
        <section className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(200, 176, 106, 0.15)',
                border: '1px solid var(--dgp-accent-gold)',
                boxShadow: '0 0 40px rgba(200, 176, 106, 0.2)',
              }}
            >
              <Trophy className="w-8 h-8" style={{ color: 'var(--dgp-accent-gold)' }} />
            </div>
          </div>
          
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--dgp-accent-gold)' }}
          >
            Your Quest Replay
          </p>
          
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className="text-5xl font-bold" style={{ color: 'var(--dgp-text-primary)' }}>
              {totalPlayed}
            </span>
            <span className="text-2xl" style={{ color: 'var(--dgp-text-muted)' }}>
              / 100
            </span>
          </div>
          
          <p className="text-sm" style={{ color: 'var(--dgp-text-secondary)' }}>
            Top 100 Courses Played
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-4">
            <Calendar className="w-4 h-4" style={{ color: 'var(--dgp-text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
              {new Date().getFullYear()} Season
            </span>
          </div>
        </section>

        {/* Milestones Earned */}
        {unlockedMilestones.length > 0 && (
          <section>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4 px-1"
              style={{ color: 'var(--dgp-text-secondary)' }}
            >
              Milestones Earned
            </h2>
            <div className="flex flex-wrap gap-2">
              {unlockedMilestones.map(m => (
                <MilestoneChip key={m.id} name={m.name} unlocked />
              ))}
            </div>
          </section>
        )}

        {/* Regions Completed */}
        {completedRegions.length > 0 && (
          <section>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4 px-1"
              style={{ color: 'var(--dgp-text-secondary)' }}
            >
              Regions Completed
            </h2>
            <div className="flex flex-wrap gap-2">
              {completedRegions.map(r => (
                <div
                  key={r.id}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: 'rgba(110, 146, 119, 0.2)',
                    color: 'var(--dgp-accent-green)',
                    border: '1px solid rgba(110, 146, 119, 0.3)',
                  }}
                >
                  ✓ {r.name}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Journey Summary */}
        <section>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-4 px-1"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            Journey Summary
          </h2>
          <div className="dgp-glass rounded-xl p-4 space-y-3">
            {regionProgress.map(region => (
              <div key={region.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm" style={{ color: 'var(--dgp-text-primary)' }}>
                    {region.name}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--dgp-text-muted)' }}>
                    {region.played} / {region.total}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--dgp-glass-surface)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${region.total > 0 ? (region.played / region.total) * 100 : 0}%`,
                      background: region.played >= region.total && region.total > 0
                        ? 'var(--dgp-accent-gold)'
                        : 'var(--dgp-accent-green)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Moments from the Quest */}
        {moments.length > 0 && (
          <section>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4 px-1"
              style={{ color: 'var(--dgp-text-secondary)' }}
            >
              Recent Moments
            </h2>
            <div className="space-y-3">
              {moments.map(course => (
                <MomentCard
                  key={course.id}
                  name={course.name}
                  region={course.region}
                  date={course.dateAdded}
                  rating={course.rating}
                />
              ))}
            </div>
          </section>
        )}

        {/* Share Button */}
        <section className="pt-4">
          <Button
            className="w-full"
            onClick={handleShare}
            style={{
              background: 'var(--dgp-accent-gold)',
              color: '#000',
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Replay
          </Button>
        </section>
      </div>
    </PageRoot>
  );
};

export default QuestReplayView;

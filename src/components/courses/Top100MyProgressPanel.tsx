import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Top100PilgrimageView } from './Top100PilgrimageView';
import { Top100HeroSection } from './Top100HeroSection';
import { Top100MilestonesCarousel } from './Top100MilestonesCarousel';
import { Top100RegionProgressGrid } from './Top100RegionProgressGrid';
import { Top100RecentRoundsFeed } from './Top100RecentRoundsFeed';
import ProfileBadgeStrip from '@/components/profile/ProfileBadgeStrip';
import { cn } from '@/lib/utils';

interface Top100MyProgressPanelProps {
  userId?: string | null;
}

const Top100MyProgressPanel: React.FC<Top100MyProgressPanelProps> = ({ userId }) => {
  const { session } = useSupabaseSession();
  const effectiveUserId = userId ?? session?.user?.id ?? null;
  const { data, isLoading } = useTop100ProgressForUser(effectiveUserId);
  const navigate = useNavigate();
  const isOwnProfile = !userId || userId === session?.user?.id;
  const [journeyView, setJourneyView] = useState<'overview' | 'pilgrimage'>('overview');

  // Calculate badge props for ProfileBadgeStrip
  const badgeProps = React.useMemo(() => {
    if (!data) return null;
    
    const gbIList = data.lists.find(l => l.listSlug === 'gb-i-top-100');
    const europeList = data.lists.find(l => l.listSlug === 'europe-top-100');
    const usaList = data.lists.find(l => l.listSlug === 'usa-top-100');
    const globalList = data.lists.find(l => l.listSlug === 'global-top-100');

    return {
      coursesPlayed: data.total_played_top100,
      totalXP: 0, // XP not tracked in Top 100 context
      britainIrelandCompleted: gbIList?.played || 0,
      europeCompleted: europeList?.played || 0,
      usaCompleted: usaList?.played || 0,
      worldwideCompleted: globalList?.played || 0,
    };
  }, [data]);

  if (!effectiveUserId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sign in to track your Top 100 progress</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const lastPlayedDate = data.recent_rounds[0]?.played_at || null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 pb-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">
          {isOwnProfile ? 'Your Top 100 Journey' : 'Top 100 Journey'}
        </h1>
        <p className="text-muted-foreground">
          {isOwnProfile 
            ? 'Track your elite pilgrimage across the world\'s greatest courses'
            : 'See how far they\'ve come across the world\'s greatest courses'}
        </p>
        
        {/* View Toggle */}
        <div className="flex justify-center pt-2">
          <div className="inline-flex rounded-full bg-surface-alt p-1 text-xs">
            <button
              type="button"
              onClick={() => setJourneyView('overview')}
              className={cn(
                'px-3 py-1 rounded-full transition-all',
                journeyView === 'overview'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setJourneyView('pilgrimage')}
              className={cn(
                'px-3 py-1 rounded-full transition-all',
                journeyView === 'pilgrimage'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Pilgrimage Mode
            </button>
          </div>
        </div>
      </div>

      {journeyView === 'overview' ? (
        <>
          {/* Hero Section with Big Ring */}
          <Top100HeroSection
            avatarUrl={session?.user?.user_metadata?.avatar_url}
            displayName={session?.user?.user_metadata?.full_name}
            totalPlayed={data.total_played_top100}
            regionsCount={data.regions_count}
            prestigeRing={data.prestige_ring}
            prestigeLabel={data.prestige_label}
            lastPlayedDate={lastPlayedDate}
            isOwnProfile={isOwnProfile}
          />

          {/* Milestones Carousel */}
          <Top100MilestonesCarousel
            totalPlayed={data.total_played_top100}
            onMilestoneClick={() => {
              // Already on My Progress, could open a modal in future
            }}
          />

          {/* Region Progress Grid */}
          <Top100RegionProgressGrid
            lists={data.lists}
            onListClick={(slug) => navigate(`/top100/${slug}`)}
          />

          {/* Achievements & Badges Strip */}
          {badgeProps && badgeProps.coursesPlayed >= 20 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Achievements & Badges</h3>
              <ProfileBadgeStrip {...badgeProps} />
            </div>
          )}

          {/* Recent Top 100 Rounds */}
          <Top100RecentRoundsFeed
            rounds={data.recent_rounds}
            isOwnProfile={isOwnProfile}
            maxDisplay={5}
          />
        </>
      ) : (
        <Top100PilgrimageView userId={userId} />
      )}
    </div>
  );
};

export default Top100MyProgressPanel;

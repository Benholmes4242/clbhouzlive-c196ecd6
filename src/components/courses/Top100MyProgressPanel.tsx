import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Top100PilgrimageView } from './Top100PilgrimageView';
import { Top100HeroSection } from './Top100HeroSection';
import { Top100MilestonesCarousel } from './Top100MilestonesCarousel';
import { Top100RegionProgressGrid } from './Top100RegionProgressGrid';
import { Top100RecentRoundsFeed } from './Top100RecentRoundsFeed';
import ProfileBadgeStrip from '@/components/profile/ProfileBadgeStrip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useTop100FriendsSnapshot } from '@/hooks/useTop100FriendsSnapshot';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getTop100Title } from '@/lib/top100Prestige';

interface Top100MyProgressPanelProps {
  userId?: string | null;
}

const Top100MyProgressPanel: React.FC<Top100MyProgressPanelProps> = ({ userId }) => {
  const { session } = useSupabaseSession();
  const effectiveUserId = userId ?? session?.user?.id ?? null;
  const { data, isLoading } = useTop100ProgressForUser(effectiveUserId);
  const { data: friendsSnapshot } = useTop100FriendsSnapshot();
  const navigate = useNavigate();
  const isOwnProfile = !userId || userId === session?.user?.id;
  const [journeyView, setJourneyView] = useState<'overview' | 'pilgrimage'>('overview');
  const { toast } = useToast();
  const prevTotalRef = useRef<number | null>(null);

  // Milestone "Share to Clubhouse" logic - MUST be before early returns
  useEffect(() => {
    if (!data || !isOwnProfile) return;

    const current = data.total_played_top100;
    const prev = prevTotalRef.current ?? 0;

    const thresholds = [20, 50, 100];
    const justHit = thresholds.find((t) => prev < t && current >= t);

    if (justHit) {
      toast({
        title: `Top 100 milestone unlocked – ${justHit} Club 🎉`,
        description: 'Share your journey with the Clubhouse community?',
        action: (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/create-moment')}
          >
            Share to Clubhouse
          </Button>
        ),
      });
    }

    prevTotalRef.current = current;
  }, [data?.total_played_top100, isOwnProfile, toast, navigate]);

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
  const clubTitle = getTop100Title(data.total_played_top100);

  // Friends comparison logic
  const myCount = data?.total_played_top100 ?? 0;
  const friends = friendsSnapshot?.friends ?? [];

  const topFriends = friends
    .slice()
    .sort((a, b) => b.total_top100_played - a.total_top100_played)
    .slice(0, 3);

  let friendMessage: string | null = null;

  if (friendsSnapshot?.me && friends.length > 0) {
    const bestFriend = topFriends[0];

    if (bestFriend && bestFriend.total_top100_played > myCount) {
      const diff = bestFriend.total_top100_played - myCount;
      friendMessage = `${bestFriend.display_name} is ahead by ${diff} course${diff === 1 ? '' : 's'}.`;
    } else {
      friendMessage = "You're leading your friends – keep your edge.";
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pb-6 pt-2 sm:px-4 sm:pt-3">
      {journeyView === 'overview' ? (
        <>
          {/* Hero Card */}
          <section className="rounded-3xl border border-slate-800/70 bg-slate-950/80 px-4 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.55)] sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: Ring + Stats */}
              <div className="flex flex-1 items-center gap-3 sm:gap-4">
                {/* Ring/Avatar */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div
                      className={cn(
                        'h-24 w-24 rounded-full flex items-center justify-center border-4 ring-4 ring-offset-4 ring-offset-slate-950 transition-all sm:h-28 sm:w-28',
                        data.prestige_ring === 'bronze' && 'ring-amber-500/80',
                        data.prestige_ring === 'blue' && 'ring-sky-500/80',
                        data.prestige_ring === 'green' && 'ring-emerald-500/80',
                        data.prestige_ring === 'silver' && 'ring-slate-200/80',
                        data.prestige_ring === 'gold' && 'ring-yellow-400/90',
                        data.prestige_ring === 'platinum' && 'ring-fuchsia-400/90',
                        !data.prestige_ring && 'ring-slate-700'
                      )}
                    >
                      <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                        <AvatarImage src={session?.user?.user_metadata?.avatar_url || undefined} />
                        <AvatarFallback className="text-xl bg-slate-800 text-slate-100 sm:text-2xl">
                          {session?.user?.user_metadata?.full_name
                            ?.split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>

                {/* Headline Stats */}
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
                    Your Top 100 journey
                  </p>

                  <h1 className="truncate text-base font-semibold text-slate-50 sm:text-lg">
                    {isOwnProfile ? "You've" : "They've"} played {data.total_played_top100} Top 100 course
                    {data.total_played_top100 === 1 ? '' : 's'}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span>
                      Across {data.regions_count} {data.regions_count === 1 ? 'region' : 'regions'}
                    </span>

                    {clubTitle && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-100">
                          {clubTitle}
                        </span>
                      </>
                    )}

                    {data.prestige_label && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                          {data.prestige_label}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Quick Stats Pill */}
              <div className="w-full max-w-[240px] space-y-2 rounded-2xl bg-slate-900/80 px-3 py-2.5 text-xs text-slate-100 sm:w-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-300">Milestone</span>
                  {clubTitle && <span className="text-[11px] font-semibold text-slate-50">{clubTitle}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Top 100 courses</span>
                  <span className="font-semibold text-slate-50">{data.total_played_top100}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Regions completed</span>
                  <span className="font-semibold text-slate-50">{data.regions_count}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content: Two Columns */}
          <section className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            {/* Left Column: Journey Summary + Content */}
            <div className="flex-1 space-y-3">
              {/* Journey Toggle + Summary */}
              <div className="space-y-2">
                {/* Toggle Row */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Journey overview
                  </h2>

                  <div className="inline-flex items-center rounded-full bg-slate-900/80 p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setJourneyView('overview')}
                      className="rounded-full px-2.5 py-1 transition-colors bg-slate-700 text-slate-50"
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => setJourneyView('pilgrimage')}
                      className="rounded-full px-2.5 py-1 transition-colors text-slate-400 hover:text-slate-200"
                    >
                      Pilgrimage
                    </button>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 px-3.5 py-3 text-xs text-slate-200 sm:px-4 sm:py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>
                      {isOwnProfile ? "You've" : "They've"} visited{' '}
                      <span className="font-semibold text-slate-50">{data.total_played_top100}</span> Top 100 course
                      {data.total_played_top100 === 1 ? '' : 's'} across{' '}
                      <span className="font-semibold text-slate-50">{data.regions_count}</span> region
                      {data.regions_count === 1 ? '' : 's'}.
                    </span>
                    {clubTitle && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                        Current milestone: {clubTitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Milestones Rail */}
              {data.total_played_top100 > 0 && (
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Milestones</h3>
                  </div>
                  <Top100MilestonesCarousel
                    totalPlayed={data.total_played_top100}
                    onMilestoneClick={() => {}}
                  />
                </section>
              )}

              {/* Region Progress Grid */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Lists & Regions
                  </h3>
                </div>
                <Top100RegionProgressGrid lists={data.lists} onListClick={(slug) => navigate(`/top100/${slug}`)} />
              </section>

              {/* Achievements & Badges */}
              {badgeProps && badgeProps.coursesPlayed >= 20 && (
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                      Achievements & Badges
                    </h3>
                  </div>
                  <ProfileBadgeStrip {...badgeProps} />
                </section>
              )}

              {/* Recent Rounds */}
              {data.recent_rounds && data.recent_rounds.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                      Recent Top 100 rounds
                    </h3>
                  </div>
                  <Top100RecentRoundsFeed rounds={data.recent_rounds} isOwnProfile={isOwnProfile} maxDisplay={4} />
                </section>
              )}
            </div>

            {/* Right Column: Friends */}
            {isOwnProfile && friendsSnapshot && friends.length > 0 && (
              <aside className="w-full sm:w-[280px]">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 px-3.5 py-3 text-xs text-slate-100 sm:px-4 sm:py-3.5">
                  <div className="mb-2 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Friends chasing the Top 100
                      </h2>

                      <button
                        type="button"
                        onClick={() => navigate('/top100?tab=leaderboard')}
                        className="flex-shrink-0 text-[11px] font-medium text-primary-accent hover:text-primary-accent/80"
                      >
                        View →
                      </button>
                    </div>
                    {friendMessage && <p className="text-[11px] text-slate-400">{friendMessage}</p>}
                  </div>

                  <div className="space-y-1.5">
                    {topFriends.map((f) => (
                      <button
                        key={f.friend_id}
                        type="button"
                        onClick={() => navigate(`/profile/${f.friend_id}?tab=top100`)}
                        className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors hover:bg-slate-900/80"
                      >
                        <div className="flex items-center gap-2">
                          {f.profile_photo_url ? (
                            <img
                              src={f.profile_photo_url}
                              alt={f.display_name ?? 'Friend avatar'}
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-100">
                              {(f.display_name?.charAt(0) ?? '?').toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-medium text-slate-50">{f.display_name}</p>
                            <p className="truncate text-[11px] text-slate-400">{f.home_club || 'No club set'}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-semibold text-slate-50">{f.total_top100_played}</p>
                          <p className="text-[10px] text-slate-400">
                            Top 100 course{f.total_top100_played === 1 ? '' : 's'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </section>
        </>
      ) : (
        <Top100PilgrimageView userId={userId} />
      )}
    </div>
  );
};

export default Top100MyProgressPanel;

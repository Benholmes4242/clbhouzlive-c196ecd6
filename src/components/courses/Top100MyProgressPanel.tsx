import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { Trophy, Calendar, Flame, Plus, ChevronRight, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTop100ProgressForUser, type Top100RecentRound } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UnifiedAchievementSheet, type AchievementData } from '@/components/top100/UnifiedAchievementSheet';
import { useTop100FriendsSnapshot } from '@/hooks/useTop100FriendsSnapshot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { buildStreakSummary } from '@/lib/top100StreakSummary';

// ----- Phase D cleanup: legacy imports retained for reference, no longer rendered -----
// import { Top100ProgressHero } from '@/components/top100/Top100ProgressHero';
// import { Top100MilestonesCarousel } from '@/components/courses/Top100MilestonesCarousel';
// import { Top100YearSummary } from '@/components/top100/Top100YearSummary';
// import { Top100RecentRoundsCarousel } from '@/components/top100/Top100RecentRoundsCarousel';
// import { Top100ProgressTimeline } from '@/components/top100/Top100ProgressTimeline';
// import { Top100LoggingStreak } from '@/components/top100/Top100LoggingStreak';
// import { SimplifiedMilestoneLadder } from '@/components/top100/SimplifiedMilestoneLadder';
// import { MasteryTrack } from '@/components/top100/MasteryTrack';
// import Top100FriendsActivityCard from '@/components/top100/Top100FriendsActivityCard';
// import {
//   Top100ProgressHeroSkeleton,
//   Top100YearSummarySkeleton,
//   Top100MilestonesCarouselSkeleton,
//   Top100RecentRoundsSkeleton,
//   Top100TimelineSkeleton,
//   Top100StreakSkeleton,
// } from '@/components/top100/Top100ProgressSkeletons';
// import { buildYearSummary } from '@/lib/top100ProgressSelectors';
// import { MILESTONE_THEMES } from '@/lib/globalAchievementMilestoneSystem';
// import { type RegionProgress } from '@/components/quest/RegionalJourneySummary';

// Stable empty array constant - module level to avoid new reference each render
const EMPTY_ROUNDS: Top100RecentRound[] = [];

// Course tile fallback (existing project asset). If the SVG is missing, the
// gradient overlay falls back onto a slate background so the tile still reads
// as intentional rather than broken.
const FALLBACK_COURSE_IMAGE = '/placeholder.svg';

interface Top100MyProgressPanelProps {
  userId?: string | null;
}

const Top100MyProgressPanel: React.FC<Top100MyProgressPanelProps> = ({ userId }) => {
  const { session } = useSupabaseSession();
  const effectiveUserId = userId ?? session?.user?.id ?? null;
  const { data, isLoading } = useTop100ProgressForUser(effectiveUserId);
  const { data: profile } = useUserProfile(effectiveUserId);
  const { data: friendsSnapshot } = useTop100FriendsSnapshot();
  const navigate = useNavigate();
  const isOwnProfile = !userId || userId === session?.user?.id;
  const prevTotalRef = useRef<number | null>(null);

  const [achievementSheetData, setAchievementSheetData] = useState<AchievementData | null>(null);
  const [isAchievementSheetOpen, setIsAchievementSheetOpen] = useState(false);

  // Sheet still mounted — sub-page (Phase B) reuses it but the main page no
  // longer triggers `openMilestoneSheet` / `openRegionalSheet` directly.
  const closeAchievementSheet = useCallback(() => {
    setIsAchievementSheetOpen(false);
  }, []);

  // Milestone tracking ref (kept for future use)
  useEffect(() => {
    if (!data || !isOwnProfile) return;
    prevTotalRef.current = data.totalTop100Played;
  }, [data?.totalTop100Played, isOwnProfile]);

  // Next-milestone progress percentage for the inline pill
  const nextMilestoneProgress = useMemo(() => {
    if (!data?.next_milestone) return 0;
    const thresholds = [5, 10, 20, 50, 100, 200, 300, 400];
    const currentThreshold = thresholds.find(t => t > (data?.totalTop100Played ?? 0)) || 400;
    const prevThreshold = thresholds[thresholds.indexOf(currentThreshold) - 1] || 0;
    const range = currentThreshold - prevThreshold;
    const progress = (data?.totalTop100Played ?? 0) - prevThreshold;
    return Math.min(100, Math.round((progress / range) * 100));
  }, [data?.next_milestone, data?.totalTop100Played]);

  // Streak summary derived from the dedicated 18-month window
  const streakSummary = useMemo(() => {
    const rounds = data?.all_rounds_for_streak ?? EMPTY_ROUNDS;
    return buildStreakSummary(rounds, {
      isOwnProfile,
      firstName: (profile?.display_name ?? session?.user?.user_metadata?.full_name ?? '')
        .split(' ')[0] || undefined,
    });
  }, [data?.all_rounds_for_streak, isOwnProfile, profile?.display_name, session?.user?.user_metadata?.full_name]);

  // ===== EARLY RETURNS AFTER ALL HOOKS =====

  if (!effectiveUserId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent-amber) / 0.1)' }}>
          <Trophy className="w-7 h-7" style={{ color: 'hsl(var(--accent-amber))' }} />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Track your Top 100 journey</p>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to see your progress across the world's best courses.</p>
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="h-11 px-6 text-sm font-semibold text-white rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
          style={{ backgroundColor: 'hsl(var(--accent-amber))' }}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="w-full max-w-full animate-fade-in space-y-6 px-4 pt-2 pb-8">
        {/* Hero skeleton */}
        <div>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-7 w-48" />
          <div className="flex items-center gap-4 mt-4">
            <Skeleton className="w-[76px] h-[76px] rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-14 w-full mt-3 rounded-xl" />
        </div>
        {/* Momentum skeleton */}
        <div>
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-[72px] w-full rounded-2xl" />
        </div>
        {/* Recent rounds skeleton */}
        <div>
          <Skeleton className="h-3 w-28 mb-2" />
          <Skeleton className="h-5 w-44 mb-3" />
          <div className="flex gap-2.5">
            {[1, 2, 3].map(i => <Skeleton key={i} className="w-[220px] h-[160px] rounded-2xl flex-shrink-0" />)}
          </div>
        </div>
        {/* Footer links skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // ----- Derivations that depend on data -----
  const lastPlayedDate = data.recent_rounds[0]?.played_at || null;
  const formattedLastPlayedShort = lastPlayedDate
    ? format(new Date(lastPlayedDate), 'd MMM')
    : null;

  const avatarUrl =
    profile?.profile_photo_url ??
    session?.user?.user_metadata?.avatar_url ??
    null;

  const displayName =
    profile?.display_name ??
    session?.user?.user_metadata?.full_name ??
    null;

  const initials =
    displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  // Friends comparison logic - real data only
  const myCount = data.totalTop100Played ?? 0;
  const friends = friendsSnapshot?.friends ?? [];

  const topFriends = friends
    .filter(f => (f.total_top100_played ?? 0) > 0)
    .sort((a, b) => (b.total_top100_played ?? 0) - (a.total_top100_played ?? 0))
    .slice(0, 10);

  // Friends footer link copy. Tied count counts as "leading" (intentional,
  // matches existing behaviour).
  const friendMessageShort = (() => {
    const top = topFriends[0];
    if (!top || top.total_top100_played <= myCount) {
      return "You're leading your friends";
    }
    const firstName = top.display_name?.split(' ')[0] ?? 'They';
    const diff = top.total_top100_played - myCount;
    return `${firstName} is ahead by ${diff}`;
  })();

  // Achievements footer link sub-line
  const thresholds = [5, 10, 20, 50, 100, 200, 300, 400];
  const unlockedCount = thresholds.filter(t => myCount >= t).length;
  const remainingCount = thresholds.length - unlockedCount;
  const achievementsSubline = `${unlockedCount} unlocked · ${remainingCount} to chase · regional progress`;

  return (
    <div className="w-full max-w-full animate-fade-in pb-8">
      {/* ============ Editorial hero ============ */}
      <div className="px-4 pt-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Your Progress
          </span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
          The Top 100 chase
        </h2>

        {/* Avatar + big stat row */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0' }}>
          <div style={{ position: 'relative' }}>
            <SquircleAvatar
              size={76}
              src={avatarUrl}
              alt={displayName ?? 'You'}
              fallback={initials}
              thinRing
              ringColor="#F7931E"
            />
            {data.club_tier_name && (
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                padding: '3px 7px', borderRadius: 8,
                background: '#0F172A', color: '#F7931E',
                fontSize: 9, fontWeight: 900, letterSpacing: '0.04em',
                border: '2px solid #F8FAFC',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                textTransform: 'uppercase' as const,
              }}>{data.club_tier_name}</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontSize: 44, fontWeight: 900, color: '#F7931E',
                lineHeight: 1, letterSpacing: '-0.04em',
                fontVariantNumeric: 'tabular-nums' as const,
              }}>
                {data.totalTop100Played}
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#64748B' }}>of 100</span>
            </div>
            {formattedLastPlayedShort && (
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={11} /> Last logged {formattedLastPlayedShort}
              </div>
            )}
          </div>
        </div>

        {/* Inline next-milestone progress pill */}
        {data.next_milestone && (
          <button
            type="button"
            onClick={() => navigate('/top100/journey')}
            style={{
              width: '100%', marginTop: 4,
              padding: '12px 14px', borderRadius: 12,
              background: 'rgba(247,147,30,0.05)',
              border: '1px solid rgba(247,147,30,0.18)',
              textAlign: 'left' as const, cursor: 'pointer',
            }}
            className="active:scale-[0.98] transition-transform"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                <span style={{ color: '#c97a10', fontWeight: 800 }}>{data.next_milestone.remaining} more</span>
                {' '}to {data.next_milestone.tierName}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.02em',
                fontVariantNumeric: 'tabular-nums' as const,
              }}>
                {data.totalTop100Played} / {data.next_milestone.threshold}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(15,23,42,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${nextMilestoneProgress}%`,
                background: 'linear-gradient(90deg, #F7931E, #FBBC2E)',
                borderRadius: 3,
              }} />
            </div>
          </button>
        )}
      </div>

      {/* ============ Momentum ============ */}
      <div className="px-4 pt-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Momentum
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', background: '#ffffff',
          border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'rgba(247,147,30,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Flame size={20} color="#F7931E" strokeWidth={2.2} fill="#F7931E" fillOpacity={0.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.015em' }}>
              {streakSummary.monthsCount > 0 ? (
                <>
                  <span style={{ color: '#F7931E', fontVariantNumeric: 'tabular-nums' as const }}>
                    {streakSummary.monthsCount} month{streakSummary.monthsCount === 1 ? '' : 's'}
                  </span>{' '}streak
                </>
              ) : (
                <span style={{ color: '#0F172A' }}>Start a streak</span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
              {streakSummary.subline}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {streakSummary.last6Months.map((m, i) => (
              <div key={i} title={m.label} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: m.logged ? '#F7931E' : 'rgba(15,23,42,0.10)',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ============ Recent rounds ============ */}
      <div className="pt-6">
        <div className="px-4 pb-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
              Recent rounds
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {data.recent_rounds.length > 0
              ? `Your last ${Math.min(data.recent_rounds.length, 5)} Top 100${Math.min(data.recent_rounds.length, 5) === 1 ? '' : 's'}`
              : 'No Top 100 rounds yet'}
          </div>
        </div>
        <style>{`.recent-rounds-row::-webkit-scrollbar { display: none; }`}</style>
        <div
          className="recent-rounds-row flex gap-2.5 px-4 pb-1 overflow-x-auto"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {data.recent_rounds.slice(0, 5).map((round) => (
            <RecentRoundTile
              key={round.course_id}
              round={round}
              onClick={() => navigate(`/courses/${round.course_id}`)}
            />
          ))}
          {/* Add round CTA tile */}
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => navigate('/courses?action=log')}
              style={{
                flex: '0 0 100px', height: 160, borderRadius: 14,
                background: '#ffffff',
                border: '1.5px dashed rgba(15,23,42,0.10)',
                display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
                gap: 8, cursor: 'pointer', padding: 0,
              }}
              className="active:scale-[0.97] transition-transform"
            >
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'rgba(247,147,30,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={18} color="#F7931E" strokeWidth={2.4} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'center' as const, padding: '0 10px' }}>
                Log another round
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ============ Achievements & Mastery link ============ */}
      <div className="px-4 pt-6">
        <button
          type="button"
          onClick={() => navigate('/top100/journey')}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 14,
            background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)',
            cursor: 'pointer',
          }}
          className="active:scale-[0.98] transition-transform"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(15,23,42,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Trophy size={16} color="#475569" strokeWidth={2} />
            </div>
            <div style={{ textAlign: 'left' as const }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>Achievements & Mastery</div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>{achievementsSubline}</div>
            </div>
          </div>
          <ChevronRight size={16} color="#64748B" strokeWidth={2.2} />
        </button>
      </div>

      {/* ============ Friends footer link ============ */}
      {isOwnProfile && topFriends.length > 0 && (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => navigate('/top100/network')}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 14,
              background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)',
              cursor: 'pointer',
            }}
            className="active:scale-[0.98] transition-transform"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {topFriends.slice(0, 3).map((f, i) => {
                  const fInitials =
                    f.display_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                  return (
                    <div
                      key={f.friend_id}
                      style={{
                        marginLeft: i === 0 ? 0 : -8,
                        zIndex: 3 - i,
                        borderRadius: 9,
                        border: '1.5px solid rgba(255,255,255,0.95)',
                        overflow: 'hidden',
                        display: 'inline-flex',
                      }}
                    >
                      <SquircleAvatar
                        size={26}
                        src={f.profile_photo_url}
                        alt={f.display_name ?? 'Friend'}
                        fallback={fInitials}
                        hideRing
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ textAlign: 'left' as const }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{friendMessageShort}</div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>See where your network stands</div>
              </div>
            </div>
            <ChevronRight size={16} color="#64748B" strokeWidth={2.2} />
          </button>
        </div>
      )}

      {/* Unified Achievement Sheet (mounted; sub-page in Phase B drives it) */}
      <UnifiedAchievementSheet
        isOpen={isAchievementSheetOpen}
        onClose={closeAchievementSheet}
        data={achievementSheetData}
      />
    </div>
  );
};

export default Top100MyProgressPanel;

// ============ Local components ============

interface RecentRoundTileProps {
  round: Top100RecentRound;
  onClick: () => void;
}

const RecentRoundTile: React.FC<RecentRoundTileProps> = ({ round, onClick }) => {
  const formattedDate = format(new Date(round.played_at), 'd MMM yyyy');
  const imageUrl = round.image_url || FALLBACK_COURSE_IMAGE;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: '0 0 220px', height: 160, borderRadius: 14, overflow: 'hidden',
        backgroundColor: '#475569',
        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 50%), url(${imageUrl})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', border: 'none', padding: 0, cursor: 'pointer',
        textAlign: 'left' as const,
      }}
      className="active:scale-[0.98] transition-transform"
    >
      {/* Combined rank pill — global + regional */}
      {(round.global_rank || round.regional_rank) && (
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(15,23,42,0.62)', backdropFilter: 'blur(8px)',
            border: '0.5px solid rgba(255,255,255,0.12)',
            padding: '4px 8px', borderRadius: 9999,
            fontSize: 10, fontWeight: 700, color: '#ffffff',
            fontVariantNumeric: 'tabular-nums' as const,
          }}>
            {round.global_rank && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Globe size={9} strokeWidth={2.4} /> #{round.global_rank}
              </span>
            )}
            {round.global_rank && round.regional_rank && (
              <span style={{ width: 1, height: 8, background: 'rgba(255,255,255,0.20)' }} />
            )}
            {round.regional_rank && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* TODO follow-up: swap Globe → FlagChip once Top 100 tab Phase C2 lands */}
                <Globe size={9} strokeWidth={2.4} /> #{round.regional_rank}
              </span>
            )}
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px 10px' }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{round.course_name}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>{formattedDate}</span>
          {round.rating != null && (
            <span style={{
              fontSize: 12, fontWeight: 800, color: '#F7931E',
              fontVariantNumeric: 'tabular-nums' as const,
            }}>{round.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </button>
  );
};

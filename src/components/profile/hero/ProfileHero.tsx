/**
 * ProfileHero - BRIEF_PROFILE_HERO_AND_TOP10 section 1.
 *
 * The personal profile's mounting of the shared HeroShell: identity row, the
 * INDEX headline with its 12-month trend, a 12-month sparkline, and a four-cell
 * counter strip. Geometry, scrim and cover handling live in HeroShell so the
 * business profile cannot drift away from this one (BRIEF_BUSINESS_PROFILE_HERO
 * rule 5).
 *
 * Every figure reuses a hook the page (or the handicap tab) already mounts;
 * no new queries are introduced here.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useWhsConnection, useHandicapTrend, useHandicapHistory } from '@/lib/whs/hooks';
import { useHandicapTrend12mo } from '@/hooks/useHandicapTrend12mo';
import { useProfileClubs } from '@/components/profile/hooks/useProfileClubs';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { HeroShell, HeroPill, W_35, W_40 } from './HeroShell';

const GREEN = INDEX_DELTA.dark.improved;
const RED = INDEX_DELTA.dark.drifted;

const MS_PER_DAY = 86_400_000;

export type HeroStat = 'index' | 'rounds' | 'rated' | 'friends' | 'followers';

interface Props {
  userId: string;
  viewerUserId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  region?: string | null;
  isSelf: boolean;
  /** Resolved index (manual or WHS) as the page already resolves it. */
  indexValue: number | null;
  roundsCount: number | null;
  ratedCount: number | null;
  /** Round 3 §3: social counts from the page's existing realtime hook. */
  friendsCount?: number | null;
  followersCount?: number | null;
  /** Member's own cover/banner photo (user_profiles.header_photo_url). */
  coverUrl?: string | null;
  /** Right-hand control: EDIT pill (own) or the follow/friend set (other). */
  action?: React.ReactNode;
  onAvatarTap?: () => void;
  onStatTap: (stat: HeroStat) => void;
}

function formatIndex(v: number): string {
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}

const Sparkline: React.FC<{ points: number[] }> = ({ points }) => {
  const H = 42;
  const W = 100; // viewBox units; stretched to full width
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * W;
    // Lower index is better, but the line simply tracks the value.
    const y = 4 + (1 - (p - min) / span) * (H - 8);
    return [x, y] as const;
  });
  const d = coords.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const last = coords[coords.length - 1];

  // Correction 2: preserveAspectRatio="none" stretched the end marker into a
  // blob. The line keeps the stretch; the marker is a CSS-positioned dot laid
  // over the svg's final point, so it stays perfectly round at any width.
  return (
    <div style={{ position: 'relative', marginTop: 10, height: H }}>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <polyline
          points={d}
          fill="none"
          stroke={W_35}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: `${last[0]}%`,
          top: last[1],
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          borderRadius: 999,
          background: '#FFFFFF',
        }}
      />
    </div>
  );
};

export const ProfileHero: React.FC<Props> = ({
  userId,
  viewerUserId,
  displayName,
  avatarUrl,
  region,
  isSelf: _isSelf,
  indexValue,
  roundsCount,
  ratedCount,
  friendsCount,
  followersCount,
  coverUrl,
  action,
  onAvatarTap,
  onStatTap,
}) => {
  const { t } = useTranslation('profile');
  const { data: connection } = useWhsConnection(userId);
  const { data: trend } = useHandicapTrend(connection?.id);
  const trend12 = useHandicapTrend12mo(connection?.id);
  const { data: history } = useHandicapHistory(connection?.id, 'all');
  const { homeClub } = useProfileClubs(userId, viewerUserId ?? undefined);
  const { topTen } = useUserTopTenCourses(userId);

  // Fallback chain: (1) own cover, (2) the #1 Top 10 course image,
  // (3) flat INK - handled by the section background itself.
  const topCourse = React.useMemo(
    () => [...(topTen ?? [])].sort((a, b) => a.position - b.position)[0] ?? null,
    [topTen],
  );
  const cover = coverUrl || topCourse?.thumbnail_image || null;

  const series = React.useMemo(() => {
    if (!history || history.length < 2) return [];
    const cutoff = Date.now() - 365 * MS_PER_DAY;
    const recent = history.filter(
      (p) => new Date(p.observed_at).getTime() >= cutoff,
    );
    const use = recent.length >= 2 ? recent : history;
    return use
      .map((p) => Number(p.handicap_index))
      .filter((n) => Number.isFinite(n));
  }, [history]);

  const shownIndex = indexValue ?? trend?.current ?? null;
  const subline = [homeClub?.name, region].filter(Boolean).join(' \u00B7 ');

  const tap = (stat: HeroStat) => () => {
    analyticsEvents.track('profile_hero_stat_tap', { stat });
    onStatTap(stat);
  };

  // Short window = 90 DAYS, derived here from the `history` this component
  // already fetches (same technique as useHandicapTrend12mo) — fetchHandicapTrend's
  // own 30-day window is left alone so its other consumers do not shift.
  // It carries its OWN, higher noise floor than trend12's 0.05: measured over
  // every long snapshot pair on record (n=30 windows spanning 60+ days, the
  // longest history available is ~86 days) median |move| 0.40, p75 0.50, 27%
  // under 0.25. 0.2 suppresses routine ±0.1 recalculation churn and passes the
  // median and everything above it. trend12 keeps its floor — 12 months works.
  const SHORT_FLOOR = 0.2;
  const SHORT_TARGET_DAYS = 90;
  const SHORT_MIN_HISTORY_DAYS = 75;

  const shortDelta = React.useMemo<number | null>(() => {
    const current = indexValue ?? trend?.current ?? null;
    if (current == null || !history || history.length === 0) return null;
    const now = Date.now();
    const earliest = new Date(history[0].observed_at).getTime();
    if (now - earliest < SHORT_MIN_HISTORY_DAYS * MS_PER_DAY) return null;
    const target = now - SHORT_TARGET_DAYS * MS_PER_DAY;
    let closest = history[0];
    let best = Math.abs(new Date(closest.observed_at).getTime() - target);
    for (const pt of history) {
      const diff = Math.abs(new Date(pt.observed_at).getTime() - target);
      if (diff < best) {
        closest = pt;
        best = diff;
      }
    }
    const past = Number(closest.handicap_index);
    if (!Number.isFinite(past)) return null;
    return Math.round((current - past) * 10) / 10;
  }, [history, indexValue, trend]);

  const shortDirection: 'down' | 'up' | 'flat' =
    shortDelta == null
      ? 'flat'
      : shortDelta < -SHORT_FLOOR
        ? 'down'
        : shortDelta > SHORT_FLOOR
          ? 'up'
          : 'flat';


  const delta = trend12.delta;
  const improved = trend12.direction === 'down';
  const drifted = trend12.direction === 'up';

  // One line per available window. Absent data = no line at all (no gap);
  // present-but-trivial movement = a dim "Level" line, never a coloured arrow.
  const deltaLines: Array<{
    key: string;
    delta: number;
    direction: 'down' | 'up' | 'flat';
    window: string;
  }> = [];
  if (shortDelta != null) {
    deltaLines.push({
      key: 'short',
      delta: shortDelta,
      direction: shortDirection,
      window: t('hero.window90d', '90 days'),
    });
  }
  if (delta != null) {
    deltaLines.push({
      key: 'long',
      delta,
      direction: improved ? 'down' : drifted ? 'up' : 'flat',
      window: t('hero.window12mo', '12 months'),
    });
  }


  return (
    <HeroShell
      coverUrl={cover}
      onAvatarTap={onAvatarTap}
      avatarLabel={displayName}
      avatar={
        <SquircleAvatar
          size={52}
          src={avatarUrl ?? undefined}
          alt={displayName}
          userId={userId}
          hideRing
          className="w-full h-full"
        />
      }
      displayName={displayName}
      subline={subline || null}
      action={action}
      headline={
        shownIndex == null
          ? null
          : {
              label: t('hero.handicapIndex', 'Handicap index'),
              ariaLabel: t('hero.handicapIndex', 'Handicap index'),
              value: formatIndex(shownIndex),
              onTap: tap('index'),
              aside:
                deltaLines.length > 0 ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 3,
                      paddingBottom: 3,
                      fontFamily: SANS,
                    }}
                  >
                    {deltaLines.map((l) => {
                      const up = l.direction === 'up';
                      const down = l.direction === 'down';
                      return (
                        <span
                          key={l.key}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'baseline',
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 700,
                            ...FIGS,
                          }}
                        >
                          <span
                            style={{ color: down ? GREEN : up ? RED : W_40 }}
                          >
                            {down || up
                              ? `${down ? '\u2193' : '\u2191'} ${Math.abs(l.delta).toFixed(1)}`
                              : t('hero.trendLevel', 'Level')}
                          </span>
                          <span
                            style={{
                              color: W_40,
                              fontSize: 7.5,
                              fontWeight: 700,
                              letterSpacing: '0.16em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {l.window}
                          </span>
                        </span>
                      );
                    })}
                  </span>
                ) : undefined,

              below: <Sparkline points={series} />,
            }
      }
      counters={[
        { key: 'rounds', label: t('hero.rounds', 'Rounds'), value: roundsCount, onTap: tap('rounds') },
        { key: 'rated', label: t('hero.rated', 'Rated'), value: ratedCount, onTap: tap('rated') },
        { key: 'friends', label: t('hero.friends', 'Friends'), value: friendsCount ?? null, onTap: tap('friends') },
        { key: 'followers', label: t('hero.followers', 'Followers'), value: followersCount ?? null, onTap: tap('followers') },
      ]}
    />
  );
};

export { HeroPill };

export default ProfileHero;

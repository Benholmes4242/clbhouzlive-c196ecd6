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
import { analyticsEvents } from '@/utils/analyticsEvents';
import { HeroShell, HeroPill, W_35, W_40 } from './HeroShell';

const GREEN = '#4ADE80';
const RED = '#F87171';

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

  // Short window (30 days, per fetchHandicapTrend) gets its OWN, higher noise
  // floor. Measured across every rolling 30-day snapshot pair on record
  // (n=35 windows): median |move| 0.30, p75 0.40, 37% of windows under 0.15.
  // 0.2 suppresses the routine ±0.1 recalculation churn and passes the median
  // and everything above it. trend12 keeps its 0.05 floor — 12 months works.
  const SHORT_FLOOR = 0.2;

  const shortDeltaRaw = trend?.delta ?? null;
  const shortDelta =
    shortDeltaRaw == null ? null : Math.round(shortDeltaRaw * 10) / 10;
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
      window: t('hero.window30d', '30 days'),
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
                delta != null && (improved || drifted) ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: 5,
                      paddingBottom: 3,
                      fontSize: 11.5,
                      fontWeight: 800,
                      fontFamily: SANS,
                      ...FIGS,
                    }}
                  >
                    <span style={{ color: improved ? GREEN : RED }}>
                      {improved ? '\u2193' : '\u2191'} {Math.abs(delta).toFixed(1)}
                    </span>
                    <span style={{ color: W_40, fontWeight: 600 }}>
                      {t('hero.trendWindow', '12mo')}
                    </span>
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

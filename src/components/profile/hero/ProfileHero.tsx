/**
 * ProfileHero - BRIEF_PROFILE_HERO_AND_TOP10 section 1.
 *
 * One dark block (INK #0E1216) replacing six stacked light elements on the
 * personal profile: identity row, the INDEX headline with its 12-month trend,
 * a 12-month sparkline, and a four-cell counter strip.
 *
 * This is the app's ONLY dark block outside media chrome - a deliberate
 * exception to the light-only rule. Do not copy it elsewhere.
 *
 * Every figure reuses a hook the page (or the handicap tab) already mounts;
 * no new queries are introduced here.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useWhsConnection, useHandicapTrend, useHandicapHistory } from '@/lib/whs/hooks';
import { useHandicapTrend12mo } from '@/hooks/useHandicapTrend12mo';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { useProfileClubs } from '@/components/profile/hooks/useProfileClubs';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';

const HERO_INK = A.INK;
const W_45 = 'rgba(255,255,255,0.45)';
const W_55 = 'rgba(255,255,255,0.55)';
const W_40 = 'rgba(255,255,255,0.40)';
const W_35 = 'rgba(255,255,255,0.35)';
const W_25 = 'rgba(255,255,255,0.25)';
const W_12 = 'rgba(255,255,255,0.12)';
const W_10 = 'rgba(255,255,255,0.10)';
const GREEN = '#4ADE80';
const RED = '#F87171';

const MS_PER_DAY = 86_400_000;

export type HeroStat = 'index' | 'rounds' | 'rated' | 'friends' | 'followers';

/** Round 3 §2: scrim comes down a touch. Flat wash, then vertical ramp.
 *  If the index or counters ever lose contrast on a bright cover, DEEPEN
 *  these again - never lighten the text. */
const COVER_WASH = 'rgba(14,18,22,0.58)';
const COVER_RAMP =
  'linear-gradient(180deg, rgba(14,18,22,0.42) 0%, rgba(14,18,22,0.80) 100%)';

/** Round 3 §1: the hero starts BENEATH the floating islands - safe-area inset
 *  + island row (top offset 10 + ISLAND_H 44) + 8px - so both islands sit on
 *  plain canvas rather than on the photograph. */
const HERO_TOP_OFFSET =
  'calc(var(--sat, env(safe-area-inset-top, 0px)) + 62px)';

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
  coursesCount: number | null;
  ratedCount: number | null;
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


const Cell: React.FC<{
  label: string;
  value: number | null;
  onTap?: () => void;
}> = ({ label, value, onTap }) => {
  const inert = !onTap;
  return (
    <button
      type="button"
      onClick={(e) => {
        // Round 3 §3: FRIENDS/FOLLOWERS must never bubble into the hero or
        // index handicap tap.
        e.stopPropagation();
        onTap?.();
      }}
      disabled={inert}
      onPointerDown={(e) => { e.currentTarget.style.opacity = '0.72'; }}
      onPointerUp={(e) => { e.currentTarget.style.opacity = '1'; }}
      onPointerLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      style={{
        flex: 1,
        minWidth: 0,
        background: 'transparent',
        border: 'none',
        padding: 0,
        textAlign: 'center',
        cursor: inert ? 'default' : 'pointer',
        fontFamily: SANS,
        transition: 'opacity 120ms ease',
      }}
    >

      <div
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: '#FFFFFF',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          ...FIGS,
        }}
      >
        {value == null ? '\u2014' : value.toLocaleString()}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 7.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: W_45,
        }}
      >
        {label}
      </div>
    </button>
  );
};

export const ProfileHero: React.FC<Props> = ({
  userId,
  viewerUserId,
  displayName,
  avatarUrl,
  region,
  isSelf,
  indexValue,
  roundsCount,
  coursesCount,
  ratedCount,
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
  const { data: achievements } = useUserAchievements(userId);
  const { homeClub } = useProfileClubs(userId, viewerUserId ?? undefined);
  const { topTen } = useUserTopTenCourses(userId);

  // Fallback chain: (1) own cover, (2) the #1 Top 10 course image,
  // (3) flat INK - handled by the section background itself.
  const topCourse = React.useMemo(
    () => [...(topTen ?? [])].sort((a, b) => a.position - b.position)[0] ?? null,
    [topTen],
  );
  const cover = coverUrl || topCourse?.thumbnail_image || null;
  const [coverBroken, setCoverBroken] = React.useState(false);
  React.useEffect(() => setCoverBroken(false), [cover]);
  const showCover = !!cover && !coverBroken;

  const trophiesCount = React.useMemo(() => {
    if (!achievements) return null;
    return achievements.filter((b) => b.is_earned).length;
  }, [achievements]);

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

  const delta = trend12.delta;
  const improved = trend12.direction === 'down';
  const drifted = trend12.direction === 'up';

  return (
    <section
      style={{
        position: 'relative',
        background: HERO_INK,
        padding: '18px 16px 16px',
        fontFamily: SANS,
        color: '#FFFFFF',
        isolation: 'isolate',
      }}
    >
      {/* Cover photograph under a heavy scrim - decoration only, never a
          control, and it never changes the height of the block. */}
      {showCover && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <img
            src={cover as string}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setCoverBroken(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: COVER_WASH }} />
          <div style={{ position: 'absolute', inset: 0, background: COVER_RAMP }} />
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* 1a. Identity row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={onAvatarTap}
          disabled={!onAvatarTap}
          aria-label={displayName}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            flexShrink: 0,
            borderRadius: 16,
            cursor: onAvatarTap ? 'pointer' : 'default',
            lineHeight: 0,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              overflow: 'hidden',
              border: `2px solid ${W_12}`,
            }}
          >
            <SquircleAvatar
              size={52}
              src={avatarUrl ?? undefined}
              alt={displayName}
              userId={userId}
              hideRing
              className="w-full h-full"
            />

          </div>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </h1>
          {subline && (
            <div
              style={{
                marginTop: 3,
                fontSize: 11.5,
                fontWeight: 600,
                color: W_55,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subline}
            </div>
          )}
        </div>

        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>

      {/* 1b. The index */}
      {shownIndex != null && (
        <button
          type="button"
          onClick={tap('index')}
          aria-label={t('hero.handicapIndex', 'Handicap index')}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 18,
            padding: 0,
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            color: 'inherit',
            fontFamily: SANS,
            cursor: 'pointer',
            transition: 'opacity 120ms ease',
          }}
          onPointerDown={(e) => { e.currentTarget.style.opacity = '0.72'; }}
          onPointerUp={(e) => { e.currentTarget.style.opacity = '1'; }}
          onPointerLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: W_45,
            }}
          >
            {t('hero.handicapIndex', 'Handicap index')}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 4 }}>
            <span
              style={{
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: '#FFFFFF',
                ...FIGS,
              }}
            >
              {formatIndex(shownIndex)}
            </span>
            {delta != null && (improved || drifted) && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 5,
                  paddingBottom: 3,
                  fontSize: 11.5,
                  fontWeight: 800,
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
            )}
          </div>

          {/* 1c. Sparkline */}
          <Sparkline points={series} />
        </button>
      )}

      {/* 1d. Counter strip */}
      <div
        style={{
          marginTop: 14,
          borderTop: `1px solid ${W_10}`,
          paddingTop: 13,
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <Cell
          label={t('hero.rounds', 'Rounds')}
          value={roundsCount}
          onTap={tap('rounds')}
        />
        <Cell
          label={t('hero.rated', 'Rated')}
          value={ratedCount}
          onTap={tap('rated')}
        />
        <Cell
          label={t('hero.friends', 'Friends')}
          value={friendsCount ?? null}
          onTap={tap('friends')}
        />
        <Cell
          label={t('hero.followers', 'Followers')}
          value={followersCount ?? null}
          onTap={tap('followers')}
        />
      </div>

      </div>
    </section>
  );
};

/** The EDIT pill (own profile) and the shell for other-member controls. */
export const HeroPill: React.FC<{
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ label, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      background: 'transparent',
      border: `1px solid ${W_25}`,
      borderRadius: 999,
      color: '#FFFFFF',
      fontFamily: SANS,
      fontSize: 8,
      fontWeight: 800,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      padding: '9px 14px',
      minHeight: 34,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

export default ProfileHero;

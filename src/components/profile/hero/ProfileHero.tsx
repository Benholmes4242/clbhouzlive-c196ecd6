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

export type HeroStat = 'rounds' | 'courses' | 'rated' | 'trophies';

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

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block', marginTop: 10 }}
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
      <circle cx={last[0]} cy={last[1]} r={3} fill="#FFFFFF" vectorEffect="non-scaling-stroke" />
    </svg>
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
      onClick={onTap}
      disabled={inert}
      style={{
        flex: 1,
        minWidth: 0,
        background: 'transparent',
        border: 'none',
        padding: 0,
        textAlign: 'center',
        cursor: inert ? 'default' : 'pointer',
        fontFamily: SANS,
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
        background: HERO_INK,
        padding: '18px 16px 16px',
        fontFamily: SANS,
        color: '#FFFFFF',
      }}
    >
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
        <div style={{ marginTop: 18 }}>
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
        </div>
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
          label={t('hero.courses', 'Courses')}
          value={coursesCount}
          onTap={tap('courses')}
        />
        <Cell
          label={t('hero.rated', 'Rated')}
          value={ratedCount}
          onTap={tap('rated')}
        />
        <Cell
          label={t('hero.trophies', 'Trophies')}
          value={trophiesCount}
          onTap={tap('trophies')}
        />
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

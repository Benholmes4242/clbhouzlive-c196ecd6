/**
 * TheClass - full alumni roster.
 *
 * Analytical grammar (BRIEF_TOUR_COLLEGE_PROFILE):
 *   - INK kicker (eyebrows are never amber) with right-hand alumni count aside.
 *   - Sorted purely by season earnings desc, so the "#" numeral IS the
 *     earnings rank. The old star-first sort is gone.
 *   - Sub-line carries season facts (World {n} . {n} wins . {n} events),
 *     each segment omitted when absent. No this-week duplication.
 *   - No champion tint, no crown chip, no per-row SEASON label, no
 *     placeholder tour chip, no row hairlines, no chevron.
 *
 * Country flags use the single app-wide CountryFlag (SVG) system
 * (BRIEF_TOUR_FLAGS_ONE_SYSTEM).
 */

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { formatEarnings } from '@/features/tourhub/_shared/formatEarnings';
import CountryFlag from '@/components/ui/country-flag';
import { playerRoute } from '@/features/tourhub/routes';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useLivePlayerIds } from '@/features/tourhub/players-v2/data/useLivePlayerIds';
import {
  FONT,
  INK,
  INK_FAINT,
  INK_MUTE,
  STATUS_LIVE,
  SURFACE, SLATE_50 } from '@/features/tourhub/_shared/tokens';
import { useCollegeRoster } from '../data/useCollegeRoster';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  slug: string;
  collegeName: string;
}

const KICKER_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: INK,
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: INK_FAINT,
  fontVariantNumeric: 'tabular-nums lining-nums',
};

const DOT = ' \u00B7 ';

export function TheClass({ slug, collegeName }: Props) {
  const { t } = useTranslation('tourhub');
  const { data: roster = [], isLoading, isError, refetch } = useCollegeRoster(slug);
  const { data: liveMap = {} } = useLivePlayerIds();

  const sorted = [...roster].sort((a, b) => b.earnings - a.earnings);

  return (
    <section style={{ background: SURFACE, fontFamily: FONT }}>
      {/* Section head */}
      <header
        style={{
          padding: '16px 16px 12px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={KICKER_STYLE}>{t('college.profile.theClass')}</div>
        <div style={LABEL_STYLE}>
          {t('college.profile.alumniAside', { count: sorted.length })}
        </div>
      </header>

      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px' }}>
        <span style={{ ...LABEL_STYLE, width: 22, flex: '0 0 22px' }}>
          {t('college.profile.colRank')}
        </span>
        <span style={{ ...LABEL_STYLE, flex: 1, marginLeft: 8 }}>
          {t('college.profile.colPlayer')}
        </span>
        <span style={{ ...LABEL_STYLE, width: 78, flex: '0 0 78px', textAlign: 'right' }}>
          {t('college.profile.colEarnings')}
        </span>
      </div>

      {/* Skeleton */}
      {isLoading && (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
              }}
            >
              <Skeleton style={{ width: 22, height: 12, borderRadius: 3 }} />
              <Skeleton style={{ width: 34, height: 34, borderRadius: '34%' }} />
              <Skeleton style={{ flex: 1, height: 12, borderRadius: 3 }} />
              <Skeleton style={{ width: 78, height: 12, borderRadius: 3 }} />
            </div>
          ))}
        </>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: INK_FAINT, marginBottom: 10 }}>
            {t('college.profile.rosterError')}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            style={{ background: INK, color: SLATE_50, border: 'none', borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {t('college.profile.rosterRetry')}
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && sorted.length === 0 && (
        <div style={{ padding: '32px 16px', fontSize: 12, fontWeight: 600, color: INK_FAINT, textAlign: 'center' }}>
          {t('college.profile.rosterEmpty')}
        </div>
      )}

      {!isLoading && !isError &&
        sorted.map((a, idx) => {
          const live = liveMap[a.id];
          const hasEarnings = (a.earnings ?? 0) > 0;
          

          const segments: string[] = [];
          if (a.worldRanking && a.worldRanking > 0) {
            segments.push(t('college.profile.worldRank', { rank: a.worldRanking }));
          }
          if ((a.wins ?? 0) > 0) {
            segments.push(t('college.profile.wins', { count: a.wins }));
          }
          if ((a.eventsPlayed ?? 0) > 0) {
            segments.push(t('college.profile.events', { count: a.eventsPlayed }));
          }
          const subline = segments.length > 0 ? segments.join(DOT) : null;

          return (
            <Link
              key={a.id}
              {...playerRoute(a.id, { kind: 'college', collegeName })}
              onClick={() => {
                analyticsEvents.track('tour_college_class_row_tapped', {
                  slug,
                  player_id: a.id,
                  rank: idx + 1,
                  is_live: !!live,
                  has_earnings: hasEarnings,
                });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: 'transparent',
                textDecoration: 'none',
                color: 'inherit',
              }}
              className="active:bg-black/[0.02]"
            >
              <span
                style={{
                  width: 22,
                  flex: '0 0 22px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: INK_MUTE,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  letterSpacing: '-0.01em',
                }}
              >
                {idx + 1}
              </span>

              {/* Avatar + live dot */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <SquircleAvatar
                  size={34}
                  srcCandidates={getPlayerHeadshotCandidates(a.fullName, a.tourCodes?.[0] ?? 'pga')}
                  alt={a.fullName}
                  hairlineRing
                  ringColor="rgba(255,255,255,0.18)"
                />
                {live && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: STATUS_LIVE,
                      boxShadow: '0 0 0 1.5px #FFFFFF',
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                    letterSpacing: '-0.005em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    {a.fullName}
                  </span>
                  {a.country && (
                    <span style={{ lineHeight: 1, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
                      <CountryFlag country={a.country} size="sm" />
                    </span>
                  )}
                </div>
                {subline && (
                  <div
                    style={{
                      marginTop: 1,
                      fontSize: 11,
                      fontWeight: 600,
                      color: INK_MUTE,
                      letterSpacing: '0.02em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    {subline}
                  </div>
                )}
              </div>

              {/* Earnings */}
              <div style={{ width: 78, flex: '0 0 78px', textAlign: 'right' }}>
                {hasEarnings && (
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: INK,
                      fontVariantNumeric: 'tabular-nums lining-nums',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {formatEarnings(a.earnings)}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
    </section>
  );
}

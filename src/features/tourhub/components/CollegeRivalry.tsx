/**
 * CollegeRivalry — Tour Hub Overview college section (Phase F).
 *
 * Renders this week's #1 vs #2 college rivalry from LIVE earnings data, with
 * a top-5 standings rail beneath. All copy + standings derive from live data;
 * COLLEGE_RIVALRY_FALLBACK is safety-only and only renders if data is empty.
 *
 * Headline rules:
 * - gap < $5M     → two-line "{Leader} leads. / {Chaser} is closing."
 * - gap >= $5M    → single-line "{Leader} runs away with it."
 * - DB editorial row (championship_editorial_daily, surface='college_rivalry')
 *   overrides computed copy when available.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../hooks/useCollegeMedia';
import { useFranchiseCaptains } from '../hooks/useFranchiseCaptains';
import { useDailyEditorial } from '@/hooks/championship/useDailyEditorial';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { COLLEGE_RIVALRY_FALLBACK } from '../utils/editorialFallbacks';

const AMBER = '#F7931E';
const AMBER_INK = '#D97706';
const INK = '#0F172A';
const SLATE = '#94A3B8';
const SLATE_LIGHT = '#CBD5E1';
const SLATE_BG = '#F8FAFC';
const SLATE_ALPHA = 'rgba(15,23,42,0.08)';
const HAIRLINE = 'rgba(15,23,42,0.07)';

function displayName(stats: CollegeSeasonStats, media: CollegeMedia | undefined): string {
  return media?.short_name || media?.college_name || stats.normalized_name;
}

function fullName(stats: CollegeSeasonStats, media: CollegeMedia | undefined): string {
  return media?.college_name || stats.normalized_name;
}

function abbreviateName(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length < 2) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

// ============================================================================
// SKELETON
// ============================================================================
function CollegeRivalrySkeleton() {
  return (
    <section aria-label="College rivalry" style={{ padding: '0 16px' }}>
      <div style={{ height: 14, width: 240, background: SLATE_BG, borderRadius: 6, marginBottom: 16 }} />
      <div style={{ height: 280, background: '#fff', border: `1px solid ${SLATE_ALPHA}`, borderRadius: 18, marginBottom: 12 }} />
      <div style={{ height: 220, background: '#fff', border: `1px solid ${SLATE_ALPHA}`, borderRadius: 14 }} />
    </section>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function CollegeRivalry() {
  const navigate = useNavigate();
  const { data: collegeStats, isLoading } = useCollegeSeasonStats();
  const { data: mediaMap } = useCollegeMediaMap();
  const editorial = useDailyEditorial({
    surface: 'college_rivalry',
    seasonId: null,
    timeFilter: 'all_time',
  });

  // Sort by earnings desc — leader, chaser, top-5 derive from this
  const sorted = useMemo(() => {
    if (!collegeStats) return [];
    return [...collegeStats].sort((a, b) => b.earnings_total - a.earnings_total);
  }, [collegeStats]);

  const leader = sorted[0];
  const chaser = sorted[1];
  const top5 = sorted.slice(0, 5);

  const leaderMedia = leader ? mediaMap?.get(leader.normalized_name) : undefined;
  const chaserMedia = chaser ? mediaMap?.get(chaser.normalized_name) : undefined;

  const leaderShort = leader ? displayName(leader, leaderMedia) : '—';
  const chaserShort = chaser ? displayName(chaser, chaserMedia) : '—';
  const leaderFull = leader ? fullName(leader, leaderMedia) : '';
  const chaserFull = chaser ? fullName(chaser, chaserMedia) : '';

  const gap = leader && chaser ? leader.earnings_total - chaser.earnings_total : 0;
  const isClosingRace = gap > 0 && gap < 5_000_000;

  // Captains for top-2 (full names so useFranchiseCaptains query matches college_normalized)
  const captainNames = useMemo(
    () => [leader?.normalized_name, chaser?.normalized_name].filter((n): n is string => !!n),
    [leader, chaser]
  );
  const { data: captainMap } = useFranchiseCaptains(captainNames);

  const leaderCaptain = leader ? captainMap?.get(leader.normalized_name) : undefined;
  const chaserCaptain = chaser ? captainMap?.get(chaser.normalized_name) : undefined;

  // Editorial DB > live-derived > generic fallback
  const eyebrow = editorial.data?.eyebrow ?? COLLEGE_RIVALRY_FALLBACK.eyebrow;

  const headline = useMemo(() => {
    if (editorial.data?.headline) {
      return {
        line1: editorial.data.headline,
        line2: editorial.data.headlineTwo || null,
      };
    }
    if (!leader) {
      return { line1: COLLEGE_RIVALRY_FALLBACK.headlineLine1, line2: COLLEGE_RIVALRY_FALLBACK.headlineLine2 };
    }
    if (!chaser || !isClosingRace) {
      return { line1: `${leaderShort} runs away with it.`, line2: null };
    }
    return {
      line1: `${leaderShort} leads.`,
      line2: `${chaserShort} is closing.`,
    };
  }, [editorial.data, leader, chaser, isClosingRace, leaderShort, chaserShort]);

  const marginLabel = gap > 0 ? `−${formatCurrency(gap)}` : COLLEGE_RIVALRY_FALLBACK.marginLabel;

  const currentYear = new Date().getFullYear();

  if (isLoading) return <CollegeRivalrySkeleton />;
  if (!leader) return null;

  const leaderLogo = getCollegeLogoUrl(leaderFull);
  const chaserLogo = getCollegeLogoUrl(chaserFull);

  return (
    <section aria-label="This week's college rivalry">
      {/* Section eyebrow */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 14, background: INK, borderRadius: 1 }} />
          <div>
            <div style={{
              fontSize: 9, fontWeight: 900, color: INK,
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
              College Rivalry
            </div>
            <div style={{ fontSize: 11, color: SLATE, marginTop: 2 }}>
              Where college legacies compete on tour · {currentYear} Season
            </div>
          </div>
        </div>
      </div>

      {/* Rivalry hero card */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div
          style={{
            background: '#fff',
            border: `1px solid ${SLATE_ALPHA}`,
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
          }}
        >
          {/* Eyebrow + headline */}
          <div style={{ padding: '18px 18px 16px' }}>
            <div style={{
              fontSize: 10, fontWeight: 900, color: AMBER_INK,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              {eyebrow}
            </div>
            <h2 style={{
              fontSize: 22, fontWeight: 900, lineHeight: 1.15,
              letterSpacing: '-0.6px', margin: 0,
            }}>
              <span style={{ color: INK }}>{headline.line1}</span>
              {headline.line2 && (
                <>
                  <br />
                  <span style={{ color: AMBER_INK }}>{headline.line2}</span>
                </>
              )}
            </h2>
          </div>

          {/* Versus block */}
          <div style={{ padding: '0 14px 14px' }}>
            <div
              style={{
                background: SLATE_BG,
                borderRadius: 14,
                padding: '14px 12px',
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {/* Leader */}
              <button
                onClick={() => navigate(`/tourhub/college-golf/${leader.normalized_name}`)}
                style={{
                  background: 'transparent', border: 'none', padding: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  cursor: 'pointer',
                }}
              >
                {leaderLogo && (
                  <img
                    src={leaderLogo}
                    alt={leaderShort}
                    style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div style={{ fontSize: 13, fontWeight: 800, color: INK, letterSpacing: '-0.2px' }}>
                  {leaderShort}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: AMBER_INK, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.3px' }}>
                  {formatCurrency(leader.earnings_total)}
                </div>
                <div style={{ fontSize: 9, fontWeight: 800, color: SLATE, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {leader.wins_total} {leader.wins_total === 1 ? 'WIN' : 'WINS'} · {leader.player_count} ON TOUR
                </div>
              </button>

              {/* VS divider */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  fontSize: 11, fontWeight: 900, color: SLATE_LIGHT,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                }}>
                  VS
                </div>
                <div style={{
                  background: 'rgba(247,147,30,0.12)',
                  color: AMBER_INK,
                  fontSize: 10, fontWeight: 900,
                  padding: '4px 8px',
                  borderRadius: 999,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.2px',
                  whiteSpace: 'nowrap',
                }}>
                  {marginLabel}
                </div>
              </div>

              {/* Chaser */}
              {chaser ? (
                <button
                  onClick={() => navigate(`/tourhub/college-golf/${chaser.normalized_name}`)}
                  style={{
                    background: 'transparent', border: 'none', padding: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  {chaserLogo && (
                    <img
                      src={chaserLogo}
                      alt={chaserShort}
                      style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div style={{ fontSize: 13, fontWeight: 800, color: INK, letterSpacing: '-0.2px' }}>
                    {chaserShort}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.3px' }}>
                    {formatCurrency(chaser.earnings_total)}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: SLATE, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {chaser.wins_total} {chaser.wins_total === 1 ? 'WIN' : 'WINS'} · {chaser.player_count} ON TOUR
                  </div>
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>

          {/* Captains row */}
          {(leaderCaptain || chaserCaptain) && (
            <div
              style={{
                borderTop: `0.5px solid ${HAIRLINE}`,
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1px 1fr',
                gap: 12,
                alignItems: 'center',
              }}
            >
              {/* Leader captain */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SquircleAvatar
                  size={32}
                  src={leaderCaptain ? getPlayerHeadshotUrl(leaderCaptain.fullName, leaderCaptain.tourCode) : PLAYER_SILHOUETTE_URL}
                  alt={leaderCaptain?.fullName ?? '—'}
                  hideRing
                  fallback={leaderCaptain?.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '—'}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 8, fontWeight: 900, color: SLATE,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                  }}>
                    {leaderShort} CAPTAIN
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: INK,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {leaderCaptain ? abbreviateName(leaderCaptain.fullName) : '—'}
                  </div>
                </div>
              </div>

              {/* Vertical divider */}
              <div style={{ background: HAIRLINE, height: 36, width: 1 }} />

              {/* Chaser captain */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                <div style={{ minWidth: 0, textAlign: 'right' }}>
                  <div style={{
                    fontSize: 8, fontWeight: 900, color: SLATE,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                  }}>
                    {chaserShort} CAPTAIN
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: INK,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {chaserCaptain ? abbreviateName(chaserCaptain.fullName) : '—'}
                  </div>
                </div>
                <SquircleAvatar
                  size={32}
                  src={chaserCaptain ? getPlayerHeadshotUrl(chaserCaptain.fullName, chaserCaptain.tourCode) : PLAYER_SILHOUETTE_URL}
                  alt={chaserCaptain?.fullName ?? '—'}
                  hideRing
                  fallback={chaserCaptain?.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '—'}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Standings rail */}
      {top5.length > 0 && (
        <div style={{ padding: '0 16px' }}>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${SLATE_ALPHA}`,
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
            }}
          >
            {/* Standings header */}
            <div
              style={{
                background: SLATE_BG,
                padding: '8px 14px',
                fontSize: 10, fontWeight: 800, color: SLATE,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span>Standings</span>
              <span style={{ fontSize: 9, color: SLATE_LIGHT, letterSpacing: '0.08em' }}>
                Top 5 · Earnings on Tour
              </span>
            </div>

            {top5.map((stats, i) => {
              const media = mediaMap?.get(stats.normalized_name);
              const name = displayName(stats, media);
              const logo = getCollegeLogoUrl(fullName(stats, media));
              const rank = i + 1;
              const isLeader = rank === 1;

              return (
                <button
                  key={stats.id}
                  onClick={() => navigate(`/tourhub/college-golf/${stats.normalized_name}`)}
                  style={{
                    width: '100%',
                    background: isLeader ? 'linear-gradient(90deg, rgba(247,147,30,0.08) 0%, rgba(247,147,30,0) 100%)' : 'transparent',
                    border: 'none',
                    borderBottom: i < top5.length - 1 ? `0.5px solid ${HAIRLINE}` : 'none',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      fontSize: 16,
                      fontWeight: 900,
                      color: isLeader ? AMBER : 'rgba(15,23,42,0.18)',
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                    }}
                  >
                    {rank}
                  </span>
                  {logo ? (
                    <img
                      src={logo}
                      alt={name}
                      style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: 28, height: 28, flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: 700,
                      color: INK,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {name}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: isLeader ? AMBER_INK : INK,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-0.2px',
                      flexShrink: 0,
                    }}
                  >
                    {formatCurrency(stats.earnings_total)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

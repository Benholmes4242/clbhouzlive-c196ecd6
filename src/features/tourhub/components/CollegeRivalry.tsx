/**
 * CollegeRivalry — Tour Hub Overview college section (Phase F).
 *
 * Renders this week's #1 vs #2 college rivalry from LIVE earnings data, with
 * a top-5 standings list beneath. Standings render on the bare page background
 * (hairline dividers + tier-accent for rank #1) — the matchup card is the
 * section's hero, the standings are the list, matching the broader
 * "card for hero, bare for list" pattern across Tour Hub Overview.
 *
 * Headline rules:
 * - gap < $5M     → two-line "{Leader} leads. / {Chaser} is closing."
 * - gap >= $5M    → single-line "{Leader} runs away with it."
 * - DB editorial row (championship_editorial_daily, surface='college_rivalry')
 *   overrides computed copy when available.
 *
 * Eyebrow rules (when no DB editorial override present):
 * - gap < $5M  → "🥊 CLOSEST RACE THIS WEEK"
 * - gap >= $5M → "🥊 TIGHTEST AT THE TOP"
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
import { SectionHeader } from './shared/SectionHeader';

const AMBER = '#F7931E';
const AMBER_INK = '#D97706';
const AMBER_SOFT_BG = 'rgba(247,147,30,0.08)';
const AMBER_SOFT_BORDER = 'rgba(247,147,30,0.30)';
const INK = '#0F172A';
const SLATE = '#94A3B8';
const SLATE_500 = '#64748B';
const SLATE_700 = '#334155';
const SLATE_LIGHT = '#CBD5E1';
const SLATE_150 = '#EDF1F5';
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
      <div style={{ height: 14, width: 240, background: '#F8FAFC', borderRadius: 6, marginBottom: 16 }} />
      <div style={{ height: 280, background: '#fff', border: `1px solid ${SLATE_ALPHA}`, borderRadius: 18, marginBottom: 20 }} />
      <div style={{ height: 220 }} />
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

  // Eyebrow: DB editorial override > data-driven framing > generic fallback
  const eyebrow = useMemo(() => {
    if (editorial.data?.eyebrow) return editorial.data.eyebrow;
    if (!leader || !chaser) return COLLEGE_RIVALRY_FALLBACK.eyebrow;
    return isClosingRace ? 'CLOSEST RACE THIS WEEK' : 'TIGHTEST AT THE TOP';
  }, [editorial.data, leader, chaser, isClosingRace]);

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

  // The chaser franchise IS the matchup's rival — RIVAL pill follows this dynamically,
  // so if matchup-selection logic ever evolves beyond rank-2, the pill follows.
  const rivalNormalizedName = chaser?.normalized_name ?? null;

  return (
    <section aria-label="This week's college rivalry">
      {/* Section header — shared SectionHeader component */}
      <div style={{ padding: '0 16px' }}>
        <SectionHeader
          eyebrow="College Rivalry"
          title="College Franchise Battle"
          subtitle={`Where college legacies compete on tour · ${currentYear} Season`}
        />
      </div>

      {/* Rivalry hero card — matchup row sits DIRECTLY on the outer card (no inner card) */}
      <div style={{ padding: '0 16px', marginBottom: 24 }}>
        <div
          style={{
            background: '#fff',
            border: `1px solid ${SLATE_ALPHA}`,
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 2px 16px -8px rgba(15,23,42,0.08)',
          }}
        >
          {/* Eyebrow + headline */}
          <div style={{ padding: '20px 18px 14px' }}>
            <div style={{
              fontSize: 11, fontWeight: 900, color: AMBER_INK,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              marginBottom: 12,
            }}>
              🥊 {eyebrow}
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

          {/* Matchup row — NO inner card, sits directly on the outer white card */}
          <div
            style={{
              padding: '4px 18px 18px',
              marginBottom: 0,
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
                  style={{ width: 56, height: 56, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.14))' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <div style={{ fontSize: 13, fontWeight: 800, color: INK, letterSpacing: '-0.2px' }}>
                {leaderShort}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: AMBER_INK, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.4px' }}>
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
                    style={{ width: 56, height: 56, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.14))' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div style={{ fontSize: 13, fontWeight: 800, color: INK, letterSpacing: '-0.2px' }}>
                  {chaserShort}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.4px' }}>
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

          {/* Captains row — tappable, contextualized */}
          {(leaderCaptain || chaserCaptain) && (
            <div
              style={{
                borderTop: `1px solid ${SLATE_150}`,
                padding: '14px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1px 1fr',
                gap: 12,
                alignItems: 'center',
              }}
            >
              {/* Leader captain — tappable */}
              <button
                onClick={() => leaderCaptain && navigate(`/tourhub/player/${leaderCaptain.playerId}`)}
                disabled={!leaderCaptain}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 8px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: leaderCaptain ? 'pointer' : 'default',
                  textAlign: 'left',
                  width: '100%',
                  minWidth: 0,
                }}
              >
                <SquircleAvatar
                  size={32}
                  src={leaderCaptain ? getPlayerHeadshotUrl(leaderCaptain.fullName, leaderCaptain.tourCode) : PLAYER_SILHOUETTE_URL}
                  alt={leaderCaptain?.fullName ?? '—'}
                  hideRing
                  fallback={leaderCaptain?.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '—'}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 800, color: SLATE_500,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    {leaderShort} CAPTAIN
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 800, color: INK, letterSpacing: '-0.2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginTop: 1,
                  }}>
                    {leaderCaptain ? abbreviateName(leaderCaptain.fullName) : '—'}
                  </div>
                  {leaderCaptain && (
                    <div style={{
                      fontSize: 10, fontWeight: 600, color: SLATE_500, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginTop: 2,
                    }}>
                      Top earner · {formatCurrency(leaderCaptain.earnings)}
                    </div>
                  )}
                </div>
              </button>

              {/* Vertical divider */}
              <div style={{ background: SLATE_150, height: 44, width: 1 }} />

              {/* Chaser captain — tappable */}
              <button
                onClick={() => chaserCaptain && navigate(`/tourhub/player/${chaserCaptain.playerId}`)}
                disabled={!chaserCaptain}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 8px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: chaserCaptain ? 'pointer' : 'default',
                  textAlign: 'right',
                  width: '100%',
                  minWidth: 0,
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ minWidth: 0, flex: 1, textAlign: 'right' }}>
                  <div style={{
                    fontSize: 9, fontWeight: 800, color: SLATE_500,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    {chaserShort} CAPTAIN
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 800, color: INK, letterSpacing: '-0.2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginTop: 1,
                  }}>
                    {chaserCaptain ? abbreviateName(chaserCaptain.fullName) : '—'}
                  </div>
                  {chaserCaptain && (
                    <div style={{
                      fontSize: 10, fontWeight: 600, color: SLATE_500, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginTop: 2,
                    }}>
                      Top earner · {formatCurrency(chaserCaptain.earnings)}
                    </div>
                  )}
                </div>
                <SquircleAvatar
                  size={32}
                  src={chaserCaptain ? getPlayerHeadshotUrl(chaserCaptain.fullName, chaserCaptain.tourCode) : PLAYER_SILHOUETTE_URL}
                  alt={chaserCaptain?.fullName ?? '—'}
                  hideRing
                  fallback={chaserCaptain?.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '—'}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Standings list — bare page background, no wrapping card */}
      {top5.length > 0 && (
        <div style={{ padding: '0 16px' }}>
          {/* Section label row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
            padding: '0 4px',
          }}>
            <span style={{
              fontSize: 10, fontWeight: 900, color: SLATE_500,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              Standings
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: SLATE_500,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Top 5 · Earnings on Tour
            </span>
          </div>

          {top5.map((stats, i) => {
            const media = mediaMap?.get(stats.normalized_name);
            const name = displayName(stats, media);
            const logo = getCollegeLogoUrl(fullName(stats, media));
            const rank = i + 1;
            const isLeader = rank === 1;
            const isRival = rivalNormalizedName === stats.normalized_name;

            return (
              <button
                key={stats.id}
                onClick={() => navigate(`/tourhub/college-golf/${stats.normalized_name}`)}
                style={{
                  width: '100%',
                  background: isLeader ? AMBER_SOFT_BG : 'transparent',
                  border: 'none',
                  borderLeft: isLeader ? `3px solid ${AMBER}` : '3px solid transparent',
                  borderBottom: i < top5.length - 1 ? `1px solid ${SLATE_150}` : 'none',
                  borderRadius: isLeader ? '0 6px 6px 0' : 0,
                  padding: '13px 12px 13px 11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: 24,
                    fontSize: 16,
                    fontWeight: 900,
                    color: isLeader ? AMBER : SLATE,
                    letterSpacing: '-0.4px',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                    textAlign: 'center',
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
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 0,
                }}>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: INK,
                      letterSpacing: '-0.2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {name}
                  </span>
                  {isRival && (
                    <span style={{
                      padding: '2px 6px',
                      background: AMBER_SOFT_BG,
                      border: `1px solid ${AMBER_SOFT_BORDER}`,
                      borderRadius: 4,
                      fontSize: 8,
                      fontWeight: 900,
                      color: AMBER_INK,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                      lineHeight: 1.2,
                    }}>
                      Rival
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: isLeader ? AMBER_INK : SLATE_700,
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
      )}
    </section>
  );
}

/**
 * EditorialResultsHero — expanded-state Tour Hero "Results" surface.
 *
 * C2 Editorial · Elastic redesign:
 * - Light theme on #F8FAFC, 70dvh hard cap, no internal scroll
 * - ElasticZone: eyebrow + status + title + venue (above CHAMPION divider)
 * - Below: CHAMPION block + Runner-up strip + 5-col By-the-Numbers + CTA
 */

import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { tournamentRoute } from '../../routes';
import { Shimmer } from '../shared/Shimmer';
import { ElasticZone, useElasticT, lerp } from '../shared/ElasticZone';
import {
  TournamentTitleBlock,
  TourBadge,
  StatusBadge,
} from '../shared/TournamentTitleBlock';
import { HeroCTA } from '../shared/HeroCTA';

import { useWinnerScorecardStats } from '../../hooks/useWinnerScorecardStats';
import type { TournamentFinisher } from '../../hooks/useTournamentLeadersWinners';
import type { PlayerInfo } from '@/components/tourhub/PlayerScorecardCard';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';
import {
  ink, gold, amber,
  lightBg, slate100, slate200, slate300, slate400, slate500,
  fmtScore,
} from '../../utils/heroAtmosphere';

const COUNTRY_TO_FLAG: Record<string, string> = {
  'UNITED STATES': '🇺🇸', 'USA': '🇺🇸',
  'ENGLAND': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'NORTHERN IRELAND': '🇮🇪',
  'SCOTLAND': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'WALES': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'IRELAND': '🇮🇪',
  'AUSTRALIA': '🇦🇺', 'CANADA': '🇨🇦', 'JAPAN': '🇯🇵', 'SOUTH AFRICA': '🇿🇦',
  'SPAIN': '🇪🇸', 'GERMANY': '🇩🇪', 'FRANCE': '🇫🇷', 'SWEDEN': '🇸🇪',
  'NORWAY': '🇳🇴', 'DENMARK': '🇩🇰', 'SOUTH KOREA': '🇰🇷', 'CHINA': '🇨🇳',
  'THAILAND': '🇹🇭', 'NEW ZEALAND': '🇳🇿', 'ARGENTINA': '🇦🇷',
  'COLOMBIA': '🇨🇴', 'CHILE': '🇨🇱', 'ITALY': '🇮🇹', 'BELGIUM': '🇧🇪',
};
function flagFor(country: string | null | undefined): string {
  if (!country) return '';
  return COUNTRY_TO_FLAG[country.toUpperCase()] ?? '';
}
function getInitials(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function getTourCode(slug: string): string {
  const map: Record<string, string> = {
    pga: 'PGA', euro: 'DPW', lpga: 'LPGA', liv: 'LIV',
    champ: 'CHAMP', pgad: 'KFT',
  };
  return map[slug] ?? slug.toUpperCase();
}

// ---------- CHAMPION block --------------------------------------------------

function ChampionBlock({
  winner, tourSlug, marginLabel, onTap, t = 0,
}: {
  winner: TournamentFinisher; tourSlug: string;
  marginLabel: string | null; onTap?: () => void; t?: number;
}) {
  const [imgErr, setImgErr] = useState(false);
  const fullName = winner.fullName || winner.displayName;
  const flag = flagFor(winner.country);
  const tourCode = winner.tourCode ?? tourSlug;
  const photoUrl = getPlayerHeadshotUrl(fullName, tourCode, winner.headshotOverride ?? undefined);

  const avatarSize = lerp(44, 64, t);
  const padY = lerp(12, 22, t);
  const gap = lerp(12, 16, t);
  const nameSize = lerp(15, 20, t);
  const scoreSize = lerp(30, 42, t);
  const trophyDecor = lerp(80, 120, t);

  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        borderTop: `1px solid ${slate200}`,
        borderBottom: `1px solid ${slate200}`,
        padding: `${padY}px 0`,
        overflow: 'hidden',
      }}
    >
      <Trophy
        size={trophyDecor}
        strokeWidth={1}
        aria-hidden="true"
        style={{
          position: 'absolute', right: -8, top: -10,
          color: gold, opacity: 0.06, pointerEvents: 'none',
        }}
      />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
      }}>
        <Trophy size={11} color={gold} strokeWidth={2.5} />
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: gold }}>
          CHAMPION
        </span>
        {marginLabel && (
          <>
            <span style={{ fontSize: 10, color: slate300 }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: slate500 }}>
              {marginLabel}
            </span>
          </>
        )}
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', gap,
      }}>
        <button
          type="button"
          onClick={onTap}
          style={{
            background: 'transparent', border: 'none', padding: 0,
            cursor: onTap ? 'pointer' : 'default', flexShrink: 0,
          }}
        >
          <div style={{
            width: avatarSize, aspectRatio: '1 / 1.05', borderRadius: '34%',
            border: `2px solid ${gold}`, background: slate100,
            overflow: 'hidden',
          }}>
            {photoUrl && !imgErr ? (
              <img
                src={photoUrl} alt="" onError={() => setImgErr(true)}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center 18%',
                }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PlayerSilhouette size={Math.round(avatarSize * 0.56)} />
              </div>
            )}
          </div>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: nameSize, fontWeight: 800, color: ink,
            letterSpacing: '-0.02em', lineHeight: 1.05,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {fullName}
          </div>
          {(flag || winner.country) && (
            <div style={{
              marginTop: 3, display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 10.5, color: slate500, fontWeight: 600,
            }}>
              {flag && <span aria-hidden="true">{flag}</span>}
              {winner.country && (
                <span style={{ letterSpacing: '0.06em' }}>
                  {winner.country.toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: scoreSize, fontWeight: 900, letterSpacing: '-0.04em',
            color: ink, lineHeight: 0.9,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {winner.displayScore || fmtScore(winner.score)}
          </div>
          <div style={{
            marginTop: 4, fontSize: 8, fontWeight: 800, letterSpacing: '0.14em',
            color: slate400,
          }}>
            TO PAR
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Runner-up strip -------------------------------------------------

function RunnerUpStrip({
  finisher, tourSlug, onTap, t = 0,
}: {
  finisher: TournamentFinisher; tourSlug: string;
  onTap?: (f: TournamentFinisher) => void; t?: number;
}) {
  const [imgErr, setImgErr] = useState(false);
  const fullName = finisher.fullName || finisher.displayName;
  const tourCode = finisher.tourCode ?? tourSlug;
  const photoUrl = getPlayerHeadshotUrl(fullName, tourCode, finisher.headshotOverride ?? undefined);
  const flag = flagFor(finisher.country);

  const avatar = lerp(28, 38, t);
  const pad = lerp(10, 14, t);
  const marginTop = lerp(8, 14, t);
  const nameSize = lerp(13, 15, t);
  const scoreSize = lerp(16, 19, t);
  const badge = lerp(22, 28, t);

  return (
    <button
      type="button"
      onClick={() => onTap?.(finisher)}
      style={{
        flexShrink: 0,
        marginTop,
        padding: pad,
        borderRadius: 10,
        background: 'rgba(241,245,249,0.8)',
        border: `1px solid ${slate200}`,
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', textAlign: 'left',
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      <span style={{
        width: badge, height: badge, borderRadius: '50%',
        background: '#E5E4E2', color: ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, flexShrink: 0,
      }}>
        2
      </span>
      {photoUrl && !imgErr ? (
        <img
          src={photoUrl} alt="" onError={() => setImgErr(true)}
          style={{
            width: avatar, aspectRatio: '1 / 1.05', borderRadius: '34%',
            objectFit: 'cover', objectPosition: 'center 18%', flexShrink: 0,
          }}
        />
      ) : (
        <div style={{
          width: avatar, aspectRatio: '1 / 1.05', borderRadius: '34%',
          background: slate100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: slate500, fontWeight: 700, flexShrink: 0,
        }}>
          {getInitials(fullName)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 8.5, fontWeight: 800, letterSpacing: '0.14em',
          color: slate400, marginBottom: 2,
        }}>
          RUNNER-UP
        </div>
        <div style={{
          fontSize: nameSize, fontWeight: 700, color: ink,
          display: 'flex', alignItems: 'center', gap: 6,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <span style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{finisher.displayName}</span>
          {flag && <span aria-hidden="true" style={{ flexShrink: 0 }}>{flag}</span>}
        </div>
      </div>
      <span style={{
        fontSize: scoreSize, fontWeight: 800, color: ink,
        fontVariantNumeric: 'tabular-nums', flexShrink: 0,
      }}>
        {finisher.displayScore || fmtScore(finisher.score)}
      </span>
    </button>
  );
}

// ---------- By-the-Numbers grid (5 col, low round merged) -----------------

function ByNumbersGrid({
  birdies, eagles, bogeys, lowRound, rounds, t = 0,
}: {
  birdies: number; eagles: number; bogeys: number;
  lowRound: number | null;
  rounds: Array<number | null>;
  t?: number;
}) {
  const playedRounds = rounds.filter((r): r is number => r != null);
  const avg = playedRounds.length > 0
    ? (playedRounds.reduce((a, b) => a + b, 0) / playedRounds.length)
    : null;
  const cells: Array<{ v: string; label: string; color: string }> = [
    { v: `${birdies}`,                                label: 'BIRDIES', color: gold },
    { v: `${eagles}`,                                 label: 'EAGLES',  color: gold },
    { v: avg != null ? avg.toFixed(1) : '—',          label: 'AVG',     color: ink  },
    { v: `${bogeys}`,                                 label: 'BOGEYS',  color: ink  },
    { v: lowRound != null ? fmtScore(lowRound) : '—', label: 'LOW R',   color: gold },
  ];
  const numSize = lerp(20, 28, t);
  const padY = lerp(10, 16, t);
  const marginTop = lerp(8, 14, t);
  return (
    <div style={{
      flexShrink: 0,
      marginTop,
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      borderTop: `1px solid ${slate200}`,
      borderBottom: `1px solid ${slate200}`,
      padding: `${padY}px 0`,
    }}>
      {cells.map((c, i) => (
        <div
          key={c.label}
          style={{
            textAlign: 'center',
            borderLeft: i > 0 ? `1px solid ${slate200}` : 'none',
            padding: '0 4px',
          }}
        >
          <div style={{
            fontSize: numSize, fontWeight: 900, color: c.color, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
          }}>
            {c.v}
          </div>
          <div style={{
            marginTop: 4, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
            color: slate400,
          }}>
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Skeleton --------------------------------------------------------

export function ResultsHeroSkeleton() {
  return (
    <div style={{
      height: '100%', background: lightBg,
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 28px)',
      paddingInline: 20, paddingBottom: 16,
      boxSizing: 'border-box', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Shimmer width="50%" height={11} radius={3} style={{ marginBottom: 12 }} />
        <Shimmer width="30%" height={12} radius={3} style={{ marginBottom: 14 }} />
        <Shimmer width="85%" height={36} radius={6} style={{ marginBottom: 8 }} />
        <Shimmer width="60%" height={36} radius={6} style={{ marginBottom: 12 }} />
      </div>
      <Shimmer width="100%" height={86} radius={6} style={{ marginBottom: 6 }} />
      <Shimmer width="100%" height={56} radius={10} style={{ marginBottom: 6 }} />
      <Shimmer width="100%" height={64} radius={6} style={{ marginBottom: 12 }} />
      <Shimmer width="100%" height={42} radius={14} />
    </div>
  );
}

// ---------- Main ------------------------------------------------------------

export interface EditorialResultsHeroProps {
  tournament: {
    id: string;
    name: string;
    tourSlug: string;
    venueName: string | null;
    venueCity: string | null;
  };
  finishers: TournamentFinisher[];
  onPlayerTap?: (player: PlayerInfo) => void;
  onLeaderboardCta?: () => void;
}

export function EditorialResultsHero({
  tournament, finishers, onPlayerTap, onLeaderboardCta,
}: EditorialResultsHeroProps) {
  const navigate = useNavigate();

  const winnerRow = finishers.filter(f => f.position === (finishers[0]?.position ?? 1));
  const winner = winnerRow[0] ?? null;
  const winnerIsTied = winnerRow.length > 1;

  const marginLabel = (() => {
    if (!winner) return null;
    if (winnerIsTied) return 'Co-winners';
    const next = finishers.find(f => f.position > winner.position);
    if (!next || next.score == null || winner.score == null) return null;
    const margin = next.score - winner.score;
    if (margin <= 0) return 'Won in playoff';
    return `Won by ${margin} stroke${margin === 1 ? '' : 's'}`;
  })();

  const { data: winnerStats } = useWinnerScorecardStats(
    tournament.id,
    winner?.playerId ?? undefined,
  );

  const runnerUp = finishers.find(f => f.position > (winner?.position ?? 1)) ?? null;

  // Lowest single round across all finishers
  const lowRound = React.useMemo(() => {
    let best: number | null = null;
    finishers.forEach(f => {
      [1, 2, 3, 4].forEach(r => {
        const v = (f as any)[`round${r}`] as number | null | undefined;
        if (v != null && (best == null || v < best)) best = v;
      });
    });
    return best;
  }, [finishers]);

  const handleFinisherTap = useCallback(
    (f: TournamentFinisher) => {
      if (!onPlayerTap) return;
      const fullName = f.fullName || f.displayName;
      const tourCode = f.tourCode ?? tournament.tourSlug ?? 'pga';
      onPlayerTap({
        id: f.playerId || '',
        srId: f.pgaTourId || '',
        name: fullName,
        firstName: f.firstName,
        lastName: f.lastName,
        photoUrl: getPlayerHeadshotUrl(fullName, tourCode, f.headshotOverride ?? undefined) || undefined,
        countryCode: f.country || undefined,
        position: f.position,
        totalScore: f.score ?? 0,
        thru: 'F',
        currentRound: 4,
      });
    },
    [onPlayerTap, tournament.tourSlug],
  );

  if (!winner) {
    return (
      <div style={{
        height: '100%', background: lightBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: slate500, fontSize: 12,
      }}>
        Final results loading…
      </div>
    );
  }

  const handleCta = () => {
    if (onLeaderboardCta) {
      onLeaderboardCta();
    } else {
      const t = tournamentRoute(tournament.id, { kind: 'overview' });
      navigate(t.to, { state: t.state });
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: lightBg,
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 28px)',
      paddingInline: 20,
      paddingBottom: 16,
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <ElasticZone minH={120} maxH={260}>
        {(t) => (
          <TournamentTitleBlock
            t={t}
            eyebrowLabel="THE WEEK IN REVIEW"
            eyebrowRight="72 HOLES"
            statusRow={
              <>
                <TourBadge code={getTourCode(tournament.tourSlug)} />
                <StatusBadge
                  label="FINAL"
                  color="#FFB800"
                  bg="rgba(255,184,0,0.094)"
                />
              </>
            }
            title={tournament.name}
            venueName={tournament.venueName}
            venueCity={tournament.venueCity}
          />
        )}
      </ElasticZone>

      <ChampionBlock
        winner={winner}
        tourSlug={tournament.tourSlug}
        marginLabel={marginLabel}
        onTap={() => handleFinisherTap(winner)}
      />

      {runnerUp && (
        <RunnerUpStrip
          finisher={runnerUp}
          tourSlug={tournament.tourSlug}
          onTap={handleFinisherTap}
        />
      )}

      {winnerStats && (
        <ByNumbersGrid
          birdies={(winnerStats as any).birdies ?? 0}
          eagles={(winnerStats as any).eagles ?? 0}
          bogeys={(winnerStats as any).bogeys ?? 0}
          lowRound={lowRound}
          rounds={[winner.round1, winner.round2, winner.round3, winner.round4]}
        />
      )}

      <HeroCTA
        label="Final Leaderboard"
        onClick={handleCta}
        style={{ marginTop: 12 }}
      />
    </div>
  );
}

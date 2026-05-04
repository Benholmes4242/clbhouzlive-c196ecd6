/**
 * EditorialResultsHero — expanded-state Tour Hero "Results" surface.
 *
 * Source of truth: TOUR_HERO_AND_SCORECARD_BRIEF (Phase 3).
 * Mirrors EditorialLiveHero's editorial language but tuned for the post-event
 * narrative: gold accent rail, champion hero, cumulative score progression,
 * scorecard stats grid, final leaderboard, and a Final Leaderboard CTA.
 *
 * Derived fields the brief calls "additive" (margin-of-victory chip,
 * scoring stats grid) are omitted gracefully when the data isn't available.
 */

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Trophy } from 'lucide-react';
import { tournamentRoute } from '../../routes';
import { HeroAtmosphere } from '../shared/HeroAtmosphere';
import { useWinnerScorecardStats } from '../../hooks/useWinnerScorecardStats';
import type { TournamentFinisher } from '../../hooks/useTournamentLeadersWinners';
import type { PlayerInfo } from '@/components/tourhub/PlayerScorecardCard';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';
import {
  navy, navyMid, ink,
  inkSoft, inkFaint, inkGhost,
  hairlineDark, hairlineMid,
  amber, gold, greenLive, danger,
  fmtScore, fmtScoreSign,
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

// ---------- Cumulative round sparkline (R1→R4) ----------------------------

function RoundSparkline({ rounds }: { rounds: (number | null)[] }) {
  const filled = rounds.filter((r): r is number => r != null);
  if (filled.length < 2) return null;

  const SPARK_W = 320;
  const SPARK_H = 60;
  const INSET = 6;

  const cumulative = filled.reduce<number[]>((acc, r, i) => {
    acc.push((acc[i - 1] ?? 0) + r);
    return acc;
  }, []);
  const min = Math.min(0, ...cumulative);
  const max = Math.max(0, ...cumulative);
  const range = max - min || 1;
  const stepX = SPARK_W / Math.max(1, filled.length - 1);

  const pts = cumulative.map((v, i) => {
    const x = i * stepX;
    const y = SPARK_H - INSET - ((v - min) / range) * (SPARK_H - INSET * 2);
    return [x, y] as const;
  });
  const lastPt = pts[pts.length - 1];

  const path = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${path} L${lastPt[0].toFixed(1)},${SPARK_H} L0,${SPARK_H} Z`;

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: SPARK_H, display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="resultsSparkArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,184,0,0.20)" />
            <stop offset="100%" stopColor="rgba(255,184,0,0)" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#resultsSparkArea)" />
        <path d={path} stroke={gold} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5} fill={gold} />
        ))}
        <circle
          cx={lastPt[0]}
          cy={lastPt[1]}
          r={5}
          fill={gold}
          stroke={navyMid}
          strokeWidth={2}
        />
      </svg>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 9,
          fontWeight: 700,
          color: inkGhost,
          letterSpacing: '0.06em',
        }}
      >
        {filled.map((_, i) => (
          <span key={i}>R{i + 1}</span>
        ))}
      </div>
    </div>
  );
}

// ---------- Champion hero -------------------------------------------------

function ChampionHero({
  winner,
  tourSlug,
  marginLabel,
  onTap,
}: {
  winner: TournamentFinisher;
  tourSlug: string;
  marginLabel: string | null;
  onTap?: () => void;
}) {
  const [imgErr, setImgErr] = React.useState(false);
  const fullName = winner.fullName || winner.displayName;
  const flag = flagFor(winner.country);
  const tourCode = winner.tourCode ?? tourSlug;
  const photoUrl = getPlayerHeadshotUrl(fullName, tourCode, winner.headshotOverride ?? undefined);

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 14, marginBottom: 22 }}>
      <button
        type="button"
        onClick={onTap}
        className="active:opacity-70 transition-opacity"
        style={{
          position: 'relative', flexShrink: 0,
          background: 'transparent', border: 'none', padding: 0, cursor: onTap ? 'pointer' : 'default',
        }}
      >
        <div
          style={{
            width: 86, height: 86, borderRadius: '50%',
            border: `2px solid ${gold}`,
            background: 'rgba(0,0,0,0.3)',
            overflow: 'hidden',
            boxShadow: '0 0 24px rgba(255,184,0,0.18)',
          }}
        >
          {photoUrl && !imgErr ? (
            <img
              src={photoUrl}
              alt=""
              onError={() => setImgErr(true)}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center 18%',
              }}
            />
          ) : (
            <PlayerSilhouette size={42} />
          )}
        </div>
        <div
          style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 28, height: 28, borderRadius: '50%',
            background: gold, color: ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${navyMid}`,
          }}
        >
          <Trophy size={13} strokeWidth={2.4} />
        </div>
      </button>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
            color: gold, marginBottom: 4,
          }}
        >
          CHAMPION{flag ? ` · ${flag}` : ''}
          {winner.country ? ` ${winner.country.toUpperCase()}` : ''}
        </div>
        <button
          type="button"
          onClick={onTap}
          className="active:opacity-70 transition-opacity"
          style={{
            background: 'transparent', border: 'none', padding: 0, textAlign: 'left',
            cursor: onTap ? 'pointer' : 'default',
          }}
        >
          <div
            style={{
              fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em',
              color: '#fff', lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {fullName}
          </div>
        </button>
        <div
          style={{
            fontSize: 11, color: inkFaint, marginTop: 6, fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          72 holes · Final
        </div>
      </div>
      <div
        style={{
          textAlign: 'right',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 56, fontWeight: 800, letterSpacing: '-0.04em',
            color: '#fff', lineHeight: 0.9,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fmtScore(winner.score)}
        </div>
        {marginLabel && (
          <div
            style={{
              fontSize: 10, color: gold, marginTop: 6, letterSpacing: '0.06em',
              fontWeight: 700,
            }}
          >
            {marginLabel.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Final leaderboard row -----------------------------------------

function FinalLeaderboardRow({
  finisher,
  isWinner,
  isTied,
  tourSlug,
  onTap,
}: {
  finisher: TournamentFinisher;
  isWinner: boolean;
  isTied: boolean;
  tourSlug: string;
  onTap?: (f: TournamentFinisher) => void;
}) {
  const [imgErr, setImgErr] = React.useState(false);
  const fullName = finisher.fullName || finisher.displayName;
  const tourCode = finisher.tourCode ?? tourSlug;
  const photoUrl = getPlayerHeadshotUrl(fullName, tourCode, finisher.headshotOverride ?? undefined);
  const r4 = finisher.round4;

  return (
    <button
      type="button"
      onClick={() => onTap?.(finisher)}
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 56px 44px',
        alignItems: 'center',
        padding: '11px 0',
        borderTop: `1px solid ${hairlineDark}`,
        background: 'transparent',
        border: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        width: '100%',
        textAlign: 'left',
        cursor: onTap ? 'pointer' : 'default',
        color: '#fff',
      }}
    >
      <span
        style={{
          fontSize: 11, color: isWinner ? gold : inkFaint,
          fontWeight: isWinner ? 800 : 600,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {isTied ? `T${finisher.position}` : finisher.position}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {photoUrl && !imgErr ? (
          <img
            src={photoUrl}
            alt=""
            onError={() => setImgErr(true)}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              objectFit: 'cover', objectPosition: 'center 18%',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: inkFaint, fontWeight: 700, flexShrink: 0,
            }}
          >
            {getInitials(fullName)}
          </div>
        )}
        <span
          style={{
            fontSize: 14,
            fontWeight: isWinner ? 800 : 600,
            color: '#fff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {finisher.displayName}
        </span>
      </span>
      <span
        style={{
          textAlign: 'right', fontSize: 14, fontWeight: 800, color: '#fff',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {finisher.displayScore || fmtScore(finisher.score)}
      </span>
      <span
        style={{
          textAlign: 'right', fontSize: 12, fontWeight: 700,
          color: r4 == null ? inkGhost : r4 < 0 ? greenLive : r4 > 0 ? danger : inkFaint,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {r4 == null ? '—' : r4 === 0 ? 'E' : fmtScoreSign(r4)}
      </span>
    </button>
  );
}

// ---------- Stats grid ----------------------------------------------------

function StatsGrid({ stats }: { stats: { eagles: number; birdies: number; pars: number; bogeys: number; doubleBogeys: number } }) {
  const items = [
    { v: stats.eagles, label: 'Eagles', color: gold },
    { v: stats.birdies, label: 'Birdies', color: greenLive },
    { v: stats.pars, label: 'Pars', color: inkSoft },
    { v: stats.bogeys, label: 'Bogeys', color: danger },
    { v: stats.doubleBogeys, label: 'Doubles', color: danger },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
      {items.map(s => (
        <div
          key={s.label}
          style={{
            flex: 1, textAlign: 'center',
            padding: '10px 4px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${hairlineDark}`,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {s.v}
          </div>
          <div
            style={{
              fontSize: 8, fontWeight: 700, color: inkGhost,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Main component ------------------------------------------------

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
  tournament,
  finishers,
  onPlayerTap,
  onLeaderboardCta,
}: EditorialResultsHeroProps) {
  const navigate = useNavigate();

  // Position-grouped: winner row + chasers
  const positionCounts = React.useMemo(() => {
    const m = new Map<number, number>();
    finishers.forEach(f => m.set(f.position, (m.get(f.position) || 0) + 1));
    return m;
  }, [finishers]);

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

  // Top chasers — exclude the winner row, take up to 8 more
  const chasers = finishers.filter(f => f.position > (winner?.position ?? 1)).slice(0, 8);

  // Tap → PlayerInfo
  const handleFinisherTap = useCallback((f: TournamentFinisher) => {
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
  }, [onPlayerTap, tournament.tourSlug]);

  if (!winner) {
    return (
      <HeroAtmosphere
        style={{
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: inkFaint, fontSize: 12,
        }}
      >
        Final results loading…
      </HeroAtmosphere>
    );
  }

  const winnerRounds: (number | null)[] = [winner.round1, winner.round2, winner.round3, winner.round4];

  return (
    <HeroAtmosphere
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 56px)',
          padding: '0 20px',
          paddingBottom: 24,
          overflowY: 'auto',
          height: '100%',
          WebkitOverflowScrolling: 'touch' as any,
        }}
      >
        {/* 1. Broadcast caption strip */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
            paddingTop: 12,
          }}
        >
          <span
            style={{
              padding: '3px 7px', borderRadius: 4, background: '#fff', color: ink,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
            }}
          >
            {getTourCode(tournament.tourSlug)}
          </span>
          <span
            style={{
              padding: '3px 7px', borderRadius: 4,
              background: 'rgba(255,184,0,0.14)', color: gold,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
              border: `1px solid rgba(255,184,0,0.30)`,
            }}
          >
            FINAL
          </span>
          <span style={{ fontSize: 10, color: inkFaint }}>·</span>
          <span
            style={{
              fontSize: 10, fontWeight: 700, color: inkSoft, letterSpacing: '0.06em',
            }}
          >
            72 Holes Complete
          </span>
        </div>

        {/* 2. Tournament name + venue */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: 0, fontSize: 30, fontWeight: 800,
              letterSpacing: '-0.025em', lineHeight: 1.05, color: '#fff',
            }}
          >
            {tournament.name}
          </h1>
          {(tournament.venueName || tournament.venueCity) && (
            <div
              style={{
                marginTop: 8, fontSize: 12, color: inkFaint,
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <MapPin size={11} strokeWidth={2.2} style={{ opacity: 0.8 }} />
              <span>
                {[tournament.venueName, tournament.venueCity].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </div>

        {/* 3. Champion hero */}
        <ChampionHero
          winner={winner}
          tourSlug={tournament.tourSlug}
          marginLabel={marginLabel}
          onTap={() => handleFinisherTap(winner)}
        />

        {/* 4. Round score progression */}
        {winnerRounds.filter(r => r != null).length >= 2 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.025)',
              borderRadius: 14,
              border: `1px solid ${hairlineDark}`,
              padding: '14px 14px 12px',
              marginBottom: 22,
            }}
          >
            <div
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: inkFaint,
                }}
              >
                CHAMPION · SCORE PROGRESSION
              </span>
              <span style={{ fontSize: 10, color: gold, fontWeight: 700, letterSpacing: '0.06em' }}>
                {winner.displayScore || fmtScore(winner.score)}
              </span>
            </div>
            <RoundSparkline rounds={winnerRounds} />
          </div>
        )}

        {/* 5. Stats grid */}
        {winnerStats && (
          <StatsGrid stats={winnerStats as any} />
        )}

        {/* 6. Final leaderboard column header + rows */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 56px 44px',
            alignItems: 'center',
            padding: '4px 0 6px',
            fontSize: 9, fontWeight: 800, color: inkGhost,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
          }}
        >
          <span></span>
          <span>Player</span>
          <span style={{ textAlign: 'right' }}>Total</span>
          <span style={{ textAlign: 'right' }}>R4</span>
        </div>

        {/* Winner row first (highlighted) */}
        <FinalLeaderboardRow
          finisher={winner}
          isWinner
          isTied={winnerIsTied}
          tourSlug={tournament.tourSlug}
          onTap={handleFinisherTap}
        />
        {chasers.map((f) => (
          <FinalLeaderboardRow
            key={f.playerId ?? `${f.position}-${f.fullName}`}
            finisher={f}
            isWinner={false}
            isTied={(positionCounts.get(f.position) || 1) > 1}
            tourSlug={tournament.tourSlug}
            onTap={handleFinisherTap}
          />
        ))}

        {/* 7. Final Leaderboard CTA */}
        <button
          type="button"
          onClick={() => {
            if (onLeaderboardCta) {
              onLeaderboardCta();
            } else {
              const t = tournamentRoute(tournament.id, { kind: 'overview' });
              navigate(t.to, { state: t.state });
            }
          }}
          style={{
            width: '100%', marginTop: 16, padding: '12px',
            background: 'transparent', border: `1px solid ${hairlineMid}`,
            borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            cursor: 'pointer',
          }}
        >
          Final Leaderboard
          <ChevronRight size={14} />
        </button>
      </div>
    </HeroAtmosphere>
  );
}

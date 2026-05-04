/**
 * EditorialResultsHero — expanded-state Tour Hero "Results" surface.
 *
 * Source of truth: TOUR_HERO_AND_SCORECARD_BRIEF (Phase 3) + R1 follow-up.
 * Mirrors EditorialLiveHero's editorial language but tuned for the post-event
 * narrative: Champion celebration card, score progression, scoring stats grid,
 * "Also on the podium" block, final leaderboard, ticker.
 */

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Trophy } from 'lucide-react';
import { tournamentRoute } from '../../routes';
import { HeroAtmosphere } from '../shared/HeroAtmosphere';
import { Shimmer } from '../shared/Shimmer';
import { RoundSparkline } from '../shared/RoundSparkline';
import { AllToursTicker } from '../shared/AllToursTicker';
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
import { StatsGrid } from '../shared/StatsGrid';

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

// ---------- Champion celebration card -------------------------------------

interface ChampionHeroProps {
  winner: TournamentFinisher;
  tourSlug: string;
  marginLabel: string | null;
  onTap?: () => void;
}

function ChampionHero({ winner, tourSlug, marginLabel, onTap }: ChampionHeroProps) {
  const [imgErr, setImgErr] = React.useState(false);
  const fullName = winner.fullName || winner.displayName;
  const flag = flagFor(winner.country);
  const tourCode = winner.tourCode ?? tourSlug;
  const photoUrl = getPlayerHeadshotUrl(fullName, tourCode, winner.headshotOverride ?? undefined);

  const winnerRounds: (number | null)[] = [winner.round1, winner.round2, winner.round3, winner.round4];

  return (
    <div
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(255,184,0,0.12) 0%, rgba(255,184,0,0.04) 100%)',
        border: '1px solid rgba(255,184,0,0.25)',
        borderRadius: 18,
        padding: '18px 18px 16px',
        marginBottom: 22,
        overflow: 'hidden',
      }}
    >
      {/* Trophy watermark */}
      <Trophy
        size={120}
        strokeWidth={1}
        style={{
          position: 'absolute', right: -20, top: -10,
          color: gold, opacity: 0.05, pointerEvents: 'none',
        }}
      />

      {/* CHAMPION eyebrow */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
          position: 'relative', zIndex: 1,
        }}
      >
        <Trophy size={11} color={gold} strokeWidth={2.5} />
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: gold }}>
          CHAMPION
        </span>
        {flag && <span style={{ fontSize: 12 }}>{flag}</span>}
        {winner.country && (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: inkFaint }}>
            {winner.country.toUpperCase()}
          </span>
        )}
      </div>

      {/* Headshot + name + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
        <button
          type="button"
          onClick={onTap}
          className="active:opacity-70 transition-opacity"
          style={{
            position: 'relative', flexShrink: 0,
            background: 'transparent', border: 'none', padding: 0,
            cursor: onTap ? 'pointer' : 'default',
          }}
        >
          <div
            style={{
              width: 92, height: 92, borderRadius: '50%',
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
              <PlayerSilhouette size={44} />
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
            <Trophy size={13} strokeWidth={2.5} />
          </div>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={onTap}
            className="active:opacity-70 transition-opacity"
            style={{
              background: 'transparent', border: 'none', padding: 0, textAlign: 'left',
              cursor: onTap ? 'pointer' : 'default', display: 'block', width: '100%',
            }}
          >
            <div
              style={{
                fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em',
                color: '#fff', lineHeight: 1.05,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {fullName}
            </div>
          </button>
          {marginLabel && (
            <div
              style={{
                fontSize: 12, color: gold, marginTop: 6, fontWeight: 700,
              }}
            >
              {marginLabel}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 56, fontWeight: 800, letterSpacing: '-0.04em',
              color: gold, lineHeight: 0.9,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtScore(winner.score)}
          </div>
          <div style={{ fontSize: 10, color: inkFaint, marginTop: 4, letterSpacing: '0.06em' }}>
            FINAL
          </div>
        </div>
      </div>

      {/* Round-by-round inline strip */}
      {winnerRounds.some((r) => r != null) && (
        <div
          style={{
            marginTop: 14, paddingTop: 14,
            borderTop: '1px solid rgba(255,184,0,0.15)',
            display: 'flex', position: 'relative', zIndex: 1,
          }}
        >
          {winnerRounds.map((r, i) =>
            r == null ? null : (
              <div
                key={i}
                style={{
                  flex: 1, padding: '0 4px',
                  borderLeft: i > 0 ? '1px solid rgba(255,184,0,0.15)' : 'none',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                    color: inkFaint, marginBottom: 3,
                  }}
                >
                  R{i + 1}
                </div>
                <div
                  style={{
                    fontSize: 14, fontWeight: 800, color: '#fff',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmtScore(r)}
                </div>
              </div>
            ),
          )}
        </div>
      )}
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

// ---------- Also On The Podium row ----------------------------------------

function PodiumRow({
  finisher,
  tourSlug,
  onTap,
}: {
  finisher: TournamentFinisher;
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
        gridTemplateColumns: '20px 32px 1fr 56px 44px',
        alignItems: 'center',
        gap: 8,
        padding: '12px 0',
        borderTop: `1px solid ${hairlineDark}`,
        background: 'transparent', border: 'none', width: '100%', textAlign: 'left',
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: 11, color: inkFaint, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {finisher.position}
      </span>
      {photoUrl && !imgErr ? (
        <img
          src={photoUrl}
          alt=""
          onError={() => setImgErr(true)}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            objectFit: 'cover', objectPosition: 'center 18%',
          }}
        />
      ) : (
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: inkFaint, fontWeight: 700,
          }}
        >
          {getInitials(fullName)}
        </div>
      )}
      <span
        style={{
          fontSize: 14, fontWeight: 700, color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        {finisher.displayName}
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

// ---------- Skeleton ------------------------------------------------------

export function ResultsHeroSkeleton() {
  return (
    <HeroAtmosphere style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 56px)',
          padding: '0 20px',
          paddingBottom: 24,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Caption strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, paddingTop: 12 }}>
          <Shimmer width={36} height={16} radius={4} />
          <Shimmer width={48} height={14} radius={3} />
          <Shimmer width="40%" height={12} radius={3} />
        </div>
        {/* Tournament name */}
        <div style={{ marginBottom: 28 }}>
          <Shimmer width="85%" height={30} radius={6} style={{ marginBottom: 8 }} />
          <Shimmer width="55%" height={14} radius={4} />
        </div>
        {/* Champion celebration card */}
        <Shimmer width="100%" height={188} radius={18} style={{ marginBottom: 22 }} />
        {/* Stats strip */}
        <Shimmer width="100%" height={70} radius={14} style={{ marginBottom: 22 }} />
        {/* Podium */}
        <Shimmer width="40%" height={11} radius={3} style={{ marginBottom: 8 }} />
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '20px 32px 1fr 56px 44px',
              gap: 8, alignItems: 'center', padding: '12px 0',
              borderTop: `1px solid ${hairlineDark}`,
            }}
          >
            <Shimmer height={11} radius={3} />
            <Shimmer width={32} height={32} radius="50%" />
            <Shimmer width="60%" height={14} radius={4} />
            <Shimmer height={14} radius={4} />
            <Shimmer height={12} radius={4} />
          </div>
        ))}
        {/* Leaderboard rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 56px 44px',
              alignItems: 'center', padding: '11px 0',
              borderTop: `1px solid ${hairlineDark}`,
            }}
          >
            <Shimmer height={11} radius={3} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shimmer width={26} height={26} radius="50%" />
              <Shimmer width="60%" height={14} radius={4} />
            </div>
            <Shimmer height={14} radius={4} />
            <Shimmer height={12} radius={4} />
          </div>
        ))}
      </div>
    </HeroAtmosphere>
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

  const positionCounts = React.useMemo(() => {
    const m = new Map<number, number>();
    finishers.forEach((f) => m.set(f.position, (m.get(f.position) || 0) + 1));
    return m;
  }, [finishers]);

  const winnerRow = finishers.filter((f) => f.position === (finishers[0]?.position ?? 1));
  const winner = winnerRow[0] ?? null;
  const winnerIsTied = winnerRow.length > 1;

  const marginLabel = (() => {
    if (!winner) return null;
    if (winnerIsTied) return 'Co-winners';
    const next = finishers.find((f) => f.position > winner.position);
    if (!next || next.score == null || winner.score == null) return null;
    const margin = next.score - winner.score;
    if (margin <= 0) return 'Won in playoff';
    return `Won by ${margin} stroke${margin === 1 ? '' : 's'}`;
  })();

  const { data: winnerStats } = useWinnerScorecardStats(
    tournament.id,
    winner?.playerId ?? undefined,
  );

  const nonWinners = finishers.filter((f) => f.position > (winner?.position ?? 1));
  const podium = nonWinners.filter((f) => f.position <= 3).slice(0, 2);
  const podiumKeys = new Set(podium.map(p_id));
  const chasers = nonWinners.filter((f) => !podiumKeys.has(p_id(f))).slice(0, 8);

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

  const handleTickerSelect = (id: string) => {
    if (id === tournament.id) return;
    const t = tournamentRoute(id, { kind: 'overview' });
    navigate(t.to, { state: t.state });
  };

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

  return (
    <HeroAtmosphere style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingTop: 12 }}>
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
          <span style={{ fontSize: 10, fontWeight: 700, color: inkSoft, letterSpacing: '0.06em' }}>
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
              <span>{[tournament.venueName, tournament.venueCity].filter(Boolean).join(' · ')}</span>
            </div>
          )}
        </div>

        {/* 3. Champion celebration card (round-by-round inline strip lives inside) */}
        <ChampionHero
          winner={winner}
          tourSlug={tournament.tourSlug}
          marginLabel={marginLabel}
          onTap={() => handleFinisherTap(winner)}
        />

        {/* 4. Stats grid (single panel, hairline dividers, gold for birdies) */}
        {winnerStats && <StatsGrid stats={winnerStats as any} isLive={false} />}

        {/* 5. Also on the podium */}
        {podium.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
                color: inkFaint, marginBottom: 8,
              }}
            >
              ALSO ON THE PODIUM
            </div>
            {podium.map((f) => (
              <PodiumRow
                key={f.playerId ?? `${f.position}-${f.fullName}`}
                finisher={f}
                tourSlug={tournament.tourSlug}
                onTap={handleFinisherTap}
              />
            ))}
          </div>
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

        {/* 8. All Tours ticker (gold accent) */}
        <AllToursTicker
          activeTournamentId={tournament.id}
          onSelect={handleTickerSelect}
          variant="results"
        />
      </div>
    </HeroAtmosphere>
  );
}

// stable key helper (ensures podium dedupe even when playerId is missing)
function p_id(f: TournamentFinisher): string {
  return f.playerId ?? `${f.position}:${f.fullName}`;
}

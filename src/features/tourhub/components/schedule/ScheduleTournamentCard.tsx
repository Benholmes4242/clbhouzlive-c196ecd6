/**
 * ScheduleTournamentCard - Flat ruled row design
 *
 * Per Schedule polish brief (Phase 1):
 *  - Compact TourPill replaces verbose "PGA TOUR EVENT" caps text
 *  - EventTag (major / signature / rolex / playoff) inline beside pill
 *  - Tier accents: amber bg+border for majors, green border for signature/rolex
 *  - Date column normalized to 42px / 9px caps month / 22px day, slate-500
 *  - Event name = visual anchor (15px / 900 / -0.3)
 *  - WinnerPill on completed rows (trophy + photo + name + score)
 *  - Location with 📍 emoji as supporting line
 */

import { useNavigate } from 'react-router-dom';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { SeasonTournament } from '../../hooks/useSeasonTournaments';
import type { TournamentLeaderWinner } from '../../hooks/useTournamentLeadersWinners';
import { getContextLabel, TOUR_NAME_TO_SLUG } from '../../utils/tournamentClassification';
import { TOUR_COLORS } from '../../constants/colors';
import { getCurrentRound } from '../../utils/formatThruDisplay';
import { formatPurse } from '../shared/TourHeroHelpers';
import { TourPill } from '../shared/TourPill';
import { EventTag, type EventTagKind } from '../shared/EventTag';
import { WinnerPill } from '../shared/WinnerPill';
import { TournamentMeta } from '../shared/TournamentMeta';
import { deriveFieldStrength } from '../../utils/deriveFieldStrength';
import type { DefendingChampionEntry } from '../../hooks/useScheduleDefendingChampionPhotos';

// SeasonTournament has no tour_code; derive from its display tourName.
// TOUR_NAME_TO_SLUG returns lowercase slugs (pga, liv, euro, etc.) — translate
// to our DB-cased TourMap keys.
const SLUG_TO_DB_CODE: Record<string, string> = {
  pga: 'pga',
  liv: 'LIV',
  euro: 'EURO',
  pgad: 'PGAD',
  champ: 'CHAMP',
  lpga: 'LPGA',
};

interface ScheduleTournamentCardProps {
  tournament: TourTournament | SeasonTournament;
  className?: string;
  compact?: boolean;
  leaderWinner?: TournamentLeaderWinner;
  defendingChampion?: DefendingChampionEntry | null;
}

function isSeasonTournament(t: TourTournament | SeasonTournament): t is SeasonTournament {
  return 'startDate' in t;
}

function getMonthAbbr(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
}

function getDayNum(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return String(d.getUTCDate());
}

function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return '#94A3B8';
  if (score < 0) return '#F7931E';
  if (score > 0) return '#EF4444';
  return '#94A3B8';
}

/**
 * Resolve EventTag variant from the classification label.
 * Priority: major > playoff > signature > rolex (defensive — typically single-designation).
 */
function resolveEventTag(contextLabel: string): EventTagKind | null {
  if (contextLabel === 'MAJOR CHAMPIONSHIP') return 'major';
  if (contextLabel === 'PLAYOFF EVENT') return 'playoff';
  if (contextLabel === 'SIGNATURE EVENT') return 'signature';
  if (contextLabel === 'ROLEX SERIES') return 'rolex';
  return null;
}

export function ScheduleTournamentCard({
  tournament,
  className,
  compact = false,
  leaderWinner,
  defendingChampion,
}: ScheduleTournamentCardProps) {
  const navigate = useNavigate();

  const venueName = isSeasonTournament(tournament) ? tournament.venueName : tournament.venue_name;
  const venueCity = isSeasonTournament(tournament) ? tournament.venueCity : tournament.venue_city;
  const startDate = isSeasonTournament(tournament) ? tournament.startDate : tournament.start_date;
  const tourName = isSeasonTournament(tournament) ? tournament.tourName : tournament.tour_full_name;
  const tourCode = isSeasonTournament(tournament)
    ? (SLUG_TO_DB_CODE[TOUR_NAME_TO_SLUG[tournament.tourName] ?? ''] ?? null)
    : (tournament as TourTournament).tour_code ?? null;

  const winnerFirstName = isSeasonTournament(tournament) ? tournament.winnerFirstName : null;
  const winnerLastName = isSeasonTournament(tournament) ? tournament.winnerLastName : null;

  const isFinal = tournament.status === 'closed' || tournament.status === 'complete';
  const isLive = tournament.status === 'inprogress';

  const contextLabel = getContextLabel({ name: tournament.name, tourName: tourName ?? undefined });
  const eventTag = resolveEventTag(contextLabel);
  const isMajor = eventTag === 'major';
  const isSignatureTier = eventTag === 'signature' || eventTag === 'rolex';

  const venue = [venueName, venueCity].filter(Boolean).join(' · ');

  const hasSeasonWinner = winnerFirstName && winnerLastName && isFinal;
  const hasLeaderWinnerData = leaderWinner && isFinal;
  const hasLeaderData = leaderWinner && isLive;

  const winnerDisplay = hasSeasonWinner
    ? `${winnerFirstName?.charAt(0)}. ${winnerLastName}`
    : hasLeaderWinnerData ? leaderWinner!.displayName : null;
  const winnerPhotoUrl = hasLeaderWinnerData ? leaderWinner!.photoUrl : null;
  const winnerDisplayScore = leaderWinner?.displayScore ?? null;

  const displayDate = isFinal
    ? (isSeasonTournament(tournament) ? tournament.endDate : (tournament as TourTournament).end_date)
    : startDate;

  const handlePlayerTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const playerId = leaderWinner?.playerId;
    if (playerId) navigate(`/tourhub/player/${playerId}`);
  };

  // Tier accent — left border + optional bg tint
  const leftBorderColor = isLive
    ? TOUR_COLORS.liveGreen
    : isMajor
    ? '#F7931E'
    : isSignatureTier
    ? '#16A34A'
    : 'transparent';

  const rowBg = isMajor ? 'rgba(247,147,30,0.06)' : 'transparent';

  const ariaLabel = [
    tournament.name,
    isLive ? 'live' : isFinal ? 'completed' : 'upcoming',
    isLive && leaderWinner ? `leader ${leaderWinner.displayName} at ${leaderWinner.displayScore}` : null,
    isFinal && winnerDisplay ? `winner ${winnerDisplay}` : null,
    venueName ? `at ${venueName}` : null,
  ].filter(Boolean).join(', ');

  return (
    <div
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className={`w-full flex items-start gap-0 cursor-pointer active:bg-black/[0.02] transition-colors ${className || ''}`}
      style={{
        borderLeft: `3px solid ${leftBorderColor}`,
        background: rowBg,
      }}
      role="button"
      aria-label={ariaLabel}
    >
      {/* Date block — 42px column, slate-500 month, 22px day */}
      <div
        style={{
          flexShrink: 0,
          width: 42,
          padding: '14px 0 14px 8px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: '#64748B',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            lineHeight: 1,
            margin: 0,
          }}
        >
          {getMonthAbbr(displayDate)}
        </p>
        <p
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#0F172A',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            margin: '4px 0 0',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {getDayNum(displayDate)}
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '12px 16px 12px 10px' }}>
        {/* Tour pill + event tag row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          <TourPill tourCode={tourCode} />
          {eventTag && <EventTag kind={eventTag} />}
          {isLive && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 6px',
                borderRadius: 4,
                background: 'rgba(34,197,94,0.10)',
                border: '1px solid rgba(34,197,94,0.30)',
                color: '#16A34A',
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 0.6,
                lineHeight: 1,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A' }} />
              LIVE
              {leaderWinner?.round1 !== undefined && (() => {
                const roundInfo = getCurrentRound(
                  leaderWinner!.round1,
                  leaderWinner!.round2,
                  leaderWinner!.round3,
                  leaderWinner!.round4,
                );
                return roundInfo ? (
                  <span style={{ marginLeft: 2, fontWeight: 700, opacity: 0.8 }}>· R{roundInfo.currentRound}</span>
                ) : null;
              })()}
            </span>
          )}
        </div>

        {/* Tournament name — visual anchor */}
        <p
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '-0.3px',
            lineHeight: 1.2,
            margin: '0 0 4px',
          }}
        >
          {tournament.name}
        </p>

        {/* Live leader row (kept inline, not pill — only completed rows get a winner pill) */}
        {hasLeaderData && !isFinal && (
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              margin: '0 0 4px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: TOUR_COLORS.liveGreen,
            }}
          >
            Leader:{' '}
            <button
              type="button"
              onClick={handlePlayerTap}
              className="active:opacity-70 transition-opacity"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontWeight: 700 }}
            >
              {leaderWinner!.displayName}
            </button>
            <span
              style={{
                fontWeight: 800,
                marginLeft: 2,
                color: getScoreColor(leaderWinner!.score),
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {leaderWinner!.displayScore}
            </span>
          </p>
        )}

        {/* Winner pill — completed rows only */}
        {isFinal && winnerDisplay && (
          <WinnerPill
            name={winnerDisplay}
            photoUrl={winnerPhotoUrl}
            score={winnerDisplayScore}
            onPlayerTap={leaderWinner?.playerId ? handlePlayerTap : undefined}
          />
        )}

        {/* Date range + purse for upcoming */}
        {!isLive && !isFinal && (() => {
          const endDate = isSeasonTournament(tournament) ? null : (tournament as TourTournament).end_date;
          const purse = isSeasonTournament(tournament) ? null : (tournament as TourTournament).purse;
          const parts = [
            endDate && (() => {
              const s = new Date(startDate + 'T12:00:00');
              const e = new Date(endDate + 'T12:00:00');
              const sameMonth = s.getMonth() === e.getMonth();
              return sameMonth
                ? `${getMonthAbbr(startDate)} ${getDayNum(startDate)}–${getDayNum(endDate)}`
                : `${getMonthAbbr(startDate)} ${getDayNum(startDate)} – ${getMonthAbbr(endDate)} ${getDayNum(endDate)}`;
            })(),
            purse && formatPurse(purse),
          ].filter(Boolean);
          return parts.length > 0 ? (
            <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', margin: '0 0 3px' }}>{parts.join(' · ')}</p>
          ) : null;
        })()}

        {/* Venue — pin emoji + supporting line */}
        {venue && !compact && (
          <p
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: '#64748B',
              margin: 0,
            }}
          >
            <span style={{ fontSize: 11, lineHeight: 1, flexShrink: 0 }}>📍</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{venue}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function prefetchTournamentImages(_tournaments: (TourTournament | SeasonTournament)[]) {
  // No-op: list view no longer uses course images
}

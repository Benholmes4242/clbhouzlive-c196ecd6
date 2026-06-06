/**
 * TournamentHero - Full-bleed course photo with editorial narrative pills.
 *
 * Hero pill matrix (state-driven, computed inside this component):
 *   - Upcoming  (2 pills): days-to-start, defending champion
 *                          [Field-size pill DROPPED in Phase 1 — see audit D1.
 *                          No source for upcoming-tournament field count.]
 *   - Live      (3 pills): Round N (with LivePulse), leader+score (accent),
 *                          cut-or-red-figures
 *   - Completed (2 pills): Won by {margin} (accent), {underPar} finished under par
 *
 * Pill placement: rendered ABOVE the title in the upper-mid overlay region.
 * The bottom of the gradient is too dark for the 'normal' pill variant to read
 * (see audit D6 / placement clarification).
 */

import { format, isSameMonth } from 'date-fns';
import type { TourTournament } from '../../hooks/useTourHubData';
import { SHELL_BG, SURFACE, WHITE_ALPHA_06, WHITE_ALPHA_08 } from '../../_shared/tokens';

const COUNTRY_NAMES: Record<string, string> = {
  USA: 'United States', ENG: 'England', SCO: 'Scotland', WAL: 'Wales', IRL: 'Ireland',
  MEX: 'Mexico', CAN: 'Canada', AUS: 'Australia', RSA: 'South Africa', ESP: 'Spain',
  GER: 'Germany', FRA: 'France', JPN: 'Japan', KOR: 'South Korea', CHN: 'China',
  NZL: 'New Zealand', SWE: 'Sweden', DEN: 'Denmark', NOR: 'Norway', FIN: 'Finland',
  ITA: 'Italy', ARG: 'Argentina', COL: 'Colombia', VEN: 'Venezuela', BRA: 'Brazil',
  ZIM: 'Zimbabwe', FIJ: 'Fiji', THA: 'Thailand', PHI: 'Philippines', IND: 'India',
  TPE: 'Chinese Taipei', CHI: 'Chile', PAR: 'Paraguay', URU: 'Uruguay', PAN: 'Panama',
  BAH: 'Bahamas', BER: 'Bermuda', PUR: 'Puerto Rico', GRN: 'Grenada', TTO: 'Trinidad',
  AUT: 'Austria', BEL: 'Belgium', NED: 'Netherlands', POR: 'Portugal', CZE: 'Czech Republic',
  POL: 'Poland', SVK: 'Slovakia', HUN: 'Hungary', SUI: 'Switzerland', GBR: 'Great Britain',
  NIR: 'Northern Ireland',
};

function expandCountry(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

interface TournamentHeroProps {
  tournament: TourTournament;
  imageUrl: string | null;
  /**
   * Live leader summary, derived in the page (handles ties + team events).
   * Pass null for non-live tournaments.
   */
  leader?: { name: string; score: string | null } | null;
  /**
   * Full leaderboard rows — needed to compute Completed-state pills
   * (margin of victory, under-par count). Pass null/undefined for
   * upcoming/live tournaments.
   */
  leaderboard?: Array<{ position?: number | null; score?: number | null; status?: string | null }> | null;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isSameMonth(start, end)) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Days until tournament start, rounded up. Returns null for past dates.
 */
function computeDaysUntil(startDate: string | null | undefined): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  const ms = start.getTime() - now.getTime();
  if (ms <= 0) return null;
  return Math.ceil(ms / 86_400_000);
}

/**
 * Count entries with a sub-par total score. Treats null/undefined statuses
 * as participating; excludes WD/DQ. Used for the Completed-state field stat
 * — see audit D3 (universal across cut/no-cut events).
 */
function countUnderPar(
  leaderboard: TournamentHeroProps['leaderboard'] | null | undefined,
): number {
  if (!leaderboard || leaderboard.length === 0) return 0;
  let count = 0;
  for (const e of leaderboard) {
    if (e.status === 'WD' || e.status === 'DQ') continue;
    if (typeof e.score === 'number' && e.score < 0) count += 1;
  }
  return count;
}

function buildPills({
  status,
  tournament,
  leader,
  leaderboard,
}: {
  status: string;
  tournament: TourTournament;
  leader: TournamentHeroProps['leader'];
  leaderboard: TournamentHeroProps['leaderboard'];
}): MastheadPill[] {
  const isLive = status === 'inprogress';
  const isCompleted = status === 'closed';

  if (isLive) {
    const round = tournament.current_round ?? 1;
    return [
      { variant: 'live', value: `Round ${round}`, prefix: <LivePulse /> },
    ];
  }


  if (isCompleted) {
    const margin = computeMarginOfVictory(leaderboard ?? []);
    const underPar = countUnderPar(leaderboard);
    const pills: MastheadPill[] = [];
    if (margin != null && margin > 0) {
      pills.push({
        variant: 'highlight',
        value: `Won by ${margin} stroke${margin !== 1 ? 's' : ''}`,
      });
    }
    if (underPar > 0) {
      pills.push({ variant: 'normal', value: `${underPar} finished under par` });
    }
    return pills;
  }

  // Upcoming (status: 'scheduled' | 'created' | other)
  const days = computeDaysUntil(tournament.start_date);
  const pills: MastheadPill[] = [];
  if (days != null) {
    pills.push({
      variant: 'normal',
      value: `${days} day${days === 1 ? '' : 's'} to start`,
    });
  }
  if (tournament.defending_champion) {
    pills.push({
      variant: 'highlight',
      value: `Defending: ${tournament.defending_champion}`,
    });
  }
  return pills;
}

export function TournamentHero({ tournament, imageUrl, leader, leaderboard }: TournamentHeroProps) {
  const formattedPurse = tournament.purse
    ? `$${(tournament.purse / 1_000_000).toFixed(1)}M`
    : null;

  const dateRange = tournament.start_date && tournament.end_date
    ? formatDateRange(tournament.start_date, tournament.end_date)
    : null;

  const pills = useMemo(
    () => buildPills({ status: tournament.status, tournament, leader, leaderboard }),
    [tournament, leader, leaderboard],
  );

  return (
    <div style={{ background: SHELL_BG }}>
      {/* Full-bleed hero image with gradient */}
      <div
        style={{
          position: 'relative',
          height: '220px',
          overflow: 'hidden',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={tournament.venue_name || tournament.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 40%',
            }}
            loading="eager"
            fetchPriority="high"
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 100%)',
            }}
          />
        )}

        {/* Dark gradient overlay — top and bottom */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.0) 35%, rgba(15,23,42,0.75) 70%, rgba(15,23,42,1) 100%)',
          }}
        />

        {/* Top — narrative pills (replaces the legacy '⚡ TOUR' eyebrow chip).
            Rendered in the upper-mid overlay where the gradient is faint enough
            for the 'normal' variant to read. */}
        {(pills.length > 0 || dateRange) && (
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: 16,
              right: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minWidth: 0 }}>
              {pills.map((p, i) => (
                <PillView key={`${p.variant}-${p.value}-${i}`} pill={p} />
              ))}
            </div>
            {dateRange && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  color: 'rgba(255,255,255,0.75)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {dateRange}
              </span>
            )}
          </div>
        )}

        {/* Bottom — location + tournament name */}
        <div style={{ position: 'absolute', bottom: 0, left: 16, right: 16, paddingBottom: 14 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: SURFACE, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 6px' }}>
            {tournament.name}
          </h1>
          {(tournament.venue_city || tournament.venue_country) && (
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.70)',
              letterSpacing: '-0.005em',
            }}>
              {[tournament.venue_city, expandCountry(tournament.venue_country)].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* 3-col stat grid on slate */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `0.5px solid ${WHITE_ALPHA_08}` }}>
        {[
          { label: 'PURSE', value: formattedPurse ?? '—' },
          { label: 'PAR', value: tournament.venue_par ? `Par ${tournament.venue_par}` : '—' },
          { label: 'YARDS', value: tournament.venue_yardage ? `${tournament.venue_yardage.toLocaleString()}` : '—' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '9px 0 11px', textAlign: 'center' as const, borderRight: i < 2 ? `0.5px solid ${WHITE_ALPHA_06}` : 'none' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.16em', marginBottom: '3px' }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: SURFACE, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

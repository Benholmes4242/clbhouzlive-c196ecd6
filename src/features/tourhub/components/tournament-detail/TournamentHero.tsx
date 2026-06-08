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
import { SHELL_BG, SURFACE } from '../../_shared/tokens';

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
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isSameMonth(start, end)) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export function TournamentHero({ tournament, imageUrl }: TournamentHeroProps) {
  const formattedPurse = tournament.purse
    ? `$${(tournament.purse / 1_000_000).toFixed(1)}M`
    : null;

  const dateRange = tournament.start_date && tournament.end_date
    ? formatDateRange(tournament.start_date, tournament.end_date)
    : null;

  return (
    <div style={{ background: SHELL_BG }}>
      {/* Full-bleed hero image with gradient */}
      <div
        style={{
          position: 'relative',
          height: '268px',
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
              'linear-gradient(to bottom, rgba(15,23,42,0.40) 0%, rgba(15,23,42,0.0) 25%, rgba(15,23,42,0.05) 65%, rgba(15,23,42,0.15) 100%)',
          }}
        />

        {/* Top — date range only (pills removed) */}
        {dateRange && (
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: 16,
              right: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
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
          </div>
        )}

        {/* Bottom — location + tournament name */}
        <div style={{ position: 'absolute', bottom: 52, left: 16, right: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: SURFACE, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 6px', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
            {tournament.name}
          </h1>
          {(tournament.venue_city || tournament.venue_country) && (
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '-0.005em',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}>
              {[tournament.venue_city, expandCountry(tournament.venue_country)].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        {/* PURSE/PAR/YARDS — glass bar over the photo */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          background: 'rgba(10,14,20,0.18)',
          backdropFilter: 'blur(22px) saturate(160%)',
          WebkitBackdropFilter: 'blur(22px) saturate(160%)',
          borderTop: '0.5px solid rgba(255,255,255,0.22)',
        }}>
          {[
            { label: 'PURSE', value: formattedPurse ?? '—' },
            { label: 'PAR', value: tournament.venue_par ? `Par ${tournament.venue_par}` : '—' },
            { label: 'YARDS', value: tournament.venue_yardage ? `${tournament.venue_yardage.toLocaleString()}` : '—' },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '9px 0 11px', textAlign: 'center' as const, borderRight: i < 2 ? '0.5px solid rgba(255,255,255,0.14)' : 'none' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.80)', letterSpacing: '0.16em', marginBottom: '3px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: SURFACE, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 4px rgba(0,0,0,0.65)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * TournamentHero - Full-bleed course photo with gradient overlay
 */

import { format, isSameMonth } from 'date-fns';
import type { TourTournament } from '../../hooks/useTourHubData';

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
    <div style={{ background: '#0F172A' }}>
      {/* Full-bleed hero image with gradient */}
      <div
        style={{
          position: 'relative',
          height: 'calc(220px + var(--sat, env(safe-area-inset-top, 0px)))',
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

        {/* Top — eyebrow + live badge */}
        <div style={{ position: 'absolute', top: 'max(env(safe-area-inset-top, 0px), 14px)', left: 16, right: 16 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            ⚡ {tournament.tour_full_name?.toUpperCase() ?? 'PGA TOUR'}
          </span>
        </div>

        {/* Bottom — location + tournament name */}
        <div style={{ position: 'absolute', bottom: 0, left: 16, right: 16, paddingBottom: 14 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 6px' }}>
            {tournament.name}
          </h1>
          {(tournament.venue_city || tournament.venue_country) && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600, marginBottom: 2 }}>
              📍 {[tournament.venue_city, expandCountry(tournament.venue_country)].filter(Boolean).join(', ')}
            </div>
          )}
          {dateRange && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              {dateRange}
            </div>
          )}
        </div>
      </div>

      {/* 4-col stat grid on slate */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        {[
          { label: 'PURSE', value: formattedPurse ?? '—' },
          { label: 'PAR', value: tournament.venue_par ? `Par ${tournament.venue_par}` : '—' },
          { label: 'YARDS', value: tournament.venue_yardage ? `${tournament.venue_yardage.toLocaleString()}` : '—' },
          { label: 'COURSE', value: tournament.venue_course_name ?? tournament.venue_name ?? '—' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '9px 0 11px', textAlign: 'center' as const, borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', marginBottom: '3px' }}>{s.label}</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, padding: '0 4px' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

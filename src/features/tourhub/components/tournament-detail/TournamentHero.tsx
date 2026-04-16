/**
 * TournamentHero - Full-bleed course photo with gradient overlay
 */

import { format, isSameMonth } from 'date-fns';
import type { TourTournament } from '../../hooks/useTourHubData';

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

  const isLive = tournament.status === 'inprogress';
  const isUpcoming = tournament.status === 'scheduled' || tournament.status === 'created';
  const isCompleted = tournament.status === 'closed' || tournament.status === 'complete';
  const statusLabel = isLive ? 'LIVE' : isUpcoming ? 'UPCOMING' : 'FINAL';
  const badgeColor = isLive ? '#22C55E' : isUpcoming ? '#F7931E' : '#94A3B8';
  const badgeBg = isLive ? 'rgba(34,197,94,0.15)' : isUpcoming ? 'rgba(247,147,30,0.15)' : 'rgba(148,163,184,0.15)';

  const dateRange = tournament.start_date && tournament.end_date
    ? formatDateRange(tournament.start_date, tournament.end_date)
    : null;

  return (
    <div style={{ background: '#0F172A' }}>
      {/* Full-bleed hero image with gradient */}
      <div
        style={{
          position: 'relative',
          height: 220,
          overflow: 'hidden',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
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
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 100%)' }} />
        )}

        {/* Dark gradient overlay — top and bottom */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.0) 35%, rgba(15,23,42,0.75) 70%, rgba(15,23,42,1) 100%)' }} />

        {/* Top — eyebrow + live badge */}
        <div style={{ position: 'absolute', top: 'max(env(safe-area-inset-top, 0px), 14px)', left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
              ⚡ {tournament.tour_full_name?.toUpperCase() ?? 'PGA TOUR'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6, background: badgeBg, border: `1px solid ${badgeColor}44`, backdropFilter: 'blur(8px)' }}>
            {isLive && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 9, fontWeight: 900, color: badgeColor, letterSpacing: '0.12em' }}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Bottom — location + tournament name */}
        <div style={{ position: 'absolute', bottom: 0, left: 16, right: 16, paddingBottom: 14 }}>
          {(tournament.venue_city || tournament.venue_country) && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 4 }}>
              📍 {[tournament.venue_city, tournament.venue_country].filter(Boolean).join(', ')}
              {dateRange && <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.35)' }}>· {dateRange}</span>}
            </div>
          )}
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0 }}>
            {tournament.name}
          </h1>
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

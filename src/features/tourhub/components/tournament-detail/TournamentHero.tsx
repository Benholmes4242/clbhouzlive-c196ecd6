/**
 * TournamentHero - Editorial slate header with contained course thumbnail
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
  const statusLabel = isLive ? 'LIVE' : isUpcoming ? 'UPCOMING' : 'FINAL';
  const badgeColor = isLive ? '#22C55E' : isUpcoming ? '#F7931E' : '#94A3B8';

  return (
    <div style={{ background: '#0F172A', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0' }}>
      {/* Amber tour eyebrow */}
      <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
        ⚡ {tournament.tour_full_name?.toUpperCase() ?? 'PGA TOUR'}
      </div>

      {/* Tournament name + status chip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0, flex: 1 }}>
          {tournament.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.07)', border: `1px solid ${badgeColor}44`, flexShrink: 0, marginTop: '2px' }}>
          {isLive && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '9px', fontWeight: 900, color: badgeColor, letterSpacing: '0.12em' }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Course image — contained editorial thumbnail */}
      <div style={{ width: '100%', height: '120px', borderRadius: '10px 10px 0 0', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', position: 'relative', flexShrink: 0 }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={tournament.venue_name || tournament.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }}
            loading="eager"
            fetchPriority="high"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 100%)' }} />
        )}
        {/* Location bottom-left overlay */}
        {(tournament.venue_city || tournament.venue_country) && (
          <div style={{ position: 'absolute', bottom: '8px', left: '10px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              📍 {[tournament.venue_city, tournament.venue_country].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        {/* Dates top-right overlay */}
        <div style={{ position: 'absolute', top: '8px', right: '10px' }}>
          <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
            {formatDateRange(tournament.start_date, tournament.end_date)}
          </span>
        </div>
      </div>

      {/* 4-col quick facts grid on slate */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        {[
          { label: 'PURSE', value: formattedPurse ?? '—' },
          { label: 'PAR', value: tournament.venue_par ? `Par ${tournament.venue_par}` : '—' },
          { label: 'YARDS', value: tournament.venue_yardage ? `${tournament.venue_yardage.toLocaleString()}` : '—' },
          { label: 'COURSE', value: tournament.venue_course_name ?? tournament.venue_name ?? '—' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '9px 0 11px', textAlign: 'center', borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', marginBottom: '3px' }}>{s.label}</div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, padding: '0 4px' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

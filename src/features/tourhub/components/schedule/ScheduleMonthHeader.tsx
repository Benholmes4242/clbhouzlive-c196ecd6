/**
 * ScheduleMonthHeader - Dispatch rule marker style
 * 9px/900 uppercase with vertical bar accent
 */

const TOUR_LABELS: Record<string, string> = {
  pga: 'PGA',
  EURO: 'DP World',
  LPGA: 'LPGA',
  CHAMP: 'Champions',
  PGAD: 'Korn Ferry',
  LIV: 'LIV',
};

interface ScheduleMonthHeaderProps {
  monthLabel: string;
  eventCount: number;
  tourBreakdown?: Record<string, number>;
  className?: string;
}

export function ScheduleMonthHeader({ 
  monthLabel, 
  eventCount,
  tourBreakdown,
}: ScheduleMonthHeaderProps) {
  const breakdownParts = tourBreakdown
    ? Object.entries(tourBreakdown)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([code, count]) => `${count} ${TOUR_LABELS[code] || code}`)
    : [];

  return (
    <div style={{ padding: '20px 20px 0', background: '#F8FAFC' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
        <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
        <h3 style={{
          fontSize: '9px',
          fontWeight: 900,
          color: '#0F172A',
          letterSpacing: '0.16em',
          textTransform: 'uppercase' as const,
          margin: 0,
        }}>
          {monthLabel}
        </h3>
        <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: '#F7931E' }}>
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
      {breakdownParts.length > 0 && (
        <p style={{
          fontSize: '11px',
          color: '#94A3B8',
          margin: '0 0 10px',
          lineHeight: 1.4,
          paddingLeft: '11px',
        }}>
          {breakdownParts.join(' · ')}
        </p>
      )}
    </div>
  );
}

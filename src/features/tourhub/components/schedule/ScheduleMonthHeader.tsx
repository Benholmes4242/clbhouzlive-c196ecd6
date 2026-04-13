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
    <div
      style={{
        padding: '12px 16px 8px',
        borderBottom: '0.5px solid rgba(15,23,42,0.07)',
        background: 'rgba(15,23,42,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: 3, height: 12, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
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
          margin: '4px 0 0',
          lineHeight: 1.4,
          paddingLeft: '11px',
        }}>
          {breakdownParts.join(' · ')}
        </p>
      )}
    </div>
  );
}

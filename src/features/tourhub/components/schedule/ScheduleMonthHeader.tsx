/**
 * ScheduleMonthHeader - Dispatch rule marker style
 * 9px/900 uppercase with vertical bar accent.
 *
 * Per Schedule polish brief — current month gets amber rule + "THIS MONTH" tag.
 */

import { getTourMeta } from '../../constants/tourMap';

interface ScheduleMonthHeaderProps {
  monthLabel: string;
  eventCount: number;
  tourBreakdown?: Record<string, number>;
  isCurrentMonth?: boolean;
  className?: string;
}

export function ScheduleMonthHeader({
  monthLabel,
  eventCount,
  tourBreakdown,
  isCurrentMonth = false,
}: ScheduleMonthHeaderProps) {
  const breakdownParts = tourBreakdown
    ? Object.entries(tourBreakdown)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([code, count]) => `${count} ${getTourMeta(code)?.short ?? code}`)
    : [];

  const accentColor = isCurrentMonth ? '#F7931E' : '#0F172A';

  return (
    <div
      style={{
        padding: '12px 16px 8px',
        borderBottom: '0.5px solid rgba(15,23,42,0.07)',
        background: isCurrentMonth ? 'rgba(247,147,30,0.04)' : 'rgba(15,23,42,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 12, background: accentColor, borderRadius: 1, flexShrink: 0 }} />
        <h3 style={{
          fontSize: 9,
          fontWeight: 900,
          color: '#0F172A',
          letterSpacing: '0.16em',
          textTransform: 'uppercase' as const,
          margin: 0,
        }}>
          {monthLabel}
        </h3>
        {isCurrentMonth && (
          <span
            style={{
              padding: '2px 6px',
              background: 'rgba(247,147,30,0.10)',
              border: '1px solid rgba(247,147,30,0.30)',
              borderRadius: 3,
              fontSize: 9,
              fontWeight: 900,
              color: '#F7931E',
              letterSpacing: '0.1em',
              lineHeight: 1,
            }}
          >
            THIS MONTH
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#F7931E' }}>
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
      {breakdownParts.length > 0 && (
        <p style={{
          fontSize: 11,
          color: '#94A3B8',
          margin: '4px 0 0',
          lineHeight: 1.4,
          paddingLeft: 11,
        }}>
          {breakdownParts.join(' · ')}
        </p>
      )}
    </div>
  );
}

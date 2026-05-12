/**
 * ScheduleMonthHeader — slate sub-section eyebrow pattern (§6).
 *
 * Single amber accent: optional THIS MONTH pill on the current month row.
 * No vertical rules, no bg tint.
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

  return (
    <div
      style={{
        padding: '14px 16px 8px',
        borderBottom: '0.5px solid rgba(15,23,42,0.07)',
        background: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          color: '#64748B',
          letterSpacing: '0.16em',
          textTransform: 'uppercase' as const,
        }}>
          {monthLabel}
        </span>
        {isCurrentMonth && (
          <span style={{
            padding: '2px 6px',
            background: '#FEF3E7',
            border: '1px solid rgba(247,147,30,0.32)',
            borderRadius: 3,
            fontSize: 9,
            fontWeight: 800,
            color: '#F7931E',
            letterSpacing: '0.10em',
            lineHeight: 1,
          }}>
            THIS MONTH
          </span>
        )}
        <span style={{
          marginLeft: 'auto',
          fontSize: 13,
          fontWeight: 700,
          color: '#0F172A',
          letterSpacing: '-0.005em',
        }}>
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
      {breakdownParts.length > 0 && (
        <p style={{
          fontSize: 12,
          fontWeight: 500,
          color: '#64748B',
          margin: '4px 0 0',
          lineHeight: 1.4,
        }}>
          {breakdownParts.join(' · ')}
        </p>
      )}
    </div>
  );
}

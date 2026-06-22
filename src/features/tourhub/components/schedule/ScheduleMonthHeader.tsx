/**
 * ScheduleMonthHeader — slate sub-section eyebrow pattern (§6).
 *
 * Single amber accent: optional THIS MONTH pill on the current month row.
 * No vertical rules, no bg tint.
 */


import { AMBER, AMBER_BORDER, AMBER_SOFT_BG, INK, INK_MUTE, INK_TINT_07 } from '../../_shared/tokens';

interface ScheduleMonthHeaderProps {
  monthLabel: string;
  eventCount: number;
  isCurrentMonth?: boolean;
  className?: string;
}

export function ScheduleMonthHeader({
  monthLabel,
  eventCount,
  isCurrentMonth = false,
}: ScheduleMonthHeaderProps) {
  return (
    <div
      style={{
        padding: '14px 16px 8px',
        borderBottom: `0.5px solid ${INK_TINT_07}`,
        background: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          color: INK_MUTE,
          letterSpacing: '0.16em',
          textTransform: 'uppercase' as const,
        }}>
          {monthLabel}
        </span>
        {isCurrentMonth && (
          <span style={{
            padding: '2px 6px',
            background: AMBER_SOFT_BG,
            border: `1px solid ${AMBER_BORDER}`,
            borderRadius: 3,
            fontSize: 9,
            fontWeight: 800,
            color: AMBER,
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
          color: INK,
          letterSpacing: '-0.005em',
        }}>
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
      </div>
    </div>
  );
}

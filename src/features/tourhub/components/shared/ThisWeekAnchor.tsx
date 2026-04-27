/**
 * ThisWeekAnchor — "THIS WEEK · APR 28 – MAY 4" inline band.
 *
 * Marks current-week boundary on the All tab. Tracked by IntersectionObserver
 * in the parent so the sticky "Today" jump pill knows when to show/hide.
 */
import { forwardRef } from 'react';

interface ThisWeekAnchorProps {
  label: string; // e.g. "APR 28 – MAY 4"
}

export const ThisWeekAnchor = forwardRef<HTMLDivElement, ThisWeekAnchorProps>(
  function ThisWeekAnchor({ label }, ref) {
    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 18px',
          background: 'linear-gradient(90deg, rgba(247,147,30,0.08) 0%, rgba(247,147,30,0) 80%)',
          borderTop: '1px solid rgba(247,147,30,0.30)',
          borderBottom: '1px solid rgba(247,147,30,0.30)',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#F7931E',
            boxShadow: '0 0 0 3px rgba(247,147,30,0.18)',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: '#F7931E',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          This Week · {label}
        </span>
        <span
          style={{
            flex: 1,
            height: 1,
            background: 'rgba(247,147,30,0.30)',
            marginLeft: 4,
          }}
        />
      </div>
    );
  }
);

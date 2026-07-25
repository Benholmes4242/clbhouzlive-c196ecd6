import { memo } from 'react';

const MUTED = 'rgba(15,23,42,0.45)';
const SOFT = '#475569';
const AGE = 'rgba(15,23,42,0.30)';

/** Quiet 10px location marker used by the Discover ledger sub-lines. */
export const PinIcon = memo(function PinIcon() {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ flexShrink: 0, display: 'block' }}
    >
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" stroke={MUTED} strokeWidth="2.4" />
      <circle cx="12" cy="10" r="2.4" stroke={MUTED} strokeWidth="2.4" />
    </svg>
  );
});

/**
 * Canonical Discover ledger sub-line: pin + club (truncates) + relative age.
 * Pin and age never compress; the club name is the element that ellipsises.
 */
export function LedgerSubline({
  courseName,
  when,
}: {
  courseName?: string | null;
  when?: string | null;
}) {
  if (!courseName && !when) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
        maxWidth: '100%',
        verticalAlign: 'middle',
      }}
    >
      
      <span
        style={{
          color: SOFT,
          fontWeight: 600,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {courseName ?? ''}
      </span>
      {when ? (
        <span style={{ flexShrink: 0, fontSize: 11, color: AGE }}>{when}</span>
      ) : null}
    </span>
  );
}

export default PinIcon;

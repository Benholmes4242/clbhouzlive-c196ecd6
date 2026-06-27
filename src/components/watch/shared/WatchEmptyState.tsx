import { memo } from 'react';
import { X, ArrowLeft } from 'lucide-react';

type WatchEmptyAction = {
  label: string;
  onClick: () => void;
  /** Icon hint. 'clear' shows an X; 'back' shows a left arrow. */
  icon?: 'clear' | 'back';
};

interface WatchEmptyStateProps {
  title: string;
  message: string;
  action?: WatchEmptyAction;
}

const AMBER = '#F7931E';
const INK = '#0F172A';
const MUTED = '#64748B';

/** Custom brand mark — amber ground/hole + amber pin (NOT the OS ⛳ emoji). */
function FlagMark() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* soft amber halo */}
      <circle cx="28" cy="28" r="26" fill={AMBER} fillOpacity="0.08" />
      {/* ground line */}
      <ellipse cx="28" cy="44" rx="14" ry="2" fill={AMBER} fillOpacity="0.25" />
      {/* pin pole */}
      <rect x="27" y="14" width="2" height="30" rx="1" fill={INK} />
      {/* flag */}
      <path d="M29 15 L43 19 L29 23 Z" fill={AMBER} />
    </svg>
  );
}

function WatchEmptyStateInner({ title, message, action }: WatchEmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <FlagMark />
      </div>

      <p
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: INK,
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </p>

      <p
        style={{
          marginTop: 6,
          fontSize: 13.5,
          lineHeight: 1.45,
          color: MUTED,
          maxWidth: 280,
        }}
      >
        {message}
      </p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            marginTop: 18,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            borderRadius: 999,
            background: AMBER,
            color: '#FFFFFF',
            fontSize: 13.5,
            fontWeight: 700,
            border: 'none',
            boxShadow: '0 2px 8px rgba(247,147,30,0.25)',
            cursor: 'pointer',
          }}
        >
          {action.icon === 'clear' ? (
            <X size={15} strokeWidth={2.5} />
          ) : action.icon === 'back' ? (
            <ArrowLeft size={15} strokeWidth={2.5} />
          ) : null}
          {action.label}
        </button>
      )}
    </div>
  );
}

export const WatchEmptyState = memo(WatchEmptyStateInner);
export default WatchEmptyState;
